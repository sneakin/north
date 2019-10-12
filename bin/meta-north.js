// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

const Commander = require('commander');
const Forth = require('forth');
const fs = require('fs');

var program = new Commander.Command();
program.option('-p, --platform <name>', 'Platform to target', 'bacaw')
    .option('-m, --machine <name>', 'Specific machine to target', 'north-runner')
    .option('-s, --stage <stage>', 'The build stage', 'stage0')
    .option('-o, --output <path>', 'Path to write output to')
    .option('--data-segment <addr>', 'Offset for the data segment', (v, p) => parseInt(v), 1024*1024)
    .option('--code-segment <addr>', 'Offset for the code segment', (v, p) => parseInt(v), 0)
    .option('--binary-file <path>', 'Include a file in the output without processing.', (v, prev) => prev.concat([v]), [])
    .option('--text-file <path>', 'Include a file in the output with minimal processing.', (v, prev) => prev.concat([v]), [])
    .option('--debug-args', 'Print the parsed arguments andbexit.')
    .option('--debug-output', 'Print an intermediate output.')
    .option('-v, --verbose', 'Log more');

program.parse(process.argv);

if(program.debugArgs) {
  console.info("Argv", process.argv, program.args, program, program.binary);
  process.exit();
}

//var platform = require(options.platform);
//var argv = platform.parse_options(process.argv);

var Platform = require('platform/' + program.platform);
var platform = new Platform(program.machine, program.dataSegment, 0);
var compiler = new Forth(platform);

if(program.debugOutput) {
  var asm = compiler.assemble(program.stage, {
    sources: program.args,
    binaries: program.binaryFile,
    texts: program.textFile
  });
  var bin = platform.assembler.dbg_assemble();
  process.stdout.write(JSON.stringify(bin, null, 2));
} else {
  var bin = compiler.assemble(program.stage, {
    sources: program.args,
    binaries: program.binaryFile,
    texts: program.textFile
  }).finish();
  var buf = Buffer.from(bin.buffer);

  if(program.output != null && program.output != '-') {
    fs.writeFile(program.output, buf, (err) => {
      if(err) throw err;
    });
  } else {
    process.stdout.write(buf);
  }
}