const CELL_SIZE = this.cell_size;
const HEAP_REG = platform.registers.heap;
const EVAL_IP_REG = platform.registers.eval_ip;
const DICT_REG = platform.registers.dict;
const FP_REG = platform.registers.fp;

this.defop('push-status', (asm) => {
  asm.push(VM.CPU.REGISTERS.STATUS).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('pop-status', (asm) => {
  asm.pop(VM.CPU.REGISTERS.STATUS).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('enable-interrupts', (asm) => {
  asm.sie().
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('disable-interrupts', (asm) => {
  asm.cie().
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('interrupt', (asm) => {
  asm.pop(VM.CPU.REGISTERS.R0).
      intr(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('isr-table', (asm) => {
  asm.push(VM.CPU.REGISTERS.ISR).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('sleep', (asm) => {
  asm.sleep().
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('wake', (asm) => {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(VM.CPU.STATUS.SLEEP).
      not(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R0).
      and(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.STATUS, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('isr-trampoline', (asm) => {
  // save registers: FP, TOS, PARAM, EVAL_IP, DICT?
  asm.push(FP_REG).
      push(EVAL_IP_REG).
      push(VM.CPU.REGISTERS.R0).
      // push a return to here by calling the function for the interrupt
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32('isr-call').
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.CS, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('outer-start-thread').
      // restore state to before the interrupt
      pop(EVAL_IP_REG). // outer-start-thread swapped EIP & FP
      pop(FP_REG).
      pop(VM.CPU.REGISTERS.R0).
      rti();
});