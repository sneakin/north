require 'pathname'
require 'shellwords'
require 'rbconfig'

root = Pathname.new(__FILE__).parent.expand_path
buildroot ||= ENV.fetch('BUILDROOT', root.join('build'))

$: << root.parent.join('lib')
require 'tasks'

BCPATH = root.join('..', 'bacaw', 'js', 'lib')
NODE_PATH << [ root.join('src'), BCPATH ]

outputs = [ 'north-stage0.bin',
            #'north-stage1.bin',
            'runner.css',
            'runner.js',
            'runner.html'
          ].collect { |s| buildroot.join(s) }

directory buildroot

STAGE0_SRC = [ 'forth.js',
               'forth_core.4th',
               'forth_extra.4th',
               'forth_assembler.4th',
               'forth_ops.4th'
             ].collect { |s| root.join('src', s) }
STAGE0_TARGET = buildroot.join('north-stage0.bin')

file STAGE0_TARGET => [ buildroot, *STAGE0_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} > #{t.name}")
end

STAGE1_SRC = [ 'build-stage1.4th',
               'forth_core.4th',
               'forth_extra.4th',
               'forth_assembler.4th',
               'forth_ops.4th'
             ].collect { |s| root.join('src', s) }
STAGE1_TARGET = buildroot.join('north-stage1.bin')

BCCON = "node ../bacaw/bin/bccon.js"

file STAGE1_TARGET => [ buildroot, *STAGE1_SRC ] do |t|
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

desc "Build stage0"
task :stage0 => STAGE0_TARGET

desc "Build stage1 using stage0"
task :stage1 => STAGE1_TARGET

desc 'Start a webserver on port 9090 to serve the build directory.'
task :serve do
	require 'webrick'
  $stderr.puts("Serving on #{buildroot}")
	s = WEBrick::HTTPServer.new(:Port => ENV.fetch('PORT', 9090), :DocumentRoot => buildroot)
	trap('INT') { s.shutdown }
	s.start
end
