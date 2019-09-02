// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

defop('reboot', function(asm) {
  asm.reset();
}, "Reboot the CPU.");

defop('reset', function(asm) {
  asm.load(DICT_REG, 0, VM.CPU.REGISTERS.CS).uint32('dictionary').
      load(DICT_REG, 0, DICT_REG).uint32(0).
      load(HEAP_REG, 0, VM.CPU.REGISTERS.DS).uint32('heap_top').
      load(VM.CPU.REGISTERS.SP, 0, VM.CPU.REGISTERS.DS).uint32('stack_top').
      mov(FP_REG, VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.CS).uint32(0).
      inc(VM.CPU.REGISTERS.R0).uint32('boot').
      push(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('outer-start-thread');
}, "Set all the interpreter's state back to the initial state.");

defop('jump', function(asm) {
  asm.pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('exec', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.R0).uint32(4).
      ret();
});

defop('call-data', function(asm) {
  // Given an entry in R0, load eval IP with the data value.
  asm.push(EVAL_IP_REG). // save return
  load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.R0).uint32(8). // load data value
  load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('begin-code').
      ret();
});

defop('call-data-seq', function(asm) {
  // Given an entry in R0, jump to it's data sequence's first value.
  asm.push(EVAL_IP_REG). // save return
  load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.R0).uint32(8). // load entry data
  inc(EVAL_IP_REG).uint32(4). // skip the length
  load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('begin-code').
      ret();
});

defop('jump-entry-data', function(asm) {
  // Load the eval IP with the entry at the ToS's data value.
  asm.pop(VM.CPU.REGISTERS.R0). // entry
  load(EVAL_IP_REG, 0, VM.CPU.REGISTERS.R0).uint32(8). // load data value
  inc(EVAL_IP_REG).uint32(4). // skip sequence length
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
var FRAME_SIZE = 4 * 2;

defop('begin', function(asm) {
  asm.push(FP_REG).
      mov(FP_REG, VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

// todo need an abort to eval-loop: catch/throw?

// actually return from interpreter
defop('bye', function(asm) {
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

defop('quit', function(asm) {
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
      dec(VM.CPU.REGISTERS.SP).uint32(4). // not the top most frame's return
      pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
}, "Return to the function started with outer-start-thread, but not the outer-start-thread's caller.");

// Return to the calling function.
defop('exit', function(asm) {
  asm.load(EVAL_IP_REG, 0, FP_REG).int32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('end-code');
});

// Ends the current frame.
defop('end', function(asm) {
  asm.load(FP_REG, 0, FP_REG).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

// Load the next word, increment eval IP, and execute the word's code cell.
defop('next', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, EVAL_IP_REG).int32(0).
      inc(EVAL_IP_REG).uint32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.R0).uint32(4).
      ret();
});

defop('drop-call-frame', function(asm) {
  asm.load(FP_REG, 0, FP_REG).uint32(0).
      inc(VM.CPU.REGISTERS.SP).uint32(FRAME_SIZE).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('return1', function(asm) {
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

defop('return2', function(asm) {
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

defop('return-1', function(asm) {
  asm.// exit frame
  mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

// todo jump to bye if there's no parent frame
defop('return0', function(asm) {
  asm.// exit frame
  mov(VM.CPU.REGISTERS.SP, FP_REG).
      pop(FP_REG).
      pop(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('returnN', function(asm) {
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

defop('shift-stack', function(asm) {
  asm.// R1: old SP
  // R0: number of words
  load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(4).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R2, VM.CPU.REGISTERS.STATUS).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      label('shift-stack-loop').
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      inc(VM.CPU.REGISTERS.IP, VM.CPU.STATUS.ZERO).uint32('next-code', true).
      dec(VM.CPU.REGISTERS.R0).uint32(4).
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R2).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('shift-stack-loop');
});

defop('return1-n', function(asm) {
  asm.// save number cells to pop
  pop(VM.CPU.REGISTERS.R0).
      // save a return value
      pop(VM.CPU.REGISTERS.R1).
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
      // save arg and call
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('literal', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, EVAL_IP_REG).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      inc(EVAL_IP_REG).uint32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defalias('string', 'literal');
defalias('int32', 'literal');
defalias('uint32', 'literal');
defalias('float32', 'literal');

defop('read-byte', function(asm) {
  asm.
      call(0, VM.CPU.REGISTERS.CS).uint32('read_byte').
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('write-byte', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('output_write_byte').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('write-word', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('output_write_word').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('eval-ip', function(asm) {
  asm.push(EVAL_IP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('here', function(asm) {
  asm.
      push(VM.CPU.REGISTERS.SP).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('swap', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      pop(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('drop', function(asm) {
  asm.inc(VM.CPU.REGISTERS.SP).uint32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('drop2', function(asm) {
  asm.inc(VM.CPU.REGISTERS.SP).uint32(8).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('drop3', function(asm) {
  asm.inc(VM.CPU.REGISTERS.SP).uint32(4 * 3).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('over', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('dup', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('2dup', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('peek', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('poke', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0). // addr
      pop(VM.CPU.REGISTERS.R1). // value
      store(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.R0).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('equals', function(asm) {
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

  defop(label, function(asm) {
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
  
  defop(f, function(asm) {
    asm.pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R0, type_out);
    asm.push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
}

defop('bsl', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      bsl(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('logand', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      and(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('logior', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R1).
      pop(VM.CPU.REGISTERS.R0).
      or(VM.CPU.REGISTERS.R1).
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

  defop(kind + '<', function(asm) {
    asm.pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });

  defop(kind + '<=', function(asm) {
    asm.pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0);
    asm[op](VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });

  defop(kind + '>', function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });

  defop(kind + '>=', function(asm) {
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

defalias('<', 'int<');
defalias('<=', 'int<=');
defalias('>', 'int>');
defalias('>=', 'int>=');

defop('ifthenjump', function(asm) { // condition addr
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

defop('ifthenreljump', function(asm) { // condition addr
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

defop('pause', function(asm) {
  asm.
      cie().
      halt().
      sie().
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('arg0', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('arg1', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('arg2', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('arg3', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(FRAME_SIZE + 12).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('next-param', function(asm) {
  asm.
      // get the return address
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(4).
      // load the value
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R1).
      // move it up a cell
      inc(VM.CPU.REGISTERS.R0).uint32(4).
      // update it
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(4).
      // done
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
      ret();
});

defop('return-address', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('locals', function(asm) {
  asm.mov(VM.CPU.REGISTERS.R0, FP_REG).
      dec(VM.CPU.REGISTERS.R0).uint32(4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('local0', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('store-local0', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('local1', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('store-local1', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-8).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('local2', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-12).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('store-local2', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, FP_REG).uint32(-12).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('args', function(asm) {
  asm.mov(VM.CPU.REGISTERS.R0, FP_REG).
      inc(VM.CPU.REGISTERS.R0).uint32(FRAME_SIZE).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dpush', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      inc(HEAP_REG).uint32(4).
      store(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dpop', function(asm) {
  asm.
      load(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(0).
      dec(HEAP_REG).uint32(4).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('ddrop', function(asm) {
  asm.
      dec(HEAP_REG).uint32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dmove', function(asm) {
  asm.pop(HEAP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dallot', function(asm) {
  asm.inc(HEAP_REG).uint32(4).
      pop(VM.CPU.REGISTERS.R0).
      cls(VM.CPU.STATUS.NUMERICS).
      addi(HEAP_REG, VM.CPU.REGISTERS.STATUS).
      push(HEAP_REG).
      mov(HEAP_REG, VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dallot-seq', function(asm) {
  asm.// store buffer's length
  inc(HEAP_REG).uint32(4).
      pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(0).
      push(HEAP_REG).
      // calc byte size
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(4).
      cls(VM.CPU.STATUS.NUMERICS).
      muli(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      // increase heap ptr
      cls(VM.CPU.STATUS.NUMERICS).
      addi(HEAP_REG, VM.CPU.REGISTERS.STATUS).
      inc(VM.CPU.REGISTERS.R0).uint32(8).
      mov(HEAP_REG, VM.CPU.REGISTERS.R0).
      // terminate seq
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(TERMINATOR).
      store(VM.CPU.REGISTERS.R0, 0, HEAP_REG).uint32(-4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dhere', function(asm) {
  asm.
      push(HEAP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('current-frame', function(asm) {
  asm.
      push(FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('set-current-frame', function(asm) {
  asm.pop(FP_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
})

defop('data-segment', function(asm) {
  asm.push(VM.CPU.REGISTERS.DS).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('dict', function(asm) {
  asm.
      push(DICT_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('set-dict', function(asm) {
  asm.
      pop(DICT_REG).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('not', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.R1, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
      push(VM.CPU.REGISTERS.R1).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('lognot', function(asm) {
  asm.
      pop(VM.CPU.REGISTERS.R0).
      not(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('rot', function(asm) {
  // a b c -> c b a
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(8).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(8).
      store(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('rotdrop', function(asm) {
  // a b c -> c b
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(4).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('rotdrop2', function(asm) {
  // a b c -> c
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(4).
      pop(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

// todo how to swapdrop with a frame in the way?
defop('swapdrop', function(asm) {
  asm.pop(VM.CPU.REGISTERS.R0).
      store(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

/*
  defop('indirect-param', function(asm) {
    asm.mov(VM.CPU.REGISTERS.R0, EVAL_IP_REG).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(4).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next');
  });
  */

defop('value-peeker', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('variable-peeker', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(8).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('pointer-peeker', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(8).
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(0).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('input-flush', function(asm) {
  asm.call(0, VM.CPU.REGISTERS.CS).uint32('input_flush').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('input-reset', function(asm) {
  asm.call(0, VM.CPU.REGISTERS.CS).uint32('reset_input').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('wait-for-input', function(asm) {
  asm.call(0, VM.CPU.REGISTERS.CS).uint32('wait_for_input').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});

defop('do-accessor', function(asm) {
  asm.load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.R0).uint32(8).
      pop(VM.CPU.REGISTERS.R1).
      cls(VM.CPU.REGISTERS.STATUS).
      addi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.STATUS).
      push(VM.CPU.REGISTERS.R0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
});
