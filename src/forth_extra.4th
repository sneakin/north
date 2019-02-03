write-helo
write-crnl

: immediate dict add-immediate ;

: (
  *tokenizer* literal 41 tokenizer-skip-until
; immediate

( Add the latest dictionary entry to the immediate dictionary and remove it from the normal dictionary. )
: immediate-only immediate drop-dict ;

( Make ; print the new entry's name and OK. )
: ;
dict dict-entry-name write-string drop2 write-ok
literal endcol jump-entry-data
; immediate-only

( Print the top of stack. )
: . arg0 write-int ;

( pause while defining. )
: PAUSE pause ; immediate-only

( Jump to the word after UNLESS and evaluate until THEN if the top of stack is zero. )
: UNLESS
      literal literal terminator literal ifthenreljump
      literal 3 returnN
; immediate-only

(
" EOS" lit eos constant drop2
" Not Found" lit not-found constant drop2
" Not Number" lit not-number constant drop2
"  " lit space constant drop2
)
: eos " EOS" return1 ;
: not-found " Not Found" return1 ;
: not-number  " Not Number" return1 ;
: space "  " return1 ;

( Stop evaluation for an UNLESS or IF. )
: THEN
  args cell+ swapdrop terminator stack-find swapdrop
  2dup swap int-sub
  swap poke
; immediate-only

( Read the next token and look it up in immediate and regular dictionaries. )
: POSTPONE
  *tokenizer* next-token UNLESS literal eos eos error return0 THEN
  compile not UNLESS swapdrop return1 THEN
  swapdrop
  literal literal swap
  return2
; immediate

( Causes the caller to return all of its local data shifted over the frame and return pointers. )
: return-locals
  end drop2
  locals here int-sub cell/ swapdrop returnN
;

: test-return-locals
  literal 1 literal 2 literal 3 return-locals
;

( Return all the locals except the number from the top. )
: return-locals-less ( num-to-overwrite )
  end drop2
  here swap
  cell* swapdrop
  locals swap int-sub
  swap int-sub cell/ swapdrop returnN
;

: test-return-locals-less
  literal 1 literal 2 literal 3 literal 4 literal 5 arg0 return-locals-less
;

( Jump to the word after IF and evaluate until THEN if the top of stack is not zero. )
: IF
  literal not
  POSTPONE UNLESS
  return-locals
; immediate-only

( Return the lesser argument. )
: min
  arg1 arg0 < IF arg1 return1 THEN
  arg0 return1
;

( Return the greater argument. )
: max
  arg1 arg0 < IF arg0 return1 THEN
  arg1 return1
;

( Place the arguments in min max order inplace. )
: minmax
  arg1 arg0 > IF arg1 arg0 set-arg1 set-arg0 THEN
;

( Tail call the dictionary definition currently being defined. )
: RECURSE
  literal literal
  dict
  literal jump-entry-data
  return-locals
; immediate

( Get the address of the operation after the callsite. )
: next-op
  return-address cell+ return1
;

( Get the address N cells from the callsite. )
: next-op+
  return-address arg0 cell+n return1
;

( Starts a new frame with the start and hopefully end of loop pointers as arguments. )
: DO
  ( Loop pointer )
  literal literal literal 6 literal next-op+ literal swapdrop
  ( Abort pointer and return address when looping. )
  literal dup literal literal terminator literal int-add
  literal begin
  return-locals
; immediate-only

( Start a new loop iteration. )
: AGAIN
  literal arg0
  literal jump
  return-locals
; immediate-only

( Exit a loop. )
: LEAVE
  literal exit
  return-locals
; immediate-only

( Search up the stack replacing the first terminator with an offset to the TOS. )
: patch-terminator ( start-offset -- )
  arg0 terminator stack-find swapdrop ( arg term )
  2dup swap int-sub ( arg term dist )
  swap poke ( arg )
;

( literal 2 lit frame-size constant drop2 )
( literal 8 lit frame-byte-size constant drop2 )

( jump back to do )
: UNTIL
    ( Use this w/o IF: literal arg0 literal ifthenjump )
    POSTPONE UNLESS
      POSTPONE AGAIN
      POSTPONE THEN
    literal end
    ( Patch the loop's abort increment. )
    here literal 16 int-add patch-terminator drop
  return-locals
; immediate-only

( jump back to do )
: WHILE
    ( Use this w/o IF: literal arg0 literal ifthenjump )
    POSTPONE IF
      POSTPONE AGAIN
      POSTPONE THEN
    literal end
    ( Patch the loop's abort increment. )
    here literal 16 int-add patch-terminator drop
  return-locals
; immediate-only

( Redefine or create the next word as a colon definition. )
: ::
  *tokenizer* next-token
  dup UNLESS eos eos error return0 THEN
  dup1 dict dict-lookup dup UNLESS drop3 intern-seq literal 0 literal 0 add-dict THEN
  docol> return2
;

: backtick?
  arg0 " `" string-equal return1
;

( Read and look tokens up inserting `literal` before each. )
: `
  DO
    *tokenizer* next-token UNLESS drop2 LEAVE THEN
    swapdrop ( token )
    backtick? IF drop LEAVE THEN
    compile drop ( token addr )
    literal literal ( token addr lit )
    rot ( lit addr token )
  backtick? swapdrop UNTIL

  literal 3 return-locals-less
; immediate

: test-backtick-1
  ` write-ok write-ok write-ok `
  return-locals
; immediate

: test-backtick
  write-helo test-backtick-1 write-helo
;

( Loop an N number of times. The counter is in arg1.)
: DOTIMES[ ( times )
  literal zero
  POSTPONE DO
  return-locals
; immediate-only

: ]DOTIMES
  literal arg1 literal one literal int-add literal set-arg1
  literal arg1 literal arg2 literal < POSTPONE WHILE
  return-locals
; immediate-only

: test-DOTIMES
  literal 5 DOTIMES[ arg1 write-int write-crnl drop ]DOTIMES write-helo
;
  
: seq1 ( max min )
  arg1
  arg0
  2dup int-sub dallot

  ( todo already bumped the args for keeping the exit offset on stack )
  do
    arg2 write-int arg1 arg0 seq-poke drop3
    write-ok write-crnl
    arg2 literal 10 equals IF again THEN
    arg2 literal 1 int-add set-arg2
    arg3 arg2 > while

  write-ok literal 1146048327 write-word drop
  local2 return1
;

: seq2 ( max min )
  arg1
  arg0
  2dup int-sub dallot

  DO
    arg2 write-int arg1 arg2 seq-poke drop3 ( fixme min != 0 is a problem )
    write-ok write-crnl
    arg2 literal 10 equals IF AGAIN THEN
    arg2 literal -10 equals IF LEAVE THEN
    arg2 literal 1 int-add set-arg2
    arg3 arg2 > WHILE

  write-ok literal 1146048327 write-word drop
  local2 return1
;

( Convert a single digit to an ASCII digit or letter. )
: char-digit-1
  arg0 abs-int
  local0 literal 10 >= IF
    local0 literal 10 int-sub
    dup literal 26 >= IF
      literal 26 int-sub
      literal 97 int-add
      return1
    THEN
    literal 65 int-add return1
  THEN
  local0 literal 48 int-add return1
;

( Convert an ASCII character to a digit. )
: digit-char-1
  arg0 upper-alpha? IF
    literal 65 int-sub
    literal 10 int-add
    return1
  THEN
  arg0 lower-alpha? IF
    literal 97 int-sub
    literal 10 int-add
    base 36 >= IF literal 26 int-add THEN
    return1
  THEN
  arg0 digit? IF
    literal 48 int-sub return1
  THEN
  literal 0 return1
;

: negative-sign?
  arg0 negative-sign equals return1
;

: base-char-to-int
  ( % is binary )
  arg0 literal 37 equals IF literal 2 return1 THEN
  ( & and # are decimal )
  arg0 literal 38 equals IF literal 10 return1 THEN
  arg0 literal 35 equals IF literal 10 return1 THEN
  ( $ and x are hexadecimal )
  arg0 literal 36 equals IF literal 16 return1 THEN
  arg0 literal 120 equals IF literal 16 return1 THEN
  ( not base char )
  literal 0 return1
;

: number-base-char?
  arg0 base-char-to-int UNLESS false return1 THEN
  true return1
;

: argn
  arg0 cell* cell+2 current-frame parent-frame swapdrop int-add peek set-arg0
;

: test-argn-inner
  literal 3 argn return1
;

: test-argn
  literal 6 literal 7 literal 8 literal 9 test-argn-inner
  literal 6 equals return1
;
  
( Converts a string pointer with length to an unsigned integer with the supplied base. )
: unsigned-number-base ( ptr-str length base )
  ( locals: base accumulator digit-counter ptr )
  arg0
  zero
  arg1
  arg2
  DO
    arg1 peek ( digit )
    number-base-char? swap
    negative-sign? swap
    rot or
    rotdrop2
    UNLESS
      whitespace? UNLESS
        terminator? IF LEAVE THEN
        digit? UNLESS literal 4 argn literal 10 > UNLESS LEAVE THEN THEN
        digit-char-1
        arg3 literal 4 argn int-mul
        int-add set-arg3
      THEN
    THEN

    drop
    arg1 cell+ set-arg1 drop
    arg2 literal 1 int-sub dup set-arg2
  WHILE

  local1 local2 not return2
;

( Converts a string to an unsigned integer with the supplied base. )
: unsigned-number-1 ( str )
  arg0 cell+ dup peek ( str ptr+1 value )
  number-base-char? IF ( str ptr+1 value )
    base-char-to-int swapdrop ( str ptr+1 base )
    rot seq-length swapdrop ( base ptr+1 len )
    literal 1 int-sub ( base ptr+1 len )
    swap cell+ swapdrop rot ( ptr+2 len base )
    unsigned-number-base
    return2
  THEN
  drop swap ( ptr+1 str )
  seq-length swapdrop ( ptr+1 length )
  dup1 peek
  ( todo recurse to the next character )
  negative-sign? swapdrop IF literal 1 int-sub
     swap cell+ swapdrop
     swap
  THEN ( ptr+2 length-1 )
  base ( ptr+1 length base )
  unsigned-number-base
  return2
;

: test-unsigned-number
  " 123" unsigned-number-1 drop literal 123 equals UNLESS false return1 THEN
  " &123" unsigned-number-1 drop literal 123 equals UNLESS false return1 THEN
  " #98" unsigned-number-1 drop literal 98 equals UNLESS false return1 THEN
  " x10" unsigned-number-1 drop literal 16 equals UNLESS false return1 THEN
  " $100" unsigned-number-1 drop literal 256 equals UNLESS false return1 THEN
  " %1000" unsigned-number-1 drop literal 8 equals UNLESS false return1 THEN
  " %1111" unsigned-number-1 drop literal 15 equals UNLESS false return1 THEN
  true return1
;

( Convert an unsigned integer value to a string. )
: unsigned-int-to-string-1 ( number -- str-ptr )
  arg0
  here
  DO
    arg2 base uint-mod char-digit swapdrop
    arg2 base uint-div dup set-arg2
  WHILE
  here dup local1 swap uint-sub cell/ swapdrop literal 4 uint-sub intern return1
;

( Patch the bootstrap functions. )
:: char-digit literal char-digit-1 jump-entry-data ;
:: digit-char literal digit-char-1 jump-entry-data ;
:: unsigned-number literal unsigned-number-1 jump-entry-data ;
:: unsigned-int-to-string literal unsigned-int-to-string-1 jump-entry-data ;

: write-space space write-string ;

: decompile-write-addr
  arg0 write-unsigned-int write-space write-crnl
;

: decompile-seq-by-addr
  arg0 literal decompile-write-addr map-seq return0
;

: decompile-by-addr
  arg0 dict-entry-data decompile-seq-by-addr
;

: dict-entry-indirect?
  arg0 dict-entry-code swapdrop
  literal call-data-seq dict-entry-code swapdrop
  dup1 equals UNLESS
    literal call-data dict-entry-code swapdrop
    equals UNLESS
      false return1
    THEN
  THEN

  true return1
;

: dict-entry?
  arg0 dict-entry-name seq-length cell* swapdrop
  int-add cell+ peek
  terminator?
  return1
;

: decompile-write-name
  arg0 dict-entry? IF
    dict-entry-name write-string write-space
    return0
  THEN
  write-unsigned-int write-space
  return0
;

: decompile-seq-by-name
  arg0 literal decompile-write-name map-seq return0
;

( fixme needs to handle non-sequence definitions, or those defs need lengths )
: decompile-by-name
  arg0 dict-entry? IF
    " : " write-string drop
          dict-entry-name write-line drop
          dict-entry-code dict-entry? IF
            ( fixme need to make the asm code indirectly called for this to work )
            " does> " write-string drop dict-entry-name write-line drop
          THEN drop
    dict-entry-data decompile-seq-by-name
  THEN
;

( Returns the number of definitions in the dictionary. )
: dict-count ( dictionary -- count )
  literal 0
  arg0
  
  DO arg2 literal 1 int-add set-arg2
     arg1 dict-entry-next swapdrop dup set-arg1
  null? swapdrop UNTIL

  local0 return1
;

: memdump-bytes ( ptr num-bytes )
  arg0 literal 0 > UNLESS return0 THEN
  arg1 peek write-unsigned-int write-space
  drop
  arg0 cell- swapdrop set-arg0
  arg1 cell+ swapdrop set-arg1
  RECURSE
;

: memdump-line ( start-ptr num-bytes )
  arg1 write-unsigned-int write-tab
  arg0 literal 32 min rotdrop2 memdump-bytes
  write-crnl
;

: memdump ( start-ptr num-bytes )
  arg0 literal 0 > UNLESS return0 THEN
  arg1 arg0 literal 32 min rotdrop2 memdump-line ( arg1 bytes-to-dump )
  arg0 dup1 int-sub set-arg0
  int-add set-arg1
  pause
  RECURSE
;

: binary literal %10 lit base set-var ;
: hex literal $10 lit base set-var ;
: dec literal #10 lit base set-var ;

( Actually prompt! )
terminator
mark
write-crnl
eval-loop
