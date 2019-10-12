const Opper = require('platform/x86/opper');
const util = require('more_util');

const Machines = {
  "i32": {
    name: 'x86-i32',
    bits: 32,
    cell_size: 4,
    op_size: 4
  },
  "i64": {
    name: 'x86-i64',
    bits: 64,
    cell_size: 8,
    op_size: 4
  }
};

class Platform
{
  constructor(machine, ds, cs) {
    this.machine = Machines[machine] || Machines['i32'];
    this.name = this.machine.name;
    this.bits = this.machine.bits;
    this.cell_size = this.machine.cell_size;
    this.data_segment = ds == null ? 0 : ds;
    this.code_segment = cs == null ? 0 : cs;
    this.assembler = new Opper();
  }

}

module.exports = Platform;
