( An immediate dictionary for compiling words: )

: immediate-lookup
  arg0 immediate-dict peek dict-lookup
  return1
;

: immediate-dict-add
  arg2 arg1 arg0 immediate-dict peek make-dict
  dup immediate-dict poke
  return1
;

: add-immediate-as
  ( entry name )
  arg1
  arg0
  swap dict-entry-code
  swap dict-entry-data
  swapdrop immediate-dict-add
  return0
;

: add-immediate
  arg0 dict-entry-name add-immediate-as
;

: immediate dict add-immediate ;

( Add the latest dictionary entry to the immediate dictionary and remove it from the normal dictionary. )
: immediate-only immediate drop-dict ;

( Comments )

: (
  *tokenizer* peek literal 41 tokenizer-skip-until
; immediate

( Reverse interning: )

: copyrev
  ( src dest num-bytes )
  arg0 cell- swapdrop
  literal 0

  copyrev-loop:
  ( dest )
  local1 arg1 int-add
  ( src )
  local0 arg2 int-add
  peek
  ( store )
  swap poke
  ( dec )
  local0 cell- swapdrop store-local0
  ( inc )
  local1 cell+ swapdrop store-local1
  ( loop? )
  dup arg0 < literal copyrev-loop ifthenjump
;

: internrev
  arg0 dallot
  ( copy )
  cell+ arg1 swap arg0 cell* swapdrop copyrev drop3
  ( terminate )
  arg0 terminate-seq drop return1
;

( Compiler )

: compile ( tok -- lookup executable? )
  arg0 immediate-lookup dup IF literal 1 return2 THEN
  drop
  interp return2
;

( Colon definitions )

: stack-find-loop ( start-location needle current! ++ ptr )
  arg0 peek arg1 equals IF arg0 return1 THEN
  arg0 cell+ set-arg0 drop
  RECURSE
;

: stack-find
  ( start-location needle ++ ptr )
  arg1 arg0 arg1 stack-find-loop return1
;
  
: [
  literal compile *state* poke
  terminator return1
; immediate

: ]
  literal 0 *state* poke
  args terminator stack-find swapdrop cell- swapdrop
  swap 2dup int-sub cell/ swapdrop literal 1 int-add internrev
  seq-length literal 1 int-add return1-n
; immediate

: docol>
  literal call-data-seq dict-entry-code swapdrop
  arg0 set-dict-entry-code
  [
  return2
;

: endcol
  end drop2
  literal return0
  ]
  swap set-dict-entry-data drop2
  literal eval-loop jump-entry-data
; immediate-as ;

: eos " EOS" return1 ;

: :
  create docol> return2
;

( Redefine or create the next word as a colon definition. )
: ::
  next-token dup UNLESS eos eos error return0 THEN
  dup1 dict dict-lookup dup UNLESS drop3 intern-seq literal 0 literal 0 add-dict THEN
  docol> return2
;

( Compiling words: )

( Jump to the word after UNLESS and evaluate until THEN if the top of stack is zero. )
: UNLESS
  literal literal terminator literal ifthenreljump
  literal 3 returnN
; immediate-only

( Stop evaluation for an UNLESS or IF. )
: THEN
  args cell+ swapdrop terminator stack-find swapdrop
  2dup swap int-sub
  swap poke
; immediate-only

( Read the next token and look it up in immediate and regular dictionaries. )
: POSTPONE
  next-token UNLESS literal eos eos error return0 THEN
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

( Jump to the word after IF and evaluate until THEN if the top of stack is not zero. )
: IF
  literal not
  POSTPONE UNLESS
  return-locals
; immediate-only

( Tail call the dictionary definition currently being defined. )
: RECURSE
  literal literal
  dict
  literal jump-entry-data
  return-locals
; immediate

( Loops: )

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

( Loop an N number of times. The counter is in arg1.)
: DOTIMES[ ( times )
  literal zero
  POSTPONE DO
  return-locals
; immediate-only

: ]DOTIMES
  literal arg1 literal literal literal 1 literal int-add literal set-arg1
  literal arg1 literal arg2 literal < POSTPONE WHILE
  return-locals
; immediate-only

( Quoting: )

( Read and intern the next token. )
: lit
  next-token dup UNLESS eos return0 THEN
  intern-seq return1
;

( A postponed LIT. )
: c-lit
  literal literal lit return2
; immediate-as lit

( Read the next token and look it up in the dictionary. )
: '
  next-token UNLESS literal eos-sym error return0 THEN
  dict dict-lookup return1
;

( Actually emit ' when ' is redefined to emit LITERAL. )
: [']
  literal ' return1
; immediate-only

( No need to perform a double lookup since compilation does that. )
: c-'
  literal literal return1
; immediate-as '

( fixme: need to read strings larger than the tokenizer's buffer )

: "
  *tokenizer* peek literal 34 tokenizer-read-until intern-seq return1
; immediate

: c-"
  literal literal POSTPONE " return2
; immediate-as "


( Immediates needed to self compile the core words. )

( Construct a 32 bit value from 4 arguments, LSB to MSB. )
: make-long-msb ( lsb lmsb mlsb msb ++ uint32 )
  arg0 literal 8 bsl
  arg1 logior
  literal 8 bsl
  arg2 logior
  literal 8 bsl
  arg3 logior
  return1
;

( Return the next-token's first character. )
: char-code-at
  next-token UNLESS eos eos error THEN
  cell+ peek return1
; immediate

( Turn the ToS string into a 4 byte "string" or long. )
: longify-string
  arg0 peek terminator? IF literal 0 return1 THEN
  arg0 cell+ swapdrop peek terminator? IF
    drop literal 0 literal 0 literal 0 make-long-msb return1
  THEN
  arg0 cell+2 swapdrop peek terminator? IF
    drop literal 0 literal 0 make-long-msb return1
  THEN
  arg0 cell+3 swapdrop peek terminator? IF
    drop literal 0 make-long-msb return1
  THEN
  make-long-msb return1
;

( todo longify needs to unescape the next token. )

( Turn the next token into a 4 byte "string" or long. )
: longify
  next-token UNLESS eos eos error THEN
  cell+ longify-string
  literal literal swap return2
; immediate

( Read until the next " and convert that to a long. )
: longify"
  *tokenizer* peek literal 34 tokenizer-read-until UNLESS eos eos error THEN
  cell+ longify-string
  literal literal swap return2
; immediate

