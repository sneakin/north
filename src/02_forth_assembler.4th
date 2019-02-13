( Construct a 16 bit value from 4 arguments, MSB to LSB. )
: make-short ( msb mlsb lmsb lsb ++ uint16 )
  arg3 literal 4 bsl
  arg2 logior
  literal 4 bsl
  arg1 logior
  literal 4 bsl
  arg0 logior
  return1
;

( An instruction macro but not very bootstrap metacompiler friendly. Have a-init define the instructions? )

(
: a-def-op
  next-word dup UNLESS eos eos error THEN
  2dup [:] POSTPONE arg2
    POSTPONE arg1
    POSTPONE arg0
    arg0
    POSTPONE make-short
    POSTPONE return1
    POSTPONE ;
( append a comma for a dpush helper
  local0 local1 int-add 44 swap poke
  local0 local1 literal 1 int-add [:]
    POSTPONE arg2
    POSTPONE arg1
    POSTPONE arg0
    dict dict-entry-next swapdrop
    POSTPONE ,uint16
  POSTPONE ;
;
)

( cmpi dec cls rti sleep halt call ret sie cie and or addi subi muli divi modi  )
( inc load store push pop)

(
literal 14 a-def-op a-push
literal 6 a-def-op a-pop
literal 5 a-def-op a-load
literal 13 a-def-op a-store
literal 1 a-def-op a-inc
literal 9 a-def-op a-dec
)

( Instructions: )

: a-nop
  literal 0 return1
;

: a-push
  literal 0 literal 0 arg0 literal 14 make-short return1
;

: a-pop
  literal 0 literal 0 arg0 literal 6 make-short return1
;

: a-load
  arg2 arg1 arg0 literal 5 make-short return1
;

: a-store
  arg2 arg1 arg0 literal 13 make-short return1
;

: a-inc
  arg2 arg1 arg0 literal 1 make-short return1
;

: a-cmpi
  arg1 arg0 literal 0 literal 2 make-short return1
;

: a-mov
  literal 0 arg1 arg0 literal 8 make-short return1
;

( Registers: )

: a-ins literal 15 return1 ;
: a-status literal 14 return1 ;
: a-isr literal 13 return1 ;
: a-ip literal 12 return1 ;
: a-sp literal 11 return1 ;
: a-cs literal 10 return1 ;
: a-ds literal 9 return1 ;

( Status flags: )

: a-status-zero literal 1 return1 ;
: a-status-negative literal 2 return1 ;
: a-status-carry literal 4 return1 ;
: a-status-error literal 8 return1 ;
: a-status-int-enabled literal 16 return1 ;
: a-status-sleep literal 32 return1 ;
: a-status-int-flag literal 64 return1 ;

( Data storing )

( Push a 32 bit value to the data stack. )
: int32, arg0 dpush ;

( Push a 16 bit value to the data stack. Has to move dhere back, making a subsequent dpop's high 16 bits contain the value. )
: int16,
  arg0 dpush
  dhere literal 2 int-sub dmove
;

( Definition helpers )

( Can't use doasm[ ]doasm so create a sequence of ASM and return it. )
: exec-data-seq-asm
  start-seq
  literal 0 literal 0 literal 1 a-load int16,
  literal 8 int32,
  literal 1 a-inc int16,
  literal 4 int32,
  literal 1 a-ip a-mov int16,
  local0 end-seq return1
;

( ideally: exec-data-seq-asm variable exec-data-seq-1 drop )
literal 0 variable exec-data-seq-1 drop

( Make the newest dictionary entry jump to the first cell in the data sequence. )
: does-asm
  exec-data-seq-1 arg0 set-dict-entry-code
;

( Make the newest dictionary jump to the subsequent assembly sequence. )
: doasm[
  arg0 does-asm
  start-seq
  arg0 set-dict-entry-data
  terminator
  return1
;

( Finish a definition's assembly sequence and clean the stack. )
: ]doasm
  dict dict-entry-data end-seq
  args terminator stack-find
  cell+2 ( eat terminator and arg to doasm[ return too )
  return-to
;

( Initialiize the assembler. )
: a-init
  exec-data-seq-asm literal exec-data-seq-1 set-dict-entry-data
;

( Do NOT forget: )
a-init
