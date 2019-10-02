const Opper = require('platform/x86/opper');
const util = require('more_util');

class Platform
{
  constructor(machine, ds, cs) {
    this.name = 'x86';
    this.data_segment = ds | 1024*1024;
    this.code_segment = cs | 0;
    this.assembler = new Opper();
  }

}

module.exports = Platform;
