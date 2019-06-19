( Assembler routines needed by the interrupt handlers. )

: emit-long ( addr value ++ next-addr )
  arg0 arg1 poke
  arg1 int32 4 int-add return1
;

: poke-short ( value addr )
  int32 65535 lognot ( mask for high short )
  arg0 peek ( read current cell )
  logand ( apply mask )
  arg1 logior ( add value )
  arg0 poke ( store cell )
;

: emit-short ( addr value ++ next-addr )
  arg0 arg1 poke-short
  arg1 int32 2 int-add return1
;

constant asm-reg-cs 10

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

: emit-asm-call-op ( ptr register condition ++ next-ptr )
  arg1 arg0 int32 0 int32 119 make-short
  arg2 swap emit-short return1
;

: emit-asm-call ( ptr definition ++ next-ptr )
  arg1 asm-reg-cs int32 0 emit-asm-call-op
  arg0 dict-entry-code swapdrop emit-long
  return1
;

: emit-rti ( ptr ++ next-ptr )
  arg0 int32 192 emit-short return1
;
