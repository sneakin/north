( pause while defining. )
: PAUSE pause ; immediate-only

(
" EOS" lit eos constant drop2
" Not Found" lit not-found constant drop2
" Not Number" lit not-number constant drop2
"  " lit space constant drop2
)
: not-found " Not Found" return1 ;
: not-number  " Not Number" return1 ;

: test-return-locals
  int32 1 int32 2 int32 3 return-locals
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
  int32 1 int32 2 int32 3 int32 4 int32 5 arg0 return-locals-less
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

: backtick?
  arg0 " `" string-equal return1
;

( Read and look tokens up inserting `literal` before each. )
: `
  DO
    *tokenizer* peek tokenizer-next-token UNLESS drop2 LEAVE THEN
    swapdrop ( token )
    backtick? IF drop LEAVE THEN
    compile drop ( token addr )
    ' literal ( token addr lit )
    rot ( lit addr token )
  backtick? swapdrop UNTIL

  int32 3 return-locals-less
; immediate

: test-backtick-1
  ` write-ok write-ok write-ok `
  return-locals
; immediate

: test-backtick
  write-helo test-backtick-1 write-helo
;

: test-DOTIMES
  int32 5 DOTIMES[ arg1 write-int write-crnl drop ]DOTIMES write-helo
;
  
: seq1 ( max min )
  arg1
  arg0
  2dup int-sub dallot-seq

  ( todo already bumped the args for keeping the exit offset on stack )
  do
    arg2 write-int arg1 arg0 seq-poke drop3
    write-ok write-crnl
    arg2 int32 10 equals IF again THEN
    arg2 int32 1 int-add set-arg2
    arg3 arg2 > while

  write-ok int32 1146048327 write-word drop
  local2 return1
;

: seq2 ( max min )
  arg1
  arg0
  2dup int-sub dallot-seq

  DO
    arg2 write-int arg1 arg2 seq-poke drop3 ( fixme min != 0 is a problem )
    write-ok write-crnl
    arg2 int32 10 equals IF AGAIN THEN
    arg2 int32 -10 equals IF LEAVE THEN
    arg2 int32 1 int-add set-arg2
    arg3 arg2 > WHILE

  write-ok int32 1146048327 write-word drop
  local2 return1
;

: test-argn-inner
  int32 3 argn return1
;

: test-argn
  int32 6 int32 7 int32 8 int32 9 test-argn-inner
  int32 6 equals return1
;

: test-unsigned-number
  " 123" unsigned-number drop int32 123 equals UNLESS false return1 THEN
  " &123" unsigned-number drop int32 123 equals UNLESS false return1 THEN
  " #98" unsigned-number drop int32 98 equals UNLESS false return1 THEN
  " x10" unsigned-number drop int32 16 equals UNLESS false return1 THEN
  " $100" unsigned-number drop int32 256 equals UNLESS false return1 THEN
  " %1000" unsigned-number drop int32 8 equals UNLESS false return1 THEN
  " %1111" unsigned-number drop int32 15 equals UNLESS false return1 THEN
  true return1
;

( todo copy this out of here to keep and use )
( Convert an unsigned integer value to a string. )
: unsigned-int-to-string-1 ( number -- str-ptr )
  arg0
  here
  DO
    arg2 base poke uint-mod char-digit swapdrop
    arg2 base poke uint-div dup set-arg2
  WHILE
  here dup local1 swap uint-sub cell/ swapdrop int32 4 uint-sub intern return1
;

( Patch the bootstrap functions. )
:: unsigned-int-to-string literal unsigned-int-to-string-1 jump-entry-data ;

( Actually prompt! )
terminator
mark
write-crnl
eval-loop
