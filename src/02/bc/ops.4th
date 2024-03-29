( With an assembler the ops can be redefined. )

( Registers used by the inner interpreter. )

def heap-reg int32 8 return1 end
def eval-ip int32 7 return1 end
def dict-reg int32 4 return1 end
def fp-reg int32 3 return1 end

( Execute the next instruction in the thread. )
create next-1 doasm[
    eval-ip 0 0 a-load int16, 0 int32, ( Load the next op into R0. )
    0 0 eval-ip a-inc int16, cell-size int32, ( Increment eval IP. )
    0 0 a-ip a-load int16, cell-size int32, ( Ops are dictionary addresses, so jump to the code field. )
]doasm

( Emit a NEXT that depends on the status register condition. )
def next,/1
  a-ins arg0 a-ip a-load int16, ( If condiion matches, jump to... )
  ' next-1 dict-entry-data int32, ( ...next! )
  a-nop int16, ( hopefully get back in alignment )
end

( Emit an unconditional NEXT. )
def next,
  int32 0 next,/1
end

( Move eval IP to the ToS. )
create jump-1 doasm[
    eval-ip a-pop int16,
    next,
]doasm

( Jump to the ToS if the second on stack is not zero. )
create ifthenjump-1 doasm[
  2 a-pop int16, ( save destination in R2 )
  0 a-pop int16, ( compare value in R0 with zero )
  a-ins 0 1 a-load int16, 0 int32,
  0 1 a-cmpi int16,
  a-status-zero next,/1 ( move to next if zero )
  2 eval-ip a-mov int16, ( do jump )
  next,
]doasm
