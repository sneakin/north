require('vm');
const Assembler = require('assembler');
const util = require('more_util');

const Machines = {
  'default': {
    input: {
      irq: 0xA,
      addr: 0xFFFF1000
    },
    output: {
      irq: 0xB,
      addr: 0xFFFF2000
    }
  },
  'north-runner': {
    "gfx":{"width":640,"height":480,"mem_size":16384,"addr":0xF0010000,"swap_addr":4026613756,"irq":25},
    "keyboard":{"addr":0xF0005000,"irq":14},
    "console":{"addr":0xF0001000},
    "timer":{"addr":0xF0002000,"irq":11},
    "rtc":{"addr":0xF0006000},
    "input":{"addr":0xF0004000,"irq":13},
    "output":{"addr":0xF0003000,"irq":12}
  }
};

class Platform
{
  registers = {
    heap: VM.CPU.REGISTERS.DS - 1,
    eval_ip: VM.CPU.REGISTERS.DS - 2,
    dict: VM.CPU.REGISTERS.DS - 5,
    fp: VM.CPU.REGISTERS.DS - 6,
  };

  constructor(machine, ds, cs) {
    this.name = 'bacaw';
    this.machine = util.merge_options(Machines.default, Machines[machine]);
    this.cell_size = 4;
    this.data_segment_size = 1024*2;
    this.data_segment = ds || 1024*1024;
    this.code_segment = cs || 0;
    this.assembler = new Assembler();
  }

}

module.exports = Platform;
