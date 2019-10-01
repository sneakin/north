// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

require('vm');
const util = require('more_util');
const Assembler = require('assembler.js');
const DataStruct = require('data_struct');
const fs = require('fs');
const TextEncoder = require('util/text_encoder');

var TESTING = 0;
var forth_sources = {};

function Forth()
{
}

function longify(str)
{
  var bytes = (new TextEncoder()).encode(str);
  return bytes.slice(0, 4).reverse().reduce((a, c) => (a << 8) | c);
}

const CELL_SIZE = 4;
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
  return Math.ceil(n / CELL_SIZE) * CELL_SIZE;
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
      replace(/\\a/g, "\x07").
      replace(/\\b/g, "\b").
      replace(/\\f/g, "\f").
      replace(/\\e/g, "\x1b").
      replace(/\\v/g, "\v").
      replace(/\\n/g, "\n").
      replace(/\\r/g, "\r").
      //replace(/\\'/g, "\'").
      //replace(/\\"/g, "\"").
      replace(/\\t/g, "\t").
      replace(/\\\\/g, "\\")
     ;
}

function dictionary_add(name, code, data, doc, args)
{
  var entry = {
    code: code,
    data: data,
    doc: doc,
    args: args,
    next: last_dictionary,
    prior: dictionary[name] // keep old definitions
  };
  
  last_dictionary = name;
  dictionary[name] = entry;

  return entry;
}

function dictionary_variable(name)
{
  data_segment_offset += VM.TYPES.ULONG.byte_size;
  var e = dictionary_add(name, 'variable-peeker-code', data_segment_offset);
  e.segment = 'data';
  return e;
}
var genlabel_counter = util.counter();

function genlabel(prefix)
{
  if(prefix == null) prefix = 'gen';
  var n = genlabel_counter();
  return `${prefix}-${n}`;
}

function colon_def(asm, token, code)
{
  var tok = next_token(code);
  var name = tok[0];

  dictionary_add(name, 'call-data-seq-code', name + '-entry-data');

  asm.
      label(name + '-entry-data').
      uint32(name + '-end', true, (v) => v / CELL_SIZE - 1).
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
        label(name + '-size', (asm.resolve(name + '-end') - asm.resolve(name + '-ops')) / CELL_SIZE).
        uint32(TERMINATOR);
  },
  alias: function(asm, token, code) {
    // alias NAME AS
    // Adds a dictionary entry named NAME that is a copy of AS.
    var tok = next_token(code);
    var name = tok[0];
    tok = next_token(tok[1]);
    var entry = dictionary[tok[0]];
    
    dictionary_add(name, entry.code, entry.data, entry.doc, entry.args);

    return tok[1];
  },    
  constant: function(asm, token, code) {
    // constant NAME NUMBER-VALUE
    // Adds a dictionary entry with the name and value.
    var tok = next_token(code);
    var name = tok[0];
    tok = next_token(tok[1]);
    var value = parse_number(tok[0]);

    dictionary_add(name, 'value-peeker-code', value);

    return tok[1];
  },    
  "global-var": function(asm, token, code) {
    // variable NAME
    // Adds a dictionary entry with the name and space in the data segment
    var tok = next_token(code);
    var name = tok[0];

    dictionary_variable(name);

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
    dictionary[name] = null;
  },
  IF: function(asm, token, code) {
    var jump_label = genlabel(last_dictionary);
    stack.push(jump_label);
    
    asm.uint32('literal').
        uint32(jump_label).
        uint32('unlessjump');
  },
  UNLESS: function(asm, token, code) {
    var jump_label = genlabel(last_dictionary);
    stack.push(jump_label);
    
    asm.uint32('literal').
        uint32(jump_label).
        uint32('ifthenjump');
  },
  ELSE: function(asm, token, code) {
    var if_label = stack.pop();
    var then_label = genlabel(last_dictionary);
    stack.push(then_label);
    
    asm.uint32('literal').uint32(then_label).
        uint32('jump').
        label(if_label);
  },
  THEN: function(asm, token, code) {
    // fix the IF to jump here
    var label = stack.pop();
    asm.label(label);
  },
  RECURSE: function(asm, token, code) {
    asm.uint32('literal').uint32(last_dictionary).uint32('jump-entry-data');
  },
  "DOTIMES[": function(asm, token, code) {
    var start_label = genlabel('dotimes');
    var finish_label = genlabel('dotimes');
    stack.push(start_label);
    stack.push(finish_label);
    asm.uint32('int32').uint32(0).
        uint32('pointer').uint32(finish_label).
        uint32('begin').
        label(start_label).
        uint32('arg0').uint32('arg1').uint32('<').
        uint32('int32').uint32(CELL_SIZE).uint32('ifthenreljump').uint32('return-locals');
  },
  "]DOTIMES": function(asm, token, code) {
    var finish_label = stack.pop();
    var start_label = stack.pop();
    asm.uint32('arg0').uint32('int32').uint32(1).uint32('int-add').
        uint32('set-arg0').
        uint32('int32').uint32(start_label, true, (p) => p - CELL_SIZE * 2).uint32('jumprel').
        label(finish_label);
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
  "i'": function(asm, token, code) {
    var tok = next_token(code);
    asm.uint32('literal').uint32('immed-' + tok[0]);
    return tok[1];
  },
  "(": function(asm, token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      return code.slice(m + 1);
    } else {
      throw "parse error";
    }
  },
  'doc(': function(asm, token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      var label = genlabel('doc');
      strings[label] = code.slice(1, m);
      dictionary[last_dictionary].doc = label;
      return code.slice(m + 1);
    } else {
      return "parse error: unterminated doc comment";
    }
  },
  'args(': function(asm, token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      var label = genlabel('args');
      strings[label] = code.slice(1, m);
      dictionary[last_dictionary].args = label;
      return code.slice(m + 1);
    } else {
      return "parse error: unterminated doc comment";
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
    
  try {
    for(s = str; s.length > 0;) {
      var t = next_token(s);
      if(t == false) break;
      
      s = t[1];
      var r = execute(asm, t[0], s);
      if(r != null) s = r;
    }
    
    return asm;
  } catch(e) {
    console.error("Caught " + e);
    if(s) console.error("processing: " + s.substr(0, 32) + "...");
    throw(e);
  }
}

Forth.assembler = function(stage, platform, sources) {
  var ds = platform.data_segment;
  var cs = platform.code_segment;
  var asm = platform.assembler;
  
  function defop(name, fn, doc, args) {
    var entry = dictionary_add(name, name + "-code", null);
    if(doc) {
      strings[name + '-doc'] = doc;
      entry.doc = name + '-doc';
    }
    if(args) {
      strings[name + '-args'] = args;
      entry.args = name + '-args';
    }
    return fn(asm.label(name + "-code"));
  }

  function defalias(name, calls) {
    var entry = dictionary[calls];
    dictionary_add(name, entry.code, entry.data);
  }

  strings["version-string-str"] = fs.readFileSync(__dirname + '/version.txt', 'utf-8').trim();
  dictionary_add("version-string", 'value-peeker-code', "version-string-str");
  strings["stage-string-str"] = stage;
  dictionary_add("stage-string", 'value-peeker-code', "stage-string-str");
  strings["platform-string-str"] = platform.name;
  dictionary_add("platform-string", 'value-peeker-code', "platform-string-str");

  function add_source(path, data)
  {
    var name = path.match(/(\w+[\\\/]\w+)\.\w+$/);
    if(name) {
      name = name[1].replace(/[\\\/]/g, '/');
      forth_sources[name] = data;
    }
  }

  // Load the sources
  
  for(var input of sources) {
    var data = fs.readFileSync(input, 'utf-8');
    console.log(input, data.length);
    if(input.match(/\.js$/)) {
      eval(data);
    } else if(input.match(/\.4th$/)) {
      interp(asm, data);
      add_source(input, data);
    }
  }

  // Entries to get the sources
  if(stage.indexOf('min') == -1) {
    for(var n in forth_sources) {
      interp(asm, `: ${n}-src literal sources-${n}-src return1 ;`);
    }
  }

  // trampolines
  if(platform.name == 'bacaw') {
    for(var n in dictionary) {
      var entry = dictionary[n];
      if(entry == null) continue;
      if(entry.code == 'call-data-seq-code' && entry.data != null) {
        asm.label(n + "-code").
            load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.CS).uint32(n + '-entry-data').
            load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('call-data-seq-code');
      }
    }
  }
  
  asm.label('*program-size*');

  asm.label('symbols-begin');
  
  for(var n in strings) {
    asm.label(n).bytes(cellpad(unslash(strings[n])));
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

  function raw_dict_entry(label, name, code, data, last_label, doc, args) {
    asm.label(label).
        uint32(name).
        uint32(code).
        uint32(data).
        uint32(doc || 0).
        uint32(args || 0).
        uint32(last_label);
    
    return label;
  }

  function write_dict_entry(n, entry, last_label, prefix)
  {
    if(entry == null) return last_label;
    if(prefix == null || entry.only == true) prefix = '';
    var data = entry.data;
    if(entry.data == null) data = 0;
    if(entry.segment == 'data') data += ds;
    return raw_dict_entry(prefix + n, n + '-sym', entry.code, data, last_label, entry.doc, entry.args);
  }
  
  var last_label = TERMINATOR;

  //for(var n of Object.keys(dictionary).sort()) {
  for(var n in dictionary) {
    last_label = write_dict_entry(n, dictionary[n], last_label);
  }

  asm.label('dictionary-end');
  asm.label('dictionary').uint32(last_label);
  asm.label('dictionary-size').uint32(asm.resolve('dictionary-end') - asm.resolve('dictionary-begin'));

  last_label = TERMINATOR;
  //for(var n of Object.keys(immediates).sort()) {
  for(var n in immediates) {
    last_label = write_dict_entry(n, immediates[n], last_label, 'immed-');
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

Forth.assemble = function(stage, platform, sources) {
  return Forth.assembler(stage, platform, sources).assemble();
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
