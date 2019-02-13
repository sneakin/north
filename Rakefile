require 'pathname'
require 'shellwords'
require 'rbconfig'

root = Pathname.new(__FILE__).parent.expand_path
buildroot ||= ENV.fetch('BUILDROOT', root.join('build'))

$: << root.parent.join('lib')
require 'tasks'

BCCON = "node ../bacaw/bin/bccon.js"
BCPATH = root.join('..', 'bacaw', 'js', 'lib')
NODE_PATH << [ root.join('src'), BCPATH ]

outputs = [ 'north-stage0.bin',
            'north-stage1.bin',
            #'north-stage1.bin',
            'runner.css',
            'runner.js',
            'runner.html'
          ].collect { |s| buildroot.join(s) }

directory buildroot

STAGE0_SRC = [ 'forth.js',
                '00_forth_core.4th',
                '00_forth_compiler.4th',
                '00_forth_ui.4th'
             ].collect { |s| root.join('src', s) }
STAGE0_TARGET = buildroot.join('north-stage0.bin')

file STAGE0_TARGET => [ buildroot, *STAGE0_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} stage0 > #{t.name}")
end

STAGE1_SRC = [ 'forth.js',
               '00_forth_core.4th',
               '00_forth_compiler.4th',
               '00_forth_output.4th',
               '00_forth_ui.4th',
               '01_forth_atoi.4th',
               '01_forth_tty.4th',
               '01_forth_dict.4th',
               '01_forth_seq.4th',
               '01_forth_ui.4th',
               '02_forth_memdump.4th',
               '02_forth_decompiler.4th',
               '02_forth_misc.4th',
               '02_forth_assembler.4th',
               'forth_extra.4th',
               '04_forth_core.4th',
               '04_forth_constants.4th',
               '02_forth_ops.4th'
             ].collect { |s| root.join('src', s) }
STAGE1_TARGET = buildroot.join('north-stage1.bin')

file STAGE1_TARGET => [ buildroot, *STAGE1_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} stage1 > #{t.name}")
end

STAGE2_SRC = [ 'build-stage2.4th',
               '02_forth_assembler.4th',
               '02_forth_ops.4th'
             ].collect { |s| root.join('src', s) }
STAGE2_TARGET = buildroot.join('north-stage2.bin')

file STAGE2_TARGET => [ buildroot, STAGE0_TARGET, *STAGE2_SRC ] do |t|
  sh("#{BCCON} #{STAGE0_TARGET} < src/build-stage1.4th > #{t.name}")
end

[ 'forth.css', 'runner.css' ].each do |name|
  output = buildroot.join(name)
  src = root.join('www', name)
  
  file output => [ src, buildroot, File.dirname(output) ] do |t|
    FileUtils.copy(t.sources[0], t.name)
  end
end

BrowserifyRunner.bundle buildroot.join('runner.js') => [ root.join('www/runner.js') ]
html_file buildroot.join('runner.html') => [ root.join('www/runner.src.html'), buildroot.join('runner.js'), STAGE0_TARGET, buildroot.join('xterm.css') ]

file buildroot.join('xterm.css') => root.join('node_modules', 'xterm', 'dist', 'xterm.css') do |t|
  FileUtils.copy(t.sources[0], t.name)
end

desc "Build all stages."
task :default => outputs

desc "Build stage0: meta compiled text evaluatior"
task :stage0 => STAGE0_TARGET

desc "Build stage1: most everything metacompiled"
task :stage1 => STAGE1_TARGET

desc "Build stage2: stage1 built with stage0"
task :stage2 => STAGE2_TARGET

desc "Build stage3: stage0 built with stage2"
task :stage3 do
  raise NotImplementedError
end

desc 'Start a webserver on port 9090 to serve the build directory.'
task :serve do
	require 'webrick'
  $stderr.puts("Serving on #{buildroot}")
	s = WEBrick::HTTPServer.new(:Port => ENV.fetch('PORT', 9090), :DocumentRoot => buildroot)
	trap('INT') { s.shutdown }
	s.start
end

namespace :doc do
  DOC_SRC_DIR = buildroot.join('doc', 'src')

  directory DOC_SRC_DIR
  
  desc "Turn the source into HTML."
  task :src => DOC_SRC_DIR do |t|
    STAGE1_SRC.each do |src|
      lang = 'forth'
      lang = 'javascript' if src.extname == '.js'
      sh("pygmentize -f html -O full -l #{lang} #{Shellwords.escape(src)} -o #{Shellwords.escape(DOC_SRC_DIR.join(src.basename))}")
    end
  end
end

