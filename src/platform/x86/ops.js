const NORTH_X86_HEADER = 'x86/build/posix-64/include/north/posix-64/opcodes.h';
const opcodes_h = fs.readFileSync(NORTH_X86_HEADER, 'utf-8');
const builtins = {};

for(var line of opcodes_h.split("\n")) {
  var m = line.match(/((\w+)\s+equ\s+(\w+)\s+;*\s*"?(.+)"?)/)
  if(m) {
    builtins[m[2]] = m[3];
    dictionary_add(m[4].replace(/_/g, '-'), -1, parseInt(m[3]));
  } else if(line.length > 0) {
    console.warn("Bad op code in header: " + line);
  }
}
