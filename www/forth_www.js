require('vm.js');
const DataStruct = require('data_struct.js');
const Assembler = require('assembler.js');
const glyphs = require('glyphs.js');
const util = require('util.js');
const GFX = require('vm/devices/gfx.js');
const Keyboard = require('vm/devices/keyboard.js');
const Timer = require('vm/devices/timer.js');
const Runner = require('vm/runners/www.js');
const Bacaw = require("bacaw.js");
const Forth = require("forth");

var program_code, program_labels;

function code()
{
  if(program_code == null) init();
  return program_code;
}

function init()
{
  program_code = Forth.assemble(1024*1024, 0);
  return program_code;
}

if(typeof(module) != 'undefined') {
	module.exports = {
    code: code,
    init: init
  };
}
if(typeof(window) != 'undefined') {
	window.forth_init = init;
  window.forth_code = code;
}
