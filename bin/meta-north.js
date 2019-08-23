// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

const Assembler = require('assembler');
const Forth = require('forth');

var data_segment = 1024*1024;

//var info = VM.default_info();
var info = {
  "gfx":{"width":640,"height":480,"mem_size":16384,"addr":0xF0010000,"swap_addr":4026613756,"irq":25},
  "keyboard":{"addr":0xF0005000,"irq":14},
  "console":{"addr":0xF0001000},
  "timer":{"addr":0xF0002000,"irq":11},
  "rtc":{"addr":0xF0006000},
  "input":{"addr":0xF0004000,"irq":13},
  "output":{"addr":0xF0003000,"irq":12}
};

var stage = process.argv[2] || 'stage0';
var asm = new Assembler();
var bin = Forth.assemble(data_segment, 0, info, stage, asm);
var buf = new Buffer(bin.buffer);
process.stdout.write(buf);
