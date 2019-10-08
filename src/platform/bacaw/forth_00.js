// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

const CELL_SIZE = this.cell_size;
const HEAP_REG = platform.registers.heap;
const EVAL_IP_REG = platform.registers.eval_ip;
const DICT_REG = platform.registers.dict;
const FP_REG = platform.registers.fp;

this.defop('reboot', function(asm) {
  asm.reset();
}, "Reboot the CPU.");

this.defop('reset', function(asm) {
  asm.load(DICT_REG, 0, VM.CPU.REGISTERS.CS).uint32('builtin-dictionary').
      load(HEAP_REG, 0, VM.CPU.REGISTERS.DS).uint32('heap_top').
      load(VM.CPU.REGISTERS.SP, 0, VM.CPU.REGISTERS.DS).uint32('stack_top').
      mov(FP_REG, VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.CS).uint32(0).
      inc(VM.CPU.REGISTERS.R0).uint32('boot').
      push(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('outer-start-thread');
}, "Set all the interpreter's state back to the initial state.");

this.defop('jump', function(asm) {
  asm.pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('exec', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-word-code');
});

this.defop('exec-word', function(asm) {
  asm.load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE);
});

this.defop('call-data', function(asm) {
  // Given an entry in R0, load eval IP with the data value.
  asm.push(EVAL_IP_REG). // save return
  load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2). // load data value
  load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('begin-code').
      ret();
});

this.defop('call-data-seq', function(asm) {
  // Given an entry in R0, jump to it's data sequence's first value.
  asm.push(EVAL_IP_REG). // save return
  load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2). // load entry data
  inc(EVAL_IP_REG).uint32(CELL_SIZE). // skip the length
  load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('begin-code').
      ret();
});

this.defop('jump-entry-data', function(asm) {
  // Load the eval IP with the entry at the ToS's data value.
  asm.pop(VM.CPU.REGISTERS.R0). // entry
  load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2). // load data value
  inc(EVAL_IP_REG).uint32(CELL_SIZE). // skip sequence length
  load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

// Start a new call frame.
// Call frames are structured like, low memory to high:
//    locals
//    link to previous frame <- FP_REG -
//    return address
//    call arguments...
//    caller's locals
//    previous frame
var FRAME_RETURN_ADDRESS_OFFSET = CELL_SIZE;
var FRAME_SIZE = CELL_SIZE * 2;

this.defop('begin', function(asm) {
  asm.push(FP_REG).
      mov(FP_REG, VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

// todo need an abort to eval-loop: catch/throw?

// actually return from interpreter
this.defop('bye', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
      // get the top most stack frame
      label('bye-loop').
      load(VM.CPU.REGISTERS.R1, 0, FP_REG).uint32(0).
      cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
      inc(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO).uint32('bye-done', true).
      mov(FP_REG, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('bye-loop').
      label('bye-done').
      // drop and exit frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // overwrite the zero frame
      pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      ret();
}, "Exit and return from the interpreter.");

this.defop('quit', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
      // get the top most stack frame
      label('quit-loop').
      load(VM.CPU.REGISTERS.R1, 0, FP_REG).uint32(0).
      cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
      inc(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO).uint32('quit-done', true).
      mov(FP_REG, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('quit-loop').
      label('quit-done').
      // drop and exit frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      dec(VM.CPU.REGISTERS.SP).uint32(CELL_SIZE). // not the top most frame's return
      pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "Return to the function started with outer-start-thread, but not the outer-start-thread's caller.");

// Return to the calling function.
this.defop('exit', function(asm) {
  asm.load(EVAL_IP_REG, 0, FP_REG).int32(CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('end-code');
});

// Ends the current frame.
this.defop('end', function(asm) {
  asm.load(FP_REG, 0, FP_REG).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

// Load the next word, increment eval IP, and execute the word's code cell.
this.defop('next', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, EVAL_IP_REG).int32(0).
      inc(EVAL_IP_REG).uint32(CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE).
      ret();
});

this.defop('drop-call-frame', function(asm) {
  asm.load(FP_REG, 0, FP_REG).uint32(0).
      inc(VM.CPU.REGISTERS.SP).uint32(FRAME_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('return1', function(asm) {
  asm.// save a return value
  pop(VM.CPU.REGISTERS.R0).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // call's argument
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('return2', function(asm) {
  asm.// save a return value
  pop(VM.CPU.REGISTERS.R0).
      pop(VM.CPU.REGISTERS.R1).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // call's arguments
      push(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('return-1', function(asm) {
  asm.// exit frame
  mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

// todo try not adjusting SP on return: it onlf changes IP & FP like a call.
// todo jump to bye if there's no parent frame
this.defop('return0', function(asm) {
  asm.// exit frame
  mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('returnN', function(asm) {
  asm.// copy values between FP and SP up over the frame
  // exit frame
  // save the number of words
  pop(VM.CPU.REGISTERS.R0).
      mov(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.SP).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('shift-stack-code');
});

this.defop('return0-n', function(asm) {
  asm.
      // save number cells to pop
      pop(VM.CPU.REGISTERS.R0).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // drop N arguments
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(CELL_SIZE).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      // make call
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('shift-stack', function(asm) {
  asm.// R1: old SP
  // R0: number of words
  load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(CELL_SIZE).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      label('shift-stack-loop').
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      inc(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO).uint32('next-code', true).
      dec(VM.CPU.REGISTERS.R0).uint32(CELL_SIZE).
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('shift-stack-loop');
});

this.defop('return1-n', function(asm) {
  asm.// save number cells to pop
  pop(VM.CPU.REGISTERS.R0).
      // save a return value
      pop(VM.CPU.REGISTERS.R1).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // drop N arguments
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(CELL_SIZE).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      // save arg and call
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('return2-n', function(asm) {
  asm.// save number cells to pop
  pop(VM.CPU.REGISTERS.R0).
      // save a return value
      pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R3).
      // pop frame
      mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      // drop N arguments
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(CELL_SIZE).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
      mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
      // save arg and call
      push(VM.CPU.REGISTERS.R3).
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('literal', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, EVAL_IP_REG).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      inc(EVAL_IP_REG).uint32(CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defalias('pointer', 'literal');
this.defalias('string', 'literal');
this.defalias('int32', 'literal');
this.defalias('uint32', 'literal');
this.defalias('float32', 'literal');

this.defop('read-byte', function(asm) {
  asm.
      call(0, VM.CPU.REGISTERS.CS).uint32('read_byte').
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('write-byte', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('output_write_byte').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('write-word', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('output_write_word').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('eval-ip', function(asm) {
  asm.push(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('here', function(asm) {
  asm.
      push(VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('swap', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      pop(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('drop', function(asm) {
  asm.inc(VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('drop2', function(asm) {
  asm.inc(VM.CPU.REGISTERS.SP).uint32(CELL_SIZE*2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('drop3', function(asm) {
  asm.inc(VM.CPU.REGISTERS.SP).uint32(4 * 3).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('over', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('dup', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('2dup', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('peek', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('poke', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0). // addr
      pop(VM.CPU.REGISTERS.R1). // value
      store(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.R0).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('equals', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      pop(VM.CPU.REGISTERS.R1).
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

var math_ops = { addi: 'int-add',
                 subi: 'int-sub',
                 muli: 'int-mul',
                 divi: 'int-div',
                 modi: 'int-mod',
                 addu: 'uint-add',
                 subu: 'uint-sub',
                 mulu: 'uint-mul',
                 divu: 'uint-div',
                 modu: 'uint-mod',
                 addf: 'float-add',
                 subf: 'float-sub',
                 mulf: 'float-mul',
                 divf: 'float-div',
                 modf: 'float-mod'
               }
for(var k in math_ops) {
  var op = k;
  var label = math_ops[k];

  this.defop(label, function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cls(VM.CPU.STATUS.NUMERICS);
    asm[op](VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS);
    asm.push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
}

var conv_ops = {
  "i->f": [ 'convi', VM.TYPE_IDS.FLOAT ],
  "u->f": [ 'convu', VM.TYPE_IDS.FLOAT ],
  "f->i": [ 'convf', VM.TYPE_IDS.LONG ],
  "f->u": [ 'convf', VM.TYPE_IDS.ULONG ]
};
for(var f in conv_ops) {
  var op = conv_ops[f][0];
  var type_out = conv_ops[f][1];
  
  this.defop(f, function(asm) {
    asm.pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R0, type_out);
    asm.push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
}

this.defop('logi', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      logi(VM.CPU.REGISTERS.R0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('bsl', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      bsl(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.ACCUM).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('bsr', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      bsr(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.ACCUM).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('not', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.R1, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('lognot', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      not(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('logand', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      and(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('logior', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      or(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('logxor', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      xor(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

var comparisons = {
  int: 'cmpi',
  uint: 'cmpu',
  float: 'cmpf'
};
for(var kind in comparisons) {
  var op = comparisons[kind];

  this.defop(kind + '<', function(asm) {
    asm.pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });

  this.defop(kind + '<=', function(asm) {
    asm.pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });

  this.defop(kind + '>', function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });

  this.defop(kind + '>=', function(asm) {
    asm.pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
}

this.defalias('<', 'int<');
this.defalias('<=', 'int<=');
this.defalias('>', 'int>');
this.defalias('>=', 'int>=');

this.defop('jumprel', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(EVAL_IP_REG, VM.CPU.REGISTERS.STATUS).
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('ifthenjump', function(asm) { // condition addr
  asm.
      // compare arg1 w/ 0
      pop(VM.CPU.REGISTERS.R2).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32('next-code').
      // perform jump if != 0
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('ifthenreljump', function(asm) { // condition addr
  asm.
      // compare arg1 w/ 0
      pop(VM.CPU.REGISTERS.R0).
      pop(VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32('next-code').
      // inc eval ip if != 0
      cls(VM.CPU.STATUS.NUMERICS).
      addi(EVAL_IP_REG, VM.CPU.REGISTERS.STATUS).
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('unlessjump', function(asm) { // condition addr
  asm.
      // compare arg1 w/ 0
      pop(VM.CPU.REGISTERS.R2).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.NEGATIVE|VM.CPU.STATUS.CARRY, VM.CPU.REGISTERS.INS).uint32('next-code').
      label('unlessjump_skip').
      // perform jump if == 0
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('unlessreljump', function(asm) { // condition addr
  asm.
      // compare arg1 w/ 0
      pop(VM.CPU.REGISTERS.R0).
      pop(VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.NEGATIVE|VM.CPU.STATUS.CARRY, VM.CPU.REGISTERS.INS).uint32('next-code').
      label('unlessreljump_skip').
      // inc eval ip if == 0
      cls(VM.CPU.STATUS.NUMERICS).
      addi(EVAL_IP_REG, VM.CPU.REGISTERS.STATUS).
      mov(EVAL_IP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('pause', function(asm) {
  asm.
      cie().
      halt().
      sie().
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('arg0', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('arg1', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('arg2', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('arg3', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 12).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('arg4', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 16).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('next-param', function(asm) {
  asm.
      // get the return address
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_RETURN_ADDRESS_OFFSET).
      // load the value
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R1).
      // move the return address up a cell
      inc(VM.CPU.REGISTERS.R0).uint32(CELL_SIZE).
      // update it
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_RETURN_ADDRESS_OFFSET).
      // done
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

this.defop('return-address', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_RETURN_ADDRESS_OFFSET).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('locals', function(asm) {
  asm.mov(VM.CPU.REGISTERS.R0, FP_REG).
      dec(VM.CPU.REGISTERS.R0).uint32(CELL_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('local0', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-CELL_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('store-local0', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('local1', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('store-local1', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-8).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('local2', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-12).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('store-local2', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-12).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('args', function(asm) {
  asm.mov(VM.CPU.REGISTERS.R0, FP_REG).
      inc(VM.CPU.REGISTERS.R0).uint32(FRAME_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('current-frame', function(asm) {
  asm.
      push(FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('set-current-frame', function(asm) {
  asm.pop(FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
})

this.defop('cont', function(asm) {
  asm.// the called
  pop(VM.CPU.REGISTERS.R0).
      // return to the caller's caller
      load(EVAL_IP_REG, 0, FP_REG).uint32(FRAME_RETURN_ADDRESS_OFFSET).
      // pop the frame
      load(FP_REG, 0, FP_REG).uint32(0).
      // exec the called in R0
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-word-code');
}, "Returns from but keeps the current frame on stack and then execs the ToS. Effectively continues the full frame into the ToS.");

/*
 *  Data stack ops
 */

this.defop('dpush', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      inc(HEAP_REG).uint32(CELL_SIZE).
      store(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('dpop', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(0).
      dec(HEAP_REG).uint32(CELL_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('ddrop', function(asm) {
  asm.
      dec(HEAP_REG).uint32(CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('dmove', function(asm) {
  asm.pop(HEAP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('dallot', function(asm) {
  asm.inc(HEAP_REG).uint32(CELL_SIZE).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(HEAP_REG, VM.CPU.REGISTERS.STATUS).
      push(HEAP_REG).
      mov(HEAP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "Allocate a number of bytes on the data stack.");

this.defop('dallot-seq', function(asm) {
  asm.// store buffer's length
  inc(HEAP_REG).uint32(CELL_SIZE).
      pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(0).
      push(HEAP_REG).
      // calc byte size
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(CELL_SIZE).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      // increase heap ptr
      cls(VM.CPU.STATUS.NUMERICS).
      addi(HEAP_REG, VM.CPU.REGISTERS.STATUS).
      inc(VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2).
      mov(HEAP_REG, VM.CPU.REGISTERS.R0).
      // terminate seq
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(TERMINATOR).
      store(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(-CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "Allocate a terminated sequence of cells on the data stack.");

this.defop('dhere', function(asm) {
  asm.
      push(HEAP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('data-segment', function(asm) {
  asm.push(VM.CPU.REGISTERS.DS).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

/*
 * Dictionary ops
 */

this.defop('dict', function(asm) {
  asm.
      push(DICT_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('set-dict', function(asm) {
  asm.
      pop(DICT_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

/*
 * Stack ops
 */

this.defop('rot', function(asm) {
  // a b c -> c b a
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE*2).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE*2).
      store(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('rotdrop', function(asm) {
  // a b c -> c b
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('rotdrop2', function(asm) {
  // a b c -> c
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

// todo how to swapdrop with a frame in the way?
this.defop('swapdrop', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('roll', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      store(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE*2).
      store(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(CELL_SIZE*2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "Moves the ToS to the third element and moves up the first and second.", "A B C -- C A B");

/*
 * Dictionary code ops
 */

/*
  this.defop('indirect-param', function(asm) {
    asm.mov(VM.CPU.REGISTERS.R0, EVAL_IP_REG).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next');
  });
  */

this.defop('value-peeker', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('variable-peeker', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('pointer-peeker', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('do-accessor', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(CELL_SIZE*2).
      pop(VM.CPU.REGISTERS.R1).
      cls(VM.CPU.REGISTERS.STATUS).
      addi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

/*
 * Input ops
 */

this.defop('input-flush', function(asm) {
  asm.call(0, VM.CPU.REGISTERS.CS).uint32('input_flush').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('input-reset', function(asm) {
  asm.call(0, VM.CPU.REGISTERS.CS).uint32('reset_input').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

this.defop('wait-for-input', function(asm) {
  asm.call(0, VM.CPU.REGISTERS.CS).uint32('wait_for_input').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

