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
  "02-init": fs.readFileSync(__dirname + '/02/init.4th', 'utf-8'),  
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

Forth.assembler = function(ds, cs, info, stage, asm) {
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
  asm_input(asm, input_dev_irq, input_dev_addr);
  asm_output(asm, output_dev_irq, output_dev_addr);

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

  eval(fs.readFileSync(__dirname + '/platform/bacaw/forth_00.js', 'utf-8'));
  interp(asm, forth_sources['00-core']);
  interp(asm, forth_sources['00-list']);
  interp(asm, forth_sources['00-core-compiler']);
  interp(asm, forth_sources['00-output']);
  interp(asm, forth_sources['00-init']);

  if(stage.indexOf('stage0') >= 0) {
    interp(asm, forth_sources['00-ui']);
  } else if(stage.indexOf('stage1') >= 0) {
    eval(fs.readFileSync(__dirname + '/platform/bacaw/forth_01.js', 'utf-8'));
    eval(fs.readFileSync(__dirname + '/platform/bacaw/forth_interrupts.js', 'utf-8'));
    
    //interp(asm, forth_sources['01-atoi']);
    interp(asm, forth_sources['01-tty']);
    interp(asm, forth_sources['01-dict']);
    interp(asm, forth_sources['01-seq']);
    interp(asm, forth_sources['01-stack']);
    interp(asm, forth_sources['01-ui']);

    interp(asm, forth_sources['02-init']);
    interp(asm, forth_sources['03-byte-string']);
    interp(asm, forth_sources['03-assembler']);
    interp(asm, forth_sources['03-interrupts']);
    interp(asm, forth_sources['02-sound']);
    interp(asm, forth_sources['02-memdump']);
    interp(asm, forth_sources['02-decompiler']);
    interp(asm, forth_sources['03-sequence']);
    interp(asm, forth_sources['03-storage-devices']);
    interp(asm, forth_sources['03-storage']);
    interp(asm, forth_sources['03-storage-test']);

    //interp(asm, forth_sources['02-misc']);
    //interp(asm, forth_sources['extra']);
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

  var off = ds + data_segment_offset + 4;
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
  
  asm.label('immediate-dictionary').uint32(last_label);

  if(stage.indexOf('min') == -1) {
    asm.label('sources').uint32('sources-end', true);
    for(var n in forth_sources) {
      asm.label('sources-' + n + '-src').bytes(cellpad(forth_sources[n]));
    }
    asm.label('sources-end');
  }
  
  return asm;
}

Forth.assemble = function(ds, cs, info, stage, asm) {
  if(asm == null) asm = new Assembler();
  return Forth.assembler(ds, cs, info, stage, asm).assemble();
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
