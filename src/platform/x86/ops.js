const fs = require('fs');
const NORTH_X86_HEADER = 'x86/build/posix-64/include/north/posix-64/opcodes.h';
const opcodes_h = fs.readFileSync(NORTH_X86_HEADER, 'utf-8');
const builtins = {};

for(var line of opcodes_h.split("\n")) {
  var m = line.match(/((\w+)\s+equ\s+(\w+)\s+;*\s*"?(.+)"?)/)
  if(m) {
    var name = m[4].replace(/_/g, '-');
    var code = parseInt(m[3], 10);
    builtins[m[2]] = m[3];
    this.emitter.label('op-' + name, code);
    this.dictionary_add(name, -1, code);
  } else if(line.length > 0) {
    console.warn("Bad op code in header: " + line);
  }
}
