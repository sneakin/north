const Opper = require('platform/x86/opper');
const util = require('more_util');

class Platform
{
  constructor(machine, ds, cs) {
    this.name = 'x86';
    this.cell_size = 8;
    this.data_segment = ds == null ? 0 : ds;
  this.code_segment = cs == null ? 0 : cs;
    this.assembler = new Opper();
  }

}

module.exports = Platform;
