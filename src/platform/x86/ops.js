const fs = require('fs');
var NORTH_X86_HEADER;
switch(platform.bits) {
case 32: NORTH_X86_HEADER = 'x86/build/posix-32/include/north/posix-32/opcodes.h';
  break;
case 64: NORTH_X86_HEADER = 'x86/build/posix-64/include/north/posix-64/opcodes.h';
  break;
default: throw "Unsupported bit size: " + platform.bits;
}
const opcodes_h = fs.readFileSync(NORTH_X86_HEADER, 'utf-8');
const namespace = 'op';
const builtins = {};

for(var line of opcodes_h.split("\n")) {
  var m = line.match(/((\w+)\s+equ\s+(\w+)\s+;*\s*"?(.+)"?)/)
  if(m) {
    var name = m[4].replace(/_/g, '-');
    var code = parseInt(m[3], 10);
    builtins[m[2]] = m[3];
    this.emitter.label(namespace + ':' + name, code);
    this.dictionary_add(name, -1, code);
  } else if(line.length > 0) {
    console.warn("Bad op code in header: " + line);
  }
}
