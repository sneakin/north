defop('ifthencall', function(asm) {
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

defop('return-2', function(asm) {
  asm.
      // exit frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      inc(VM.CPU.REGISTERS.SP).uint32(8).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('return-to', function(asm) {
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

defop('stack-top', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.DS).uint32('stack_top').
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  //asm.uint32('literal').uint32('stack_top').uint32('return1');
});

defop('tailcall1', function(asm) {
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

defop('end-frame', function(asm) {
  asm.load(FP_REG, 0, FP_REG).uint32(0).
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('exit-frame', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, FP_REG).int32(4).
      load(FP_REG, 0, FP_REG).uint32(0).
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R0);
});

defop('move', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});
