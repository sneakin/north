require('vm');
const Terminal = require('vm/devices/terminal');
const DevCon = require('vm/devices/console.js');
const RAM = require('vm/devices/ram.js');
const Timer = require('vm/devices/timer.js');
const RTC = require('vm/devices/rtc.js');

const FS = require('fs');

const North = {
  "stage0": FS.readFileSync(__dirname + '/../build/north-stage0.bin')
};

function runner_init(mem_size, terminal, buttons)
{
  console.log("Initializing...");

  var run = document.getElementById(buttons.run);
  var reset = document.getElementById(buttons.reset);
  var reload = document.getElementById(buttons.reload);
  
  var term = new Terminal(document.getElementById(terminal), {
    fontFamily: '"Unscii 8", Inconsolata, Unifont, "GNU Unifont", courier-new, courier, monospace',
    fontSize: 16,
    scrollBar: false
  });

  var vm = vm_init(mem_size, term, {
    run: function(vm) {
      run.value = 'Stop';
    },
    stopped: function(vm) {
      run.value = 'Run';
    }
  });

  run.onclick = function() {
    if(vm.running) {
      vm.stop();
    } else {
      vm.run();
    }
  }

  reset.onclick = function() {
    term.clear();
    vm.reset();
  }

  reload.onclick = function() {
    vm.mmu.memwrite(0, North.stage0);
  }
}

function vm_init(mem_size, terminal, callbacks)
{
  var vm = new VM.Container(callbacks);
  if(typeof(window) != 'undefined') window.vm = vm;
  
  var mmu = new VM.MMU();
  //var rom = new ROM(North.stage0);
  //mmu.map_memory(0, rom.length, rom);
  //mmu.map_memory(1024*1024, mem_size, new RAM(mem_size));
  mmu.map_memory(0, mem_size, new RAM(mem_size));
  mmu.memwrite(0, North.stage0);
  vm.add_device(mmu);
  
	var cpu = new VM.CPU(mmu, mem_size);
  vm.add_device(cpu);
  
  var devcon = new DevCon();
  var devcon_addr = 0xF0001000;
  mmu.map_memory(devcon_addr, devcon.ram_size(), devcon);
  vm.add_device(devcon);
  
  var timer_addr = 0xF0002000;
  var timer_irq = VM.CPU.INTERRUPTS.user + 2;
  var timer = new Timer(vm, timer_irq, 1<<20);
  mmu.map_memory(timer_addr, timer.ram_size(), timer);
  vm.add_device(timer);
  
  var rtc_addr = 0xF0006000;
  var rtc = new RTC();
  mmu.map_memory(rtc_addr, rtc.ram_size(), rtc);
  vm.add_device(rtc);

  var input_irq = VM.CPU.INTERRUPTS.user + 4;
  var input_addr = 0xF0004000;
  var input_term = terminal.get_input_device(1024, vm, input_irq);
  vm.mmu.map_memory(input_addr, input_term.ram_size(), input_term);
  vm.add_device(input_term);

  var output_irq = VM.CPU.INTERRUPTS.user + 3;
  var output_addr = 0xF0003000;
  var output_term = terminal.get_output_device(1024, vm, output_irq);
  vm.mmu.map_memory(output_addr, output_term.ram_size(), output_term);
  vm.add_device(output_term);

  vm.info = {
    devcon: {
      addr: devcon_addr
    },
    timer: {
      addr: timer_addr,
      irq: timer_irq
    },
    rtc: {
      addr: rtc_addr
    },
    input: {
      addr: input_addr, irq: input_irq
    },
    output: {
      addr: output_addr, irq: output_irq
    }
  };

  return vm;
}

if(typeof(module) != 'undefined') {
  module.exports = runner_init;
}

if(typeof(window) != 'undefined') {
	window.runner_init = runner_init;
}
