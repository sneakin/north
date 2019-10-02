// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

const Assembler = require('assembler.js');
const asm_memcpy = require('vm/asm/memcpy');
const asm_input = require('vm/asm/input-device');
const asm_output = require('vm/asm/output-device');
const asm_isr = require('vm/asm/isr');

var DS_SIZE = 1024*2;
var HEAP_REG = VM.CPU.REGISTERS.DS - 1;
var EVAL_IP_REG = HEAP_REG - 1;
var DICT_REG = HEAP_REG - 4;
var FP_REG = HEAP_REG - 5;

asm_isr(asm, VM.CPU.INTERRUPTS.user * 3);
asm_memcpy(asm);
asm_input(asm, platform.machine.input.irq, platform.machine.input.addr);
asm_output(asm, platform.machine.output.irq, platform.machine.output.addr);

asm.label('isr_reset').
    call(0, VM.CPU.REGISTERS.CS).uint32('data_init').
    call(0, VM.CPU.REGISTERS.CS).uint32('output_init').
    call(0, VM.CPU.REGISTERS.CS).uint32('input_init').
    sie().
    call(0, VM.CPU.REGISTERS.CS).uint32('eval-init').
    mov(VM.CPU.REGISTERS.R0, VM.CPU.REGISTERS.CS).
    inc(VM.CPU.REGISTERS.R0).uint32('boot').
    push(VM.CPU.REGISTERS.R0).
    call(0, VM.CPU.REGISTERS.CS).uint32('outer-start-thread').
    call(0, VM.CPU.REGISTERS.CS).uint32('goodbye').
    load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('isr_reset');

asm.label('goodbye').
    load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(BYE).
    call(0, VM.CPU.REGISTERS.CS).uint32('output_write_word').
    ret();

var offset = data_segment_offset;
asm.label('input_data_position', offset).
    label('output_data_position', offset + CELL_SIZE * 1).
    label('waiting_for_input', offset + CELL_SIZE * 2).
    label('waiting_for_output', offset + CELL_SIZE * 3).
    label('heap_top', offset + CELL_SIZE * 4).
    label('stack_top', offset + CELL_SIZE * 5).
    label('data_segment_end', offset + CELL_SIZE * 6);
data_segment_offset = CELL_SIZE + asm.resolve('data_segment_end');

asm.label('data_init').
    load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
    load(VM.CPU.REGISTERS.R1, 0, VM.CPU.REGISTERS.INS).uint32(0).
    load(VM.CPU.REGISTERS.R2, 0, VM.CPU.REGISTERS.INS).uint32(0).
    load(VM.CPU.REGISTERS.DS, 0, VM.CPU.REGISTERS.INS).uint32(ds).
    load(VM.CPU.REGISTERS.CS, 0, VM.CPU.REGISTERS.INS).uint32(cs).
    mov(HEAP_REG, VM.CPU.REGISTERS.DS).
    inc(HEAP_REG).uint32(DS_SIZE).
    store(HEAP_REG, 0, VM.CPU.REGISTERS.DS).uint32('heap_top').
    pop(VM.CPU.REGISTERS.R0). // get return
    store(VM.CPU.REGISTERS.SP, 0, VM.CPU.REGISTERS.DS).uint32('stack_top').
    mov(VM.CPU.REGISTERS.IP, VM.CPU.REGISTERS.R0); // return

asm.label('eval-init').
    load(DICT_REG, 0, VM.CPU.REGISTERS.INS).uint32(TERMINATOR).
    // zero frame's link
    load(VM.CPU.REGISTERS.R0, 0, VM.CPU.REGISTERS.INS).uint32(0).
    pop(VM.CPU.REGISTERS.R1).
    push(VM.CPU.REGISTERS.R0).
    mov(FP_REG, VM.CPU.REGISTERS.SP).
    push(VM.CPU.REGISTERS.R1).
    ret();

asm.label('outer-start-thread').
    // swap return addr and EIP
    // and make a frame before pushing them back
    pop(VM.CPU.REGISTERS.R0). // return addr
    pop(VM.CPU.REGISTERS.R1). // eip to exec
    push(VM.CPU.REGISTERS.R0).
    push(VM.CPU.REGISTERS.R1).
    load(FP_REG, 0, VM.CPU.REGISTERS.INS).uint32(0).
    load(VM.CPU.REGISTERS.IP, 0, VM.CPU.REGISTERS.INS).uint32('exec-code');
