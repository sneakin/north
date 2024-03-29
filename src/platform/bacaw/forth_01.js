const CELL_SIZE = this.cell_size;
const HEAP_REG = platform.registers.heap;
const EVAL_IP_REG = platform.registers.eval_ip;
const DICT_REG = platform.registers.dict;
const FP_REG = platform.registers.fp;

this.defop('ifthencall', function(asm) {
  asm.
      // condition addr
      pop(VM.CPU.REGISTERS.R2).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32('next-code').
      push(VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code').
      ret();
});

this.defop('return-2', function(asm) {
  asm.
      // exit frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      inc(VM.CPU.REGISTERS.SP).uint32(CELL_SIZE*2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('return-to', function(asm) {
  asm.
      // save where to pop
      pop(VM.CPU.REGISTERS.R0).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // move SP
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      // next
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('stack-top', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.DS).uint32('stack_top').
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  //asm.uint32('literal').uint32('stack_top').uint32('return1');
});

this.defop('tailcall1', function(asm) {
  asm.
      // save where to call
      pop(VM.CPU.REGISTERS.R0).
      // save the arg
      pop(VM.CPU.REGISTERS.R1).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // call's argument
      push(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code');
});

this.defop('pop-frame', function(asm) {
  asm.load(FP_REG, 0, FP_REG).uint32(0).
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('exit-frame', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, FP_REG).int32(CELL_SIZE).
      load(FP_REG, 0, FP_REG).uint32(0).
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');;
});

this.defop('drop-locals', function(asm) {
  asm.mov(VM.CPU.REGISTERS.SP, FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');   
});

this.defop('dropn', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(CELL_SIZE).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('shift', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0). // C
      pop(VM.CPU.REGISTERS.R1). // B
      pop(VM.CPU.REGISTERS.R2). // A
      push(VM.CPU.REGISTERS.R1). // B
      push(VM.CPU.REGISTERS.R0). // C
      push(VM.CPU.REGISTERS.R2). // A
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "Moves the third element to the ToS and moves the first and second back: A B C -- B C A");

this.defop('bslc', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      bsl(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.CARRY).
      push(VM.CPU.REGISTERS.ACCUM).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "`bsl` but also pushes the shifted out bits.");

this.defop('bsrc', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      bsr(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.CARRY).
      push(VM.CPU.REGISTERS.ACCUM).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "`bsr` but also pushes the shifted bits.");

this.defop('jump-return', function(asm) {
  asm.pop(EVAL_IP_REG).
      pop(VM.CPU.REGISTERS.IP);
}, "Pops values into eval IP and the CPU's IP.");