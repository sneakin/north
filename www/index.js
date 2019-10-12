"use strict";

require('vm');
const Terminal = require('vm/devices/terminal');
const DevCon = require('vm/devices/console.js');
const RAM = require('vm/devices/ram.js');
const Timer = require('vm/devices/timer.js');
const RTC = require('vm/devices/rtc.js');
const Sound = require("vm/devices/sound.js");
const KeyStore = require('vm/devices/keystore.js');
const KeyValue = require('key_value');
const VMWorker = require('vm/service_worker');

const FS = require('fs');

const Binaries = {};
const BinaryURLs = require('binaries.json');
const DefaultStage = 'north-stage2-bacaw.bin';

function basename(path)
{
  var parts = path.split('/');
  return parts[parts.length - 1];
}

function index_init(mem_size, terminal, buttons)
{
  console.log("Initializing...");

  var run = document.getElementById(buttons.run);
  var reset = document.getElementById(buttons.reset);
  var reload = document.getElementById(buttons.reload);
  var stage_selector = document.getElementById(buttons.stage_selector);

  var worker = null;

  VMWorker.register('service_worker.js', window.location).then((reg) => {
    worker = reg;
    console.log("ServiceWorker register", reg);
  }).catch((error) => {
    console.log("ServiceWorker failed to register", error);
  });

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
    var stage = Binaries[stage_selector.value];
    if(stage == null) stage = Binaries[DefaultStage];
    vm.mem.memwrite(0, stage);
  }

  stage_selector.onchange = function() {
    vm.mem.memwrite(0, Binaries[stage_selector.value]);
  }
  
  for(var url of BinaryURLs) {
    global.fetch(url).then((resp) => {
      if(resp.ok) {
        resp.arrayBuffer().then((body) => {
          var name = basename((new URL(resp.url)).pathname);
          var el = document.createElement('option');
		      el.value = name;
		      el.innerText = name;
		      stage_selector.appendChild(el);

          Binaries[name] = new Uint8Array(body);
          if(name == DefaultStage) {
	          stage_selector.value = name;
            vm.mem.memwrite(0, Binaries[name]);
          }
        });
      }
    });
  }
}

function vm_init(mem_size, terminal, callbacks)
{
  var vm = new VM.Container(callbacks);
  if(typeof(window) != 'undefined') window.vm = vm;
  
  var mem = new VM.MemoryBus();
  //var rom = new ROM(Binaries.stage0);
  //mem.map_memory(0, rom.length, rom);
  //mem.map_memory(1024*1024, mem_size, new RAM(mem_size));
  mem.map_memory(0, mem_size, new RAM(mem_size));
  vm.add_device(mem);
  
  var cpu = new VM.CPU(mem, mem_size);
  vm.add_device(cpu);
  
  var devcon = new DevCon();
  var devcon_addr = 0xF0001000;
  mem.map_memory(devcon_addr, devcon.ram_size(), devcon);
  vm.add_device(devcon);
  
  var timer_addr = 0xF0002000;
  var timer_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 2);
  var timer = new Timer(timer_irq, 1<<20);
  mem.map_memory(timer_addr, timer.ram_size(), timer);
  vm.add_device(timer);
  
  var rtc_addr = 0xF0006000;
  var rtc = new RTC();
  mem.map_memory(rtc_addr, rtc.ram_size(), rtc);
  vm.add_device(rtc);

  var local_store = new KeyValue.Storage(localStorage);
  var local_storage_addr = 0xF0007000;
  var local_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 6);
  var local_storage = new KeyStore(local_store, mem, local_storage_irq, 'LocalStorage');
  vm.mem.map_memory(local_storage_addr, local_storage.ram_size(), local_storage);
  vm.add_device(local_storage);

  var session_store = new KeyValue.Storage(sessionStorage);
  var session_storage_addr = 0xF0008000;
  var session_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 7);
  var session_storage = new KeyStore(session_store, mem, session_storage_irq, 'SessionStorage');
  vm.mem.map_memory(session_storage_addr, session_storage.ram_size(), session_storage);
  vm.add_device(session_storage);

  var db_store = new KeyValue.IDB('bacaw', (state) => { console.log('IDBStore', state); });
  var db_storage_addr = 0xF0009000;
  var db_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 8);
  var db_storage = new KeyStore(db_store, mem, db_storage_irq, 'IndexedDB Storage');
  vm.mem.map_memory(db_storage_addr, db_storage.ram_size(), db_storage);
  vm.add_device(db_storage);

  var ipfs_store = new KeyValue.IPFS(global.IPFS);
  var ipfs_storage_addr = 0xF000A000;
  var ipfs_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 9);
  var ipfs_storage = new KeyStore(ipfs_store, mem, ipfs_storage_irq, 'IPFS Storage');
  vm.mem.map_memory(ipfs_storage_addr, ipfs_storage.ram_size(), ipfs_storage);
  vm.add_device(ipfs_storage);

  var http_store = new KeyValue.HTTP(global.fetch);
  var http_storage_addr = 0xF000B000;
  var http_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 10);
  var http_storage = new KeyStore(http_store, mem, http_storage_irq, "HTTP Storage");
  vm.mem.map_memory(http_storage_addr, http_storage.ram_size(), http_storage);
  vm.add_device(http_storage);
  
  var table_store = new KeyValue.Table();
  var table_storage_addr = 0xF000C000;
  var table_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 11);
  var table_storage = new KeyStore(table_store, mem, table_storage_irq, "Table Storage");
  vm.mem.map_memory(table_storage_addr, table_storage.ram_size(), table_storage);
  vm.add_device(table_storage);
  
  var input_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 4);
  var input_addr = 0xF0004000;
  var input_term = terminal.get_input_device(1024, input_irq);
  vm.mem.map_memory(input_addr, input_term.ram_size(), input_term);
  vm.add_device(input_term);

  var output_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 3);
  var output_addr = 0xF0003000;
  var output_term = terminal.get_output_device(1024, output_irq);
  vm.mem.map_memory(output_addr, output_term.ram_size(), output_term);
  vm.add_device(output_term);

  var sound_addr = 0xF000D000;
  var sound_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 12);
  var sound = new Sound(32, mem, sound_irq, "Sound");
  vm.mem.map_memory(sound_addr, sound.ram_size(), sound);
  vm.add_device(sound);

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
    },
    sound: {
      addr: sound_addr,
      irq: sound_irq.toInt()
    }
  };

  return vm;
}

if(typeof(module) != 'undefined') {
  module.exports = index_init;
}

if(typeof(window) != 'undefined') {
  window.index_init = index_init;
}
