( An assembler for the BC-VM. )

( Construct a 16 bit value from 4 arguments, MSB to LSB. )
def make-short ( msb mlsb lmsb lsb ++ uint16 )
  arg3 int32 4 bsl
  arg2 logior
  int32 4 bsl
  arg1 logior
  int32 4 bsl
  arg0 logior
  return1
end

( An instruction macro but not very bootstrap metacompiler friendly. Have a-init define the instructions? )

(
def a-def-op
  next-token dup UNLESS eos eos error THEN
  2dup [:] POSTPONE arg2
    POSTPONE arg1
    POSTPONE arg0
    arg0
    POSTPONE make-short
    POSTPONE return1
    POSTPONE end
( append a comma for a dpush helper
  local0 local1 int-add 44 swap poke
  local0 local1 int32 1 int-add [:]
    POSTPONE arg2
    POSTPONE arg1
    POSTPONE arg0
    dict dict-entry-next swapdrop
    POSTPONE ,uint16
  POSTPONE end
end
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

def a-nop
  int32 0 return1
end

def a-push
  int32 0 int32 0 arg0 int32 14 make-short return1
end

def a-pop
  int32 0 int32 0 arg0 int32 6 make-short return1
end

def a-load
  arg2 arg1 arg0 int32 5 make-short return1
end

def a-store
  arg2 arg1 arg0 int32 13 make-short return1
end

def a-inc
  arg2 arg1 arg0 int32 1 make-short return1
end

def a-cmpi
  arg1 arg0 int32 0 int32 2 make-short return1
end

def a-mov
  int32 0 arg1 arg0 int32 8 make-short return1
end

def a-call
  arg1 arg0 int32 7 int32 7 make-short return1
end

( Registers: )

def a-ins int32 15 return1 end
def a-status int32 14 return1 end
def a-isr int32 13 return1 end
def a-ip int32 12 return1 end
def a-sp int32 11 return1 end
def a-cs int32 10 return1 end
def a-ds int32 9 return1 end

( Status flags: )

def a-status-zero int32 1 return1 end
def a-status-negative int32 2 return1 end
def a-status-carry int32 4 return1 end
def a-status-error int32 8 return1 end
def a-status-int-enabled int32 16 return1 end
def a-status-sleep int32 32 return1 end
def a-status-int-flag int32 64 return1 end

( Data storing )

( Push a 32 bit value to the data stack. )
def int32, arg0 dpush end

( Push a 16 bit value to the data stack. Has to move dhere back, making a subsequent dpop's high 16 bits contain the value. )
def int16,
  arg0 dpush
  dhere int32 2 int-sub dmove
end

( Definition helpers )

( Can't use doasm[ ]doasm so create a sequence of ASM and return it. )
def exec-data-seq-asm
  start-seq
  int32 0 int32 0 int32 1 a-load int16,
  int32 8 int32,
  int32 1 a-inc int16,
  int32 cell-size int32,
  int32 1 a-ip a-mov int16,
  local0 end-seq return1
end

( ideally: exec-data-seq-asm variable exec-data-seq-1 drop )
( int32 0 variable exec-data-seq-1 drop )
global-var exec-data-seq-1

( Make the newest dictionary entry jump to the first cell in the data sequence. )
def does-asm
  exec-data-seq-1 arg0 set-dict-entry-code
end

( Make the newest dictionary jump to the subsequent assembly sequence. )
def doasm[
  arg0 does-asm
  start-seq
  arg0 set-dict-entry-data
  terminator
  return1
end

( Finish a definition's assembly sequence and clean the stack. )
def ]doasm
  dict dict-entry-data end-seq
  args terminator stack-find
  cell+2 ( eat terminator and arg to doasm[ return too )
  return-from-frame
end

( Initialiize the assembler. )
def a-init
  exec-data-seq-asm literal exec-data-seq-1 set-dict-entry-data
end

( Do NOT forget: )
( a-init )
