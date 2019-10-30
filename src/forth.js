// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

require('vm');
const util = require('more_util');
const Assembler = require('assembler.js');
const DataStruct = require('data_struct');
const fs = require('fs');
const TextEncoder = require('util/text_encoder');

var TESTING = 0;

function Forth(platform)
{
  this.platform = platform;
  this.cell_size = platform.cell_size;
  this.emitter = platform.assembler;
  this.sources = {};
  this.stack = [];
  this.dictionary = {};
  this.immediates = {};
  this.last_dictionary = null;
  this.strings = {};
  this.data_segment_offset = 0;
  this.indexed_ops = false;
  this.next_index = 0x80000000;
  this.macros = Forth.macros;
}

Forth.longify = function(str)
{
  var bytes = (new TextEncoder()).encode(str);
  return bytes.slice(0, 4).reverse().reduce((a, c) => (a << 8) | c);
}

const TERMINATOR = Forth.longify("STOP");

Forth.prototype.longify = Forth.longify;

Forth.prototype.cell_align = function(n)
{
  return Math.ceil(n / this.cell_size) * this.cell_size;
}

Forth.prototype.cellpad = function(str)
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

Forth.prototype.next_token = function(str)
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

Forth.prototype.parse_number = function(str)
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

Forth.prototype.lookup = function(word)
{
  var e = this.dictionary[word];
  if(e) return e.op;
  //e = asm && asm.resolve(word);
  if(e === undefined) console.warn("Undefined word: " + word);
  return word;
}

Forth.prototype.apply_namespace = function(word)
{
  if(word.match(/^::\w+/)) word = word.slice(2);
  else if(this.word_prefix) word = this.word_prefix + ':' + word;
  return word;
}

Forth.prototype.compile = function(word, quote_numbers)
{
  if(word.length == 0) return;
  
  var m = word.match(/^(.+):$/);
  if(m) {
    this.emitter.label(this.apply_namespace(m[1]));
  } else {
    var n = this.parse_number(word);
    if(n != null) {
      if(quote_numbers) {
        this.emitter.uint32('literal');
      }

      this.emitter.uint32(n);
    } else {
      this.emitter.uint32(this.lookup(this.apply_namespace(word)));
    }
  }
}

Forth.prototype.unslash = function(str)
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

Forth.prototype.dictionary_add = function(name, code, data, doc, args)
{
  var op = name;
  if(this.indexed_ops) {
    if(this.dictionary[name]) {
      op = this.dictionary[name].op;
    } else {
      op = this.next_index++;
    }
  }

  var entry = {
    code: code,
    data: data,
    doc: doc,
    args: args,
    op: op,
    next: this.last_dictionary,
    prior: this.dictionary[name] // keep old definitions
  };
  
  this.last_dictionary = name;
  this.dictionary[name] = entry;

  return entry;
}

Forth.prototype.dictionary_variable = function(name)
{
  this.data_segment_offset += this.cell_size;
  var e = this.dictionary_add(name, 'variable-peeker-code', this.data_segment_offset);
  e.segment = 'data';
  return e;
}

var genlabel_counter = util.counter();

Forth.prototype.genlabel = function(prefix)
{
  if(prefix == null) prefix = 'gen';
  var n = genlabel_counter();
  return `${prefix}-${n}`;
}

function colon_def(token, code)
{
  var tok = this.next_token(code);
  var name = this.apply_namespace(tok[0]);

  this.dictionary_add(name, 'call-data-seq-code', name + '-entry-data');

  this.emitter.
      label(name + '-entry-data').
      uint32(name + '-end', true, (v) => v / this.cell_size - 1).
      label(name + '-ops');
  
  return tok[1];
}

Forth.prototype.literal_immediate = function(token, code)
{
  var tok = this.next_token(code);
  var label = this.genlabel('data');
  this.strings[label] = tok[0];
  this.interp(`literal ${label}`);
  return tok[1];
}

Forth.macros = {
  "namespace:": function(token, code) {
    var tok = this.next_token(code);
    this.stack.push(this.word_prefix);
    this.word_prefix = tok[0];
    return tok[1];
  },
  "end-namespace": function(token, code) {
    this.word_prefix = this.stack.pop();
  },
  ":": colon_def,
  "::": colon_def,
  ";": function(token, code) {
    var name = this.last_dictionary;
    this.dictionary[name].data = name + '-entry-data';

    this.interp('return0');
    this.emitter.label(name + '-end').
        label(name + '-size', (this.emitter.resolve(name + '-end') - this.emitter.resolve(name + '-ops')) / this.cell_size).
        uint32(TERMINATOR);
  },
  alias: function(token, code) {
    // alias NAME AS
    // Adds a dictionary entry named NAME that is a copy of AS.
    var tok = this.next_token(code);
    var name = tok[0];
    tok = this.next_token(tok[1]);
    var entry = this.dictionary[tok[0]];
    
    this.dictionary_add(name, entry.code, entry.data, entry.doc, entry.args);

    return tok[1];
  },    
  constant: function(token, code) {
    // constant NAME NUMBER-VALUE
    // Adds a dictionary entry with the name and value.
    var tok = this.next_token(code);
    var name = tok[0];
    tok = this.next_token(tok[1]);
    var value = this.parse_number(tok[0]);

    this.dictionary_add(name, 'value-peeker-code', value);

    return tok[1];
  },    
  "global-var": function(token, code) {
    // variable NAME
    // Adds a dictionary entry with the name and space in the data segment
    var tok = this.next_token(code);
    var name = tok[0];

    this.dictionary_variable(name);

    return tok[1];
  },    
  longify: function(token, code) {
    var tok = this.next_token(code);
    var v = this.unslash(tok[0]);
    var l = Forth.longify(v);
    this.interp(`uint32 ${l}`);
    return tok[1];
  },
  'longify"': function(token, code) {
    var m = code.indexOf('"');
    if(m >= 0) {
      var tok = code.slice(1, m + 1);
      var l = Forth.longify(this.unslash(tok[0]));
      this.interp(`uint32 ${l}`);
      return tok[1];
    } else {
      throw "parse error";
    }
  },
  "char-code": function(token, code) {
    var tok = this.next_token(code);
    var v = this.unslash(tok[0]);
    var n = v.codePointAt(0);
    this.emitter.uint32(n);
    return tok[1];
  },
  immediate: function(token, code) {
    var name = this.last_dictionary;
    this.immediates[name] = this.dictionary[name];
  },
  "immediate-as": function(token, code) {
    var name = this.last_dictionary;
    var tok = this.next_token(code);
    var im_name = tok[0]
    this.immediates[im_name] = this.dictionary[name];
    return tok[1];
  },
  "immediate-only": function(token, code) {
    var name = this.last_dictionary;
    this.immediates[name] = this.dictionary[name];
    this.immediates[name].only = true;
    this.dictionary[name] = null;
  },
  IF: function(token, code) {
    var jump_label = this.genlabel('if-' + this.last_dictionary);
    this.stack.push(jump_label);
    this.interp(`literal ::${jump_label} unlessjump`);  },
  UNLESS: function(token, code) {
    var jump_label = this.genlabel('unless-' + this.last_dictionary);
    this.stack.push(jump_label);
    this.interp(`literal ::${jump_label} ifthenjump`);
  },
  ELSE: function(token, code) {
    var if_label = this.stack.pop();
    var then_label = this.genlabel('else-' + this.last_dictionary);
    this.stack.push(then_label);
    this.interp(`literal ::${then_label} jump`);
    this.emitter.label(if_label);
  },
  THEN: function(token, code) {
    // fix the IF to jump here
    var label = this.stack.pop();
    this.emitter.label(label);
  },
  RECURSE: function(token, code) {
    this.interp(`literal ${this.last_dictionary} jump-entry-data`);
  },
  'code-pointer': function(token, code) {
    this.interp('pointer');
  },
  "DOTIMES[": function(token, code) {
    var start_label = this.genlabel('dotimes');
    var finish_label = this.genlabel('dotimes');
    this.stack.push(start_label);
    this.stack.push(finish_label);
    this.interp(`int32 0 code-pointer ${finish_label} begin`);
    this.emitter.label(start_label);
    this.interp(`arg0 arg1 < int32 ${this.cell_size} ifthenreljump return-locals`);
  },
  "]DOTIMES": function(token, code) {
    var finish_label = this.stack.pop();
    var start_label = this.stack.pop();
    this.interp('arg0 int32 1 int-add set-arg0');
    this.interp('int32');
    this.emitter.uint32(start_label, true, (p) => p - this.cell_size * 2);
    this.interp('jumprel');
    this.emitter.label(finish_label);
  },  
  POSTPONE: function(token, code) {
    var tok = this.next_token(code);
    this.emitter.uint32(this.lookup(tok[0]));
    return tok[1];
  },
  "POSTPONE'": function(token, code) {
    var tok = this.next_token(code);
    this.interp('literal literal');
    this.emitter.uint32(this.lookup(tok[0]));
    return tok[1];
  },
  '"': function(token, code) {
    var m = code.indexOf('"');
    if(m >= 0) {
      var label = this.genlabel('data');
      this.strings[label] = code.slice(1, m);
      this.interp(`string ${label}`);
      return code.slice(m + 1);
    } else {
      return "parse error: unterminated string";
    }
  },
  lit: function(token, code) {
    var tok = this.next_token(code);
    var label = this.genlabel('data');
    this.strings[label] = tok[0];
    this.interp(`string ${label}`);
    return tok[1];
  },
  "'": function(token, code) {
    var tok = this.next_token(code);
    this.interp('literal');
    this.emitter.uint32(this.lookup(tok[0]));
    return tok[1];
  },
  "i'": function(token, code) {
    var tok = this.next_token(code);
    this.interp(`literal immed-${tok[0]}`);
    return tok[1];
  },
  "(": function(token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      return code.slice(m + 1);
    } else {
      throw "parse error";
    }
  },
  'doc(': function(token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      var label = this.genlabel('doc');
      this.strings[label] = code.slice(1, m);
      this.dictionary[this.last_dictionary].doc = label;
      return code.slice(m + 1);
    } else {
      return "parse error: unterminated doc comment";
    }
  },
  'args(': function(token, code) {
    var m = code.indexOf(')');
    if(m >= 0) {
      var label = this.genlabel('args');
      this.strings[label] = code.slice(1, m);
      this.dictionary[this.last_dictionary].args = label;
      return code.slice(m + 1);
    } else {
      return "parse error: unterminated doc comment";
    }
  }
};

Forth.prototype.execute = function(token, code)
{
  var func = Forth.macros[token];
  if(func) {
    return func.apply(this, [token, code]);
  } else if(token) {
    this.compile(token);
  }
}

Forth.prototype.interp = function(str)
{
  var s = str;
    
  try {
    for(s = str; s.length > 0;) {
      var t = this.next_token(s);
      if(t == false) break;
      
      s = t[1];
      var r = this.execute(t[0], s);
      if(r != null) s = r;
    }
    
    return this;
  } catch(e) {
    console.error("Caught " + e);
    if(s) console.error("processing: " + s.substr(0, 32) + "...");
    throw(e);
  }
}

Forth.prototype.eval = function(str) {
  var asm = this.emitter;
  var f = new Function('platform', 'asm', 'require', 'TERMINATOR', str);
  return f.apply(this, [ this.platform, this.emitter, require, TERMINATOR ]);
}

Forth.prototype.defop = function(name, fn, doc, args) {
  var entry = this.dictionary_add(name, name + "-code", null);
  if(doc) {
    this.strings[name + '-doc'] = doc;
    entry.doc = name + '-doc';
  }
  if(args) {
    this.strings[name + '-args'] = args;
    entry.args = name + '-args';
  }
  return fn(this.emitter.label(name + "-code"));
}

Forth.prototype.defalias = function(name, calls) {
  var entry = this.dictionary[calls];
  this.dictionary_add(name, entry.code, entry.data);
}

Forth.prototype.constant = function(name, value)
{
  if(typeof(value) == 'string') {
    var label = name + '-str';
    this.strings[label] = value;
    value = label;
    this.dictionary_add(name, 'data-peeker-code', value);
  } else {
    this.dictionary_add(name, 'value-peeker-code', value);
  }
}

Forth.prototype.add_source = function(path, data, binary)
{
  if(!binary) {
    data = this.cellpad(data);
  }
  var label = 'sources-' + path + '-src';
  this.sources[label] = data;
  this.dictionary_add(path, 'data-peeker-code', label);
}

Forth.prototype.raw_dict_entry = function(label, name, code, data, last_label, doc, args) {
  if(this.cell_size == 4) {
    this.emitter.label(label).
        uint32(name).
        uint32(code).
        uint32(data).
        uint32(doc || 0).
        uint32(args || 0).
        uint32(last_label);
  } else if(this.cell_size == 8) {
    this.emitter.label(label).
        uint32(name).
        uint32(0).
        uint32(code).
        uint32(0).
        uint32(data).
        uint32(0).
        uint32(doc || 0).
        uint32(0).
        uint32(args || 0).
        uint32(0).
        uint32(last_label).
        uint32(0);
  } else {
    throw 'cell-size must be 4 to 8';
  }
  return label;
}

Forth.prototype.write_dict_entry = function(n, entry, last_label, prefix)
{
  if(entry == null) return last_label;
  if(prefix == null || entry.only == true) prefix = '';
  var data = entry.data;
  if(entry.data == null) data = 0;
  if(entry.segment == 'data') data += this.platform.data_segment;
  return this.raw_dict_entry(prefix + n, n + '-sym', entry.code, data, last_label, entry.doc, entry.args);
}

Forth.prototype.emit_sources = function() {
  this.emitter.label('sources').uint32('sources-end', true);
  for(var n in this.sources) {
    var data = this.sources[n];
    this.emitter.label(n).bytes(data);
  }
  this.emitter.label('sources-end');
}

Forth.prototype.emit_strings = function() {
  this.emitter.label('symbols-begin');
  
  for(var n in this.strings) {
    this.emitter.label(n).bytes(this.cellpad(this.unslash(this.strings[n])));
  }

  for(var n in this.dictionary) {
    if(this.dictionary[n] == null) continue;
    this.emitter.label(n + '-sym').bytes(this.cellpad(n));
  }
  for(var n in this.immediates) {
    if(this.immediates[n] == null) continue;
    try {
      this.emitter.resolve(n + '-sym');
    } catch(e) {
      this.emitter.label(n + '-sym').bytes(this.cellpad(n));
    }
  }

  this.emitter.label('symbols-end');
  this.emitter.label('symbols-size').uint32(this.emitter.resolve('symbols-end') - this.emitter.resolve('symbols-begin'));
}

Forth.prototype.emit_dictionary = function(label, dict, prefix) {
  this.emitter.label(label + '-begin');

  function sort(arr, key)
  {
    return arr.slice(0).sort(function(a, b) {
      if(a[1] && b[1])
        return a[1][key] - b[1][key];
      else if(!b[1]) return -1;
      else if(!a[1]) return 1;
    });
  }

  var last_label = TERMINATOR;
  for(var n of sort(Object.entries(dict), 'op')) {
    last_label = this.write_dict_entry(n[0], n[1], last_label, prefix);
  }
  //for(var n in this.dictionary) {
  //   last_label = write_dict_entry(n, this.dictionary[n], last_label);
  // }

  this.emitter.label(label + '-end');
  this.emitter.label(label, this.emitter.resolve(last_label));
  this.emitter.label(label + '-size', this.emitter.resolve(label + '-end') - this.emitter.resolve(label + '-begin'));
}

Forth.prototype.compile_files = function(paths, min_stage) {
  for(var input of paths) {
    var data = fs.readFileSync(input, 'utf-8');
    var pm = input.match(/([.].+)?$/);
    var ext = pm && pm[1];
    console.log("Src:", input, data.length, ext);
    if(ext == '.js') {
      this.eval(data);
    } else if(ext == '.4th') {
      this.interp(data);
      if(!min_stage) this.add_source(input, data);
    } else {
      throw "Unknown file type: " + input;
    }
  }
}

Forth.prototype.assemble = function(stage, opts) {
  this.constant("version-string", fs.readFileSync(__dirname + '/version.txt', 'utf-8').trim());
  this.constant("stage-string", stage);
  this.constant("platform-string", this.platform.name);
  this.constant("cell-size", this.cell_size);

  // Load the sources

  function min_stage() {
    return (stage.indexOf('min') >= 0);
  }

  this.compile_files(opts.sources, min_stage());

  for(var path of opts.texts) {
    console.log("Text: " + path);
    this.add_source(path, fs.readFileSync(path, 'utf-8'));
  }
  
  for(var path of opts.binaries) {
    console.log("Binary: " + path);
    this.add_source(path, fs.readFileSync(path, 'ASCII'), true);
  }

  this.emitter.label("builtin-data-size", this.data_segment_offset);

  this.emitter.label('*program-size*');

  this.emit_strings();
  this.emit_dictionary('builtin-dictionary', this.dictionary);
  this.emit_dictionary('immediate-dictionary', this.immediates, 'immed-');
  this.emit_sources();

  this.emitter.label('*binary-size*');
  
  return this;
}

Forth.prototype.finish = function()
{
  return this.emitter.assemble();
}

if(typeof(module) != 'undefined') {
  module.exports = Forth;
}

if(typeof(window) != 'undefined') {
  window.Forth = Forth;
}
