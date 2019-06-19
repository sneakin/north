// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

require('vm');
const util = require('more_util');
const Assembler = require('assembler.js');
const asm_memcpy = require('vm/asm/memcpy');
const asm_input = require('vm/asm/input-device');
const asm_output = require('vm/asm/output-device');
const asm_isr = require('vm/asm/isr');
const DataStruct = require('data_struct');
const fs = require('fs');
const TextEncoder = require('util/text_encoder');

var TESTING = 0;

const forth_sources = {
  "00-list": fs.readFileSync(__dirname + '/00/list.4th', 'utf-8'),
  "00-core": fs.readFileSync(__dirname + '/00/core.4th', 'utf-8'),
  "00-core-compiler": fs.readFileSync(__dirname + '/00/compiler.4th', 'utf-8'),
  "00-output": fs.readFileSync(__dirname + '/00/output.4th', 'utf-8'),  
  "00-ui": fs.readFileSync(__dirname + '/00/ui.4th', 'utf-8'),  
  "00-init": fs.readFileSync(__dirname + '/00/init.4th', 'utf-8'),  
  "01-atoi": fs.readFileSync(__dirname + '/01/atoi.4th', 'utf-8'),
  "01-tty": fs.readFileSync(__dirname + '/01/tty.4th', 'utf-8'),
  "01-dict": fs.readFileSync(__dirname + '/01/dict.4th', 'utf-8'),  
  "01-seq": fs.readFileSync(__dirname + '/01/seq.4th', 'utf-8'),  
  "01-stack": fs.readFileSync(__dirname + '/01/stack.4th', 'utf-8'),  
  "01-ui": fs.readFileSync(__dirname + '/01/ui.4th', 'utf-8'),  
  "02-memdump": fs.readFileSync(__dirname + '/02/memdump.4th', 'utf-8'),  
  "02-decompiler": fs.readFileSync(__dirname + '/02/decompiler.4th', 'utf-8'),  
  "02-misc": fs.readFileSync(__dirname + '/02/misc.4th', 'utf-8'),
  "03-assembler": fs.readFileSync(__dirname + '/03/assembler.4th', 'utf-8'),
  "03-interrupts": fs.readFileSync(__dirname + '/03/interrupts.4th', 'utf-8'),
  "03-sequence": fs.readFileSync(__dirname + '/03/sequence.4th', 'utf-8'),
  "03-byte-string": fs.readFileSync(__dirname + '/03/byte_string.4th', 'utf-8'),
  "03-storage-devices": fs.readFileSync(__dirname + '/03/storage_devices.4th', 'utf-8'),
  "03-storage": fs.readFileSync(__dirname + '/03/storage.4th', 'utf-8'),
  "03-storage-test": fs.readFileSync(__dirname + '/03/storage_test.4th', 'utf-8'),
  "02-sound": fs.readFileSync(__dirname + '/02/sound.4th', 'utf-8'),
  "core-4": fs.readFileSync(__dirname + '/04/core.4th', 'utf-8'),
  "core-constants": fs.readFileSync(__dirname + '/04/constants.4th', 'utf-8'),
  extra: fs.readFileSync(__dirname + '/forth_extra.4th', 'utf-8'),
  fast_dict: fs.readFileSync(__dirname + '/02/fast_dict.4th', 'utf-8'),
  assembler: fs.readFileSync(__dirname + '/02/assembler.4th', 'utf-8'),
  ops: fs.readFileSync(__dirname + '/02/ops.4th', 'utf-8')
};

function Forth()
{
}

function longify(str)
{
  /*
  return str.split('').
      map((c) => c.charCodeAt(0)).
      reverse().
      reduce((a, c) => (a << 8) | c);
*/
  var bytes = (new TextEncoder()).encode(str);
  return bytes.slice(0, 4).reverse().reduce((a, c) => (a << 8) | c);
}

var TERMINATOR = longify("STOP");
var CRNL = longify("\r\n");
var HELO = longify("HELO");
var BYE = longify("\nBYE");
var OK1 = longify(" OK ");
var PS0 = longify("\r\n$ ");
var PS1 = longify("\r\n> ");
var ERR1 = longify("\r\nER");
var ERR2 = longify("\r\n> ");

function cell_align(n)
{
  return Math.ceil(n / 4) * 4;
}

function cellpad(str)
{
  var bytes = (new TextEncoder()).encode(str);
  var arr = new Uint8Array((2 + bytes.length) * VM.TYPES.ULONG.byte_size);
  var dv = new DataView(arr.buffer);

  VM.TYPES.ULONG.set(dv, 0, bytes.length, true);
  VM.TYPES.ULONG.set(dv, (1 + bytes.length) * VM.TYPES.ULONG.byte_size, TERMINATOR, true);
  
  for(var i = 0; i < bytes.length; i++) {
    VM.TYPES.ULONG.set(dv, (1 + i) * VM.TYPES.ULONG.byte_size, bytes[i], true);
  }
  
  return arr;
}

var strings = {};

function next_token(str)
{
  var sp = str.match(/[ \t\n\r\f\v]*([^ \t\n\r\f\v]+)/)
    
  if(sp) {
    return [ sp[1], str.slice(sp[0].length) ];
  } else if(str.match(/[ \t\n\r\f\v]*/)) {
    return false;
  } else {
    throw "Parse error";
  }
}

const base_chars = {
  "#": 10,
  "&": 10,
  "$": 16,
  "x": 16,
  "%": 2
};

function parse_number(str)
{
  var m = str.match(/^([$#x%]?)(-?[0-9a-fA-F]+)$/);
  if(m) {
    var base = 10;
    if(m[1].length > 0) base = base_chars[m[1]];
    var n = parseInt(m[2], base);
    if(Number.isNaN(n) == false) {
      return n;
    }
  }
  
  return null;
}

function compile(asm, e, quote_numbers)
{
  if(e.length == 0) return;
  
  var m = e.match(/^(.+):$/);
  if(m) {
    asm.label(m[1]);
  } else {
    var n = parse_number(e);
    if(n != null) {
      if(quote_numbers) {
        asm.uint32('literal');
      }

      asm.uint32(n);
    } else {
      asm.uint32(e);
    }
  }
}

var stack = [];
var dictionary = {
};
var immediates = {
};
var last_dictionary;
var data_segment_offset = 0;

function unslash(str)
{
  return str.
      replace(/\\a/g, "\a").
      replace(/\\b/g, "\b").
      replace(/\\f/g, "\f").
      replace(/\\e/g, "\e").
      replace(/\\v/g, "\v").
      replace(/\\n/g, "\n").
      replace(/\\r/g, "\r").
      //replace(/\\'/g, "\'").
      //replace(/\\"/g, "\"").
      replace(/\\t/g, "\t").
      replace(/\\\\/g, "\\")
     ;
}

function genlabel(prefix)
{
  if(prefix == null) prefix = 'gen';
  var n = Math.floor(1.0e9 * Math.random());
  return `${prefix}-${n}`;
}

function colon_def(asm, token, code)
{
  var tok = next_token(code);
  var name = tok[0];
  
  last_dictionary = name;
  dictionary[name] = {
    code: 'call-data-seq-code',
    prior: dictionary[name]
  };
  
  asm.label(name + "-code").
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('call-data-seq-code').
      label(name + '-entry-data').
      uint32(name + '-end', true, (v) => v / 4 - 1).
      label(name + '-ops');
  
  return tok[1];
}

function literal_immediate(asm, token, code)
{
    var tok = next_token(code);
    var label = genlabel('data');
    strings[label] = tok[0];
    asm.uint32('literal').uint32(label);
    return tok[1];
}

var macros = {
  ":": colon_def,
  "::": colon_def,
  ";": function(asm, token, code) {
    var name = last_dictionary;
    dictionary[name].data = name + '-entry-data';
    
    asm.uint32('return0').
        label(name + '-end').
        label(name + '-size', (asm.resolve(name + '-end') - asm.resolve(name + '-ops')) / 4).
        uint32(TERMINATOR);
  },
  constant: function(asm, token, code) {
    // constant NAME NUMBER-VALUE
    // Adds a dictionary entry with the name and value.
    var tok = next_token(code);
    var name = tok[0];
    tok = next_token(tok[1]);
    var value = parse_number(tok[0]);

    last_dictionary = name;
    dictionary[name] = {
      code: 'value-peeker-code',
      data: value,
      prior: dictionary[name]
    };

    return tok[1];
  },    
  "global-var": function(asm, token, code) {
    // variable NAME
    // Adds a dictionary entry with the name and space in the data segment
    var tok = next_token(code);
    var name = tok[0];
    //tok = next_token(tok[1]);
    //var value = parse_number(tok[0]);

    data_segment_offset += VM.TYPES.ULONG.byte_size;
    last_dictionary = name;
    dictionary[name] = {
      code: 'variable-peeker-code',
      data: data_segment_offset,
      segment: 'data',
      prior: dictionary[name]
    };

    return tok[1];
  },    
  longify: function(asm, token, code) {
    var tok = next_token(code);
    var v = unslash(tok[0]);
    var l = longify(v);
    asm.uint32('uint32').uint32(l);
    return tok[1];
  },
  'longify"': function(asm, token, code) {
    var m = code.indexOf('"');
    if(m >= 0) {
      var tok = code.slice(1, m + 1);
      var l = longify(unslash(tok[0]));
      asm.uint32('uint32').uint32(l);
      return tok[1];
    } else {
      throw "parse error";
    }
  },
  "char-code": function(asm, token, code) {
    var tok = next_token(code);
    var v = unslash(tok[0]);
    var n = v.codePointAt(0);
    asm.uint32(n);
    return tok[1];
  },
  immediate: function(asm, token, code) {
    var name = last_dictionary;
    immediates[name] = dictionary[name];
  },
  "immediate-as": function(asm, token, code) {
    var name = last_dictionary;
    var tok = next_token(code);
    var im_name = tok[0]
    immediates[im_name] = dictionary[name];
    return tok[1];
  },
  "immediate-only": function(asm, token, code) {
    var name = last_dictionary;
    immediates[name] = dictionary[name];
    immediates[name].only = true;
    dictionary[name] = dictionary[name].prior;
  },
  IF: function(asm, token, code) {
    var jump_label = genlabel(last_dictionary);
    stack.push(jump_label);
    
    asm.uint32('not').
        uint32('literal').
        uint32(jump_label).
        uint32('ifthenjump');
  },
  UNLESS: function(asm, token, code) {
    var jump_label = genlabel(last_dictionary);
    stack.push(jump_label);
    
    asm.uint32('literal').
        uint32(jump_label).
        uint32('ifthenjump');
  },
  THEN: function(asm, token, code) {
    // fix the IF to jump here
    var label = stack.pop();
    asm.label(label);
  },
  RECURSE: function(asm, token, code) {
    asm.uint32('literal').uint32(last_dictionary).uint32('jump-entry-data');
  },
  POSTPONE: function(asm, token, code) {
    var tok = next_token(code);
    asm.uint32(tok[0]);
    return tok[1];
  },
  '"': function(asm, token, code) {
    var m = code.indexOf('"');
    if(m >= 0) {
      var label = genlabel('data');
      strings[label] = code.slice(1, m);

      asm.uint32('string').uint32(label);

      return code.slice(m + 1);
    } else {
      return "parse error: unterminated string";
    }
  },
  lit: function(asm, token, code) {
    var tok = next_token(code);
    var label = genlabel('data');
    strings[label] = tok[0];
    asm.uint32('literal').uint32(label);
    return tok[1];
  },
  "'": function(asm, token, code) {
    var tok = next_token(code);
    asm.uint32('literal').uint32(tok[0]);
    return tok[1];
  },
  "(": function(asm, token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      return code.slice(m + 1);
    } else {
      throw "parse error";
    }
  }
};

function execute(asm, token, code)
{
  var func = macros[token];
  if(func) {
    return func(asm, token, code);
  } else if(token) {
    compile(asm, token);
  }
}

function interp(asm, str)
{
  var s = str;
  
  for(var s = str; s.length > 0;) {
    var t = next_token(s);
    if(t == false) break;
    
    s = t[1];
    var r = execute(asm, t[0], s);
    if(r != null) s = r;
  }
  
  return asm;
}

Forth.assembler = function(ds, cs, info, stage) {
  var asm = new Assembler();

  info = util.merge_options({
    input: {
      irq: 0xA,
      addr: 0xFFFF1000
    },
    output: {
      irq: 0xB,
      addr: 0xFFFF2000
    }
  }, info);
  
  var input_dev_irq = info.input.irq;
  var input_dev_addr = info.input.addr;

  var output_dev_irq = info.output.irq;
  var output_dev_addr = info.output.addr;

  var ops = [];
  
  var STACK_SIZE = 4*1024;
  var DS_SIZE = 1024*2;
  var HEAP_REG = VM.CPU.REGISTERS.DS - 1;
  var EVAL_IP_REG = HEAP_REG - 1;
  var STATE_REG = HEAP_REG - 2;
  var PARAM_REG = HEAP_REG - 3;
  var TOS_REG = HEAP_REG - 4;
  var DICT_REG = HEAP_REG - 4;
  var FP_REG = HEAP_REG - 5;

  asm_isr(asm, VM.CPU.INTERRUPTS.user * 3);
  asm_memcpy(asm);

  function defop(name, fn) {
    ops.push(name);
    return fn(asm.label(name + "-code"));
  }

  function defalias(name, calls) {
    ops.push(name);
    return asm.label(name + "-code").
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32(calls + '-code');
  }

  asm.label('isr_reset').
      call(0, VM.CPU.REGISTERS.CS).uint32('data_init').
      call(0, VM.CPU.REGISTERS.CS).uint32('output_init').
      call(0, VM.CPU.REGISTERS.CS).uint32('input_init').
      sie().
      call(0, VM.CPU.REGISTERS.CS).uint32('eval-init').
      mov(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.CS).
      inc(VM.CPU.REGISTERS.R0).uint32('boot').
      push(VM.CPU.REGISTERS.R0).
      call(0, VM.CPU.REGISTERS.CS).uint32('outer-start-thread').
      call(0, VM.CPU.REGISTERS.CS).uint32('goodbye').
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('isr_reset');
  
  asm.label('goodbye').
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(BYE).
      call(0, VM.CPU.REGISTERS.CS).uint32('output_write_word').
      ret();

  var offset = data_segment_offset;
  asm.label('input_data_position', offset).
      label('output_data_position', offset + 4).
      label('waiting_for_input', offset + 8).
      label('waiting_for_output', offset + 12).
      label('heap_top', offset + 16).
      label('stack_top', offset + 20).
      label('data_segment_end', offset + 24);
  data_segment_offset = 4 + asm.resolve('data_segment_end');
  
  asm.label('data_init').
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(TOS_REG, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(PARAM_REG, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(VM.CPU.REGISTERS.DS, 0, VM.CPU.REGISTERS.INS).uint32(ds).
      load(VM.CPU.REGISTERS.CS, 0, VM.CPU.REGISTERS.INS).uint32(cs).
      mov(HEAP_REG, VM.CPU.REGISTERS.DS).
      inc(HEAP_REG).uint32(DS_SIZE).
      store(HEAP_REG, 0, VM.CPU.REGISTERS.DS).uint32('heap_top').
      pop(VM.CPU.REGISTERS.R0). // get return
      store(VM.CPU.REGISTERS.SP, 0, VM.CPU.REGISTERS.DS).uint32('stack_top').
      mov(VM.CPU.REGISTERS.IP, VM.CPU.REGISTERS.R0); // return

  defop('reboot', function(asm) {
    asm.reset();
  });
  
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
  });
  
  asm_input(asm, input_dev_irq, input_dev_addr);
  asm_output(asm, output_dev_irq, output_dev_addr);

  asm.label('eval-init').
      load(TOS_REG, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(PARAM_REG, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(DICT_REG, 0, VM.CPU.REGISTERS.INS).uint32(TERMINATOR).
      // zero frame's link
      load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
      pop(VM.CPU.REGISTERS.R1).
      push(VM.CPU.REGISTERS.R0).
      mov(FP_REG, VM.CPU.REGISTERS.SP).
      push(VM.CPU.REGISTERS.R1).
      ret();

  asm.label('outer-start-thread').
      // swap return addr and EIP
      // and make a frame before pushing them back
      pop(VM.CPU.REGISTERS.R0). // return addr
      pop(VM.CPU.REGISTERS.R1). // eip to exec
      push(VM.CPU.REGISTERS.R0).
      push(VM.CPU.REGISTERS.R1).
      load(FP_REG, 0, VM.CPU.REGISTERS.INS).uint32(0).
      load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code');

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
  });

  // Return to the function started with outer-start-thread, but not the
  // outer-start-thread's caller.
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
  });
  
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
  
  defop('dropn', function(asm) {
    asm.pop(VM.CPU.REGISTERS.R0).
        cls(VM.CPU.STATUS.NUMERICS).
        addi(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.STATUS).
        mov(VM.CPU.REGISTERS.SP, VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
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
  
  defop('dup1', function(asm) {
    asm.
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.SP).uint32(4).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code').
        ret();
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
  
  defop('<', function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
  
  defop('<=', function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cmpi(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.R1).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
  
  defop('>', function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
  
  defop('>=', function(asm) {
    asm.
        pop(VM.CPU.REGISTERS.R1).
        pop(VM.CPU.REGISTERS.R0).
        cmpi(VM.CPU.REGISTERS.R1, VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.NEGATIVE, VM.CPU.REGISTERS.INS).uint32(1).
        load(VM.CPU.REGISTERS.R0, VM.CPU.STATUS.ZERO, VM.CPU.REGISTERS.INS).uint32(1).
        push(VM.CPU.REGISTERS.R0).
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('next-code');
  });
  
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

  //var tok = tokenize(forth_sources.core);
  interp(asm, forth_sources['00-core']);
  interp(asm, forth_sources['00-list']);
  interp(asm, forth_sources['00-core-compiler']);
  interp(asm, forth_sources['00-output']);
  interp(asm, forth_sources['00-init']);

  if(stage.indexOf('stage0') >= 0) {
    interp(asm, forth_sources['00-ui']);
  } else if(stage.indexOf('stage1') >= 0) {
    eval(fs.readFileSync(__dirname + '/forth_01.js', 'utf-8'));
    eval(fs.readFileSync(__dirname + '/forth_interrupts.js', 'utf-8'));
    
    //interp(asm, forth_sources['01-atoi']);
    interp(asm, forth_sources['01-tty']);
    interp(asm, forth_sources['01-dict']);
    interp(asm, forth_sources['01-seq']);
    interp(asm, forth_sources['01-stack']);
    interp(asm, forth_sources['01-ui']);

    interp(asm, forth_sources['02-memdump']);
    interp(asm, forth_sources['02-decompiler']);
    interp(asm, forth_sources['03-interrupts']);
    interp(asm, forth_sources['03-assembler']);
    interp(asm, forth_sources['03-byte-string']);
    interp(asm, forth_sources['03-sequence']);
    interp(asm, forth_sources['03-storage-devices']);
    interp(asm, forth_sources['03-storage']);
    interp(asm, forth_sources['03-storage-test']);
    interp(asm, forth_sources['02-sound']);
    //interp(asm, forth_sources['02-misc']);

    //interp(asm, forth_sources['assembler']);
    //interp(asm, forth_sources['extra']);
    
    //interp(asm, forth_sources.assembler);
  }

  if(stage.indexOf('min') == -1) {
    for(var n in forth_sources) {
      interp(asm, `: ${n}-src literal sources-${n}-src return1 ;`);
    }
  }
  
  asm.label('*program-size*');

  asm.label('symbols-begin');

  // Variable names

  asm.label('the-tokenizer-sym').label('*tokenizer*-sym').bytes(cellpad('*tokenizer*'));
  asm.label('*debug*-sym').bytes(cellpad('*debug*'));
  asm.label('*status*-sym').bytes(cellpad('*status*'));
  asm.label('base-sym').bytes(cellpad('base'));
  asm.label('TERMINATOR-sym').bytes(cellpad('TERMINATOR'));
  asm.label('*state*-sym').bytes(cellpad('*state*'));
  asm.label('immediate-dict-sym').bytes(cellpad('immediate-dict'));
  asm.label('isr-handlers-sym').bytes(cellpad('isr-handlers'));
  asm.label('interrupt-waiting-for-sym').bytes(cellpad('interrupt-waiting-for'));

  for(var n in strings) {
    asm.label(n).bytes(cellpad(unslash(strings[n])));
  }
  
  for(var n in ops) {
    var label = ops[n];
    asm.label(label + '-sym').bytes(cellpad(label));
  }

  for(var n in dictionary) {
    if(dictionary[n] == null) continue;
    asm.label(n + '-sym').bytes(cellpad(n));
  }
  for(var n in immediates) {
    if(immediates[n] == null) continue;
    try {
      asm.resolve(n + '-sym');
    } catch(e) {
      asm.label(n + '-sym').bytes(cellpad(n));
    }
  }

  asm.label('symbols-end');
  asm.label('symbols-size').uint32(asm.resolve('symbols-end') - asm.resolve('symbols-begin'));
  
  asm.label('dictionary-begin');

  function dict_entry(label, name, code, data, last_label) {
    asm.label(label).
        uint32(name).
        uint32(code).
        uint32(data).
        uint32(last_label);
    
    return label;
  }

  function dict_entry_op(label, last_label) {
    return dict_entry(label, label + '-sym', label + "-code", 0, last_label);
  }

  function dict_entry_fn(label, last_label) {
    return dict_entry(label, label + '-sym', 'call-data-seq-code', label + "-entry-data", last_label);
  }

  var last_label = TERMINATOR;

  for(var n in ops) {
    var label = ops[n];
    last_label = dict_entry_op(label, last_label);
  }

  for(var n in dictionary) {
    var entry = dictionary[n];
    if(entry == null) continue;
    var data = entry.data;
    if(entry.segment == 'data') data += ds;
    last_label = dict_entry(n, n + '-sym', entry.code, data, last_label);
  }

  // Variables
  function dict_entry_var(label, value, last_label) {
    return dict_entry(label, label + '-sym', 'variable-peeker-code', value, last_label);
  }

  var off = ds + data_segment_offset;
  last_label = dict_entry_var('*tokenizer*', off, last_label);
  last_label = dict_entry_var('*status*', off+4, last_label);
  last_label = dict_entry_var('*debug*', off+8, last_label);
  last_label = dict_entry_var('*state*', off+12, last_label);
  last_label = dict_entry_var('base', off+16, last_label);
  last_label = dict_entry_var('immediate-dict', off+20, last_label);
  last_label = dict_entry_var('isr-handlers', off+24, last_label);
  last_label = dict_entry_var('interrupt-waiting-for', off+28, last_label);

  asm.label('dictionary-end');
  asm.label('dictionary').uint32(last_label);
  asm.label('dictionary-size').uint32(asm.resolve('dictionary-end') - asm.resolve('dictionary-begin'));

  asm.label('tok-write-sym').bytes(cellpad('.'));
  //asm.label('e-lit-sym').bytes(cellpad('lit'));
  //asm.label("e-'-sym").bytes(cellpad("'"));
  //asm.label("e-[']-sym").bytes(cellpad("[']"));
  //asm.label('e-"-sym').bytes(cellpad('"'));
  //asm.label('e-[-sym').bytes(cellpad('['));
  //asm.label('e-]-sym').bytes(cellpad(']'));
  //asm.label('e-endcol-sym').bytes(cellpad(';'));
      
  last_label = TERMINATOR;
  for(var n in immediates) {
    var entry = immediates[n];
    if(entry == null) continue;
    label = n;
    if(entry.only != true) {
      label = "e-" + n;
    }
    last_label = dict_entry(label, n + '-sym', entry.code, entry.data, last_label);
  }
  //last_label = dict_entry('tok-write', 'tok-write-sym', 'call-data-seq-code', 'write-line-ops', last_label);
  //last_label = dict_entry('e-lit', 'call-data-code', 'c-lit-ops', last_label);
  //last_label = dict_entry("e-'", 'call-data-code', "c-'-ops", last_label);
  //last_label = dict_entry("e-[']", 'call-data-code', "'-ops", last_label);
  //last_label = dict_entry('e-"', 'call-data-code', 'c-"-ops', last_label);
  //last_label = dict_entry("e-postpone", 'call-data-code', "postpone-ops", last_label);
  //last_label = dict_entry('e-[', 'call-data-code', '[-ops', last_label);
  //last_label = dict_entry('e-]', 'call-data-code', ']-ops', last_label);
  //last_label = dict_entry('e-endcol', 'call-data-code', 'endcol-ops', last_label);
  
  asm.label('immediate-dictionary').uint32(last_label);

  if(stage.indexOf('min') == -1) {
    asm.label('sources').uint32('sources-end', true);
    for(var n in forth_sources) {
      asm.label('sources-' + n + '-src').bytes(cellpad(forth_sources[n]));
    }
    asm.label('sources-end');
  }
  
  /*
  asm.label('image-size').
      uint32('*program-size*').
      uint32('dictionary-size').
      uint32('symbols-size').
      uint32('image-size');
*/
  
  return asm;
}

Forth.assemble = function(ds, cs, info, stage) {
  return Forth.assembler(ds, cs, info, stage).assemble();
}

Forth.longify = longify;
Forth.cellpad = cellpad;
Forth.cell_align = cell_align;
Forth.sources = forth_sources;
Forth.interp = interp;
Forth.execute = execute;
Forth.next_token = next_token;
Forth.unslash = unslash;

if(typeof(module) != 'undefined') {
  module.exports = Forth;
}

if(typeof(window) != 'undefined') {
  window.Forth = Forth;
}
