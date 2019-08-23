defop('jumprel', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(EVAL_IP_REG, VM.CPU.REGISTERS.STATUS).
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('eip', function(asm) {
  asm.push(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('call-seq', function(asm) {
  asm.push(EVAL_IP_REG).
      load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.SP).uint32(4).
      inc(EVAL_IP_REG).uint32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('begin-code').
      ret();
});


defop('exec-data-seq', function(asm) {
  // Given an entry in R0, load IP with the address after the data value's length.
  asm.load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.R0).uint32(8). // load entry data
  inc(VM.CPU.REGISTERS.R1).uint32(4). // skip length
  mov(VM.CPU.REGISTERS.IP, VM.CPU.REGISTERS.R1);
});

defop('return0-n', function(asm) {
  asm.
      // save number cells to pop
      pop(VM.CPU.REGISTERS.R0).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // drop N arguments
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(4).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      // make call
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

// fixme to tailcall, call-data* needs to not create the frame
// or detect if an op is called or not and jump w/ IP or EIP

defop('tailcall', function(asm) {
  asm.
      // save where to call
      //pop(VM.CPU.REGISTERS.R0).
      // pop frame
      //mov(VM.CPU.REGISTERS.SP, FP_REG).
      //load(EVAL_IP_REG, 0, FP_REG).uint32(4).
      load(FP_REG, 0, FP_REG).uint32(0).
      //pop(FP_REG).
      //pop(EVAL_IP_REG).
      // place to call
      //push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code');
});

defop('cont', function(asm) {
  asm.pop(EVAL_IP_REG).
      // pop frame
      load(FP_REG, 0, FP_REG).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('call-op', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.IP);
});

defop('call-param', function(asm) {
  asm.
      push(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code');
});

defop('call-op-param', function(asm) {
  asm.
      push(VM.CPU.REGISTERS.IP).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code');
});

defop('tailcall-param', function(asm) {
  asm.
      push(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('tailcall-code');
});

defop('tailcall-op', function(asm) {
  asm.
      // save where to call
      pop(VM.CPU.REGISTERS.R0).
      //pop(VM.CPU.REGISTERS.R1).
      // pop frame
      //mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // call's argument
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('call-op');
});

defop('dup2', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('pick', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('localn', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(4).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
      mov(VM.CPU.REGISTERS.R0, FP_REG).
      cls(VM.CPU.STATUS.NUMERICS).
      subi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      dec(VM.CPU.REGISTERS.R0).uint32(4).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('store-local2', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-12).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('drop-frame', function(asm) {
  asm.
      inc(VM.CPU.REGISTERS.SP).uint32(FRAME_SIZE + 4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('pop-to', function(asm) {
  asm.pop(VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

