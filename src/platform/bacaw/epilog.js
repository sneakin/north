// trampolines for direct assembly calls
for(var n in this.dictionary) {
  var entry = this.dictionary[n];
  if(entry == null) continue;
  if(entry.code == 'call-data-seq-code' && entry.data != null) {
    this.emitter.label(n + "-code").
        load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.CS).uint32(n + '-entry-data').
        load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('call-data-seq-code');
  }
}
