( An assembler for the BC-VM. )

( Construct a 16 bit value from 4 arguments, MSB to LSB. )
: make-short ( msb mlsb lmsb lsb ++ uint16 )
  arg3 int32 4 bsl
  arg2 logior
  int32 4 bsl
  arg1 logior
  int32 4 bsl
  arg0 logior
  return1
;

( An instruction macro but not very bootstrap metacompiler friendly. Have a-init define the instructions? )

(
: a-def-op
  next-token dup UNLESS eos eos error THEN
  2dup [:] POSTPONE arg2
    POSTPONE arg1
    POSTPONE arg0
    arg0
    POSTPONE make-short
    POSTPONE return1
    POSTPONE ;
( append a comma for a dpush helper
  local0 local1 int-add 44 swap poke
  local0 local1 int32 1 int-add [:]
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
int32 14 a-def-op a-push
int32 6 a-def-op a-pop
int32 5 a-def-op a-load
int32 13 a-def-op a-store
int32 1 a-def-op a-inc
int32 9 a-def-op a-dec
)

( Instructions: )

: a-nop
  int32 0 return1
;

: a-push
  int32 0 int32 0 arg0 int32 14 make-short return1
;

: a-pop
  int32 0 int32 0 arg0 int32 6 make-short return1
;

: a-load
  arg2 arg1 arg0 int32 5 make-short return1
;

: a-store
  arg2 arg1 arg0 int32 13 make-short return1
;

: a-inc
  arg2 arg1 arg0 int32 1 make-short return1
;

: a-cmpi
  arg1 arg0 int32 0 int32 2 make-short return1
;

: a-mov
  int32 0 arg1 arg0 int32 8 make-short return1
;

: a-call
  arg1 arg0 int32 7 int32 7 make-short return1
;

( Registers: )

: a-ins int32 15 return1 ;
: a-status int32 14 return1 ;
: a-isr int32 13 return1 ;
: a-ip int32 12 return1 ;
: a-sp int32 11 return1 ;
: a-cs int32 10 return1 ;
: a-ds int32 9 return1 ;

( Status flags: )

: a-status-zero int32 1 return1 ;
: a-status-negative int32 2 return1 ;
: a-status-carry int32 4 return1 ;
: a-status-error int32 8 return1 ;
: a-status-int-enabled int32 16 return1 ;
: a-status-sleep int32 32 return1 ;
: a-status-int-flag int32 64 return1 ;

( Data storing )

( Push a 32 bit value to the data stack. )
: int32, arg0 dpush ;

( Push a 16 bit value to the data stack. Has to move dhere back, making a subsequent dpop's high 16 bits contain the value. )
: int16,
  arg0 dpush
  dhere int32 2 int-sub dmove
;

( Definition helpers )

( Can't use doasm[ ]doasm so create a sequence of ASM and return it. )
: exec-data-seq-asm
  start-seq
  int32 0 int32 0 int32 1 a-load int16,
  int32 8 int32,
  int32 1 a-inc int16,
  int32 cell-size int32,
  int32 1 a-ip a-mov int16,
  local0 end-seq return1
;

( ideally: exec-data-seq-asm variable exec-data-seq-1 drop )
( int32 0 variable exec-data-seq-1 drop )
global-var exec-data-seq-1

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
( a-init )
