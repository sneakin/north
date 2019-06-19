require 'pathname'
require 'shellwords'
require 'rbconfig'

root = Pathname.new(__FILE__).parent.expand_path
buildroot ||= Pathname.new(ENV.fetch('BUILDROOT', root.join('build')))
release_root=Pathname.new(ENV.fetch('RELEASE_ROOT', root.join('tmp/gh-pages')))

$: << root.join('lib')
$: << root.join('vendor/rake-node/lib')
$:.unshift(root.join('vendor/webrick/lib'))
require 'rake/browserify'

BCROOT = Pathname.new(ENV.fetch('BACAW', root.join('vendor', 'bacaw')))
BCBIN = BCROOT.join('bin', 'bccon.js')
BCCON = "node #{Shellwords.escape(BCBIN)}"
BCLIB = BCROOT.join('js', 'lib')
NODE_PATH << [ root.join('src'), BCLIB ]

outputs = [ 'north-stage0.bin',
            'north-stage0-min.bin',
            'north-stage1.bin',
            'north-stage1-min.bin',
            #'north-stage2.bin',
            #'north-stage3.bin',
            'service_worker.js',
            'ipfs.js',
            'manifest.webmanifest',
      	    'unscii-8.ttf',
            'sounds/startup.mp3',
            'index.css',
            'index.js',
            'index.html'
          ].collect { |s| buildroot.join(s) }

directory buildroot

STAGE0_SRC = [ 'forth.js',
                '00/core.4th',
                '00/compiler.4th',
                '00/output.4th',
                '00/init.4th',
                '00/ui.4th'
             ].collect { |s| root.join('src', s) }
STAGE0_TARGET = buildroot.join('north-stage0.bin')

file STAGE0_TARGET => [ buildroot, *STAGE0_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} stage0 > #{t.name}")
end

STAGE0_MIN_TARGET = buildroot.join('north-stage0-min.bin')
file STAGE0_MIN_TARGET => [ buildroot, *STAGE0_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} stage0-min > #{t.name}")
end

desc "Build stage0: meta compiled text evaluatior"
task :stage0 => [ STAGE0_TARGET, STAGE0_MIN_TARGET ]

STAGE1_SRC = [ 'forth.js',
               *STAGE0_SRC,
               '01/atoi.4th',
               '01/tty.4th',
               '01/dict.4th',
               '01/seq.4th',
               '01/ui.4th',
               '02/memdump.4th',
               '02/decompiler.4th',
               '02/misc.4th',
               '02/assembler.4th',
               '03/assembler.4th',
               '03/byte_string.4th',
               '03/sequence.4th',
               'forth_interrupts.js',
               '03/interrupts.4th',
               '03/storage.4th',
               '03/storage_devices.4th',
               '03/storage_test.4th',
               '02/sound.4th',
               'forth_extra.4th',
               '04/core.4th',
               '04/constants.4th',
               '02/ops.4th'
             ].collect { |s| root.join('src', s) }
STAGE1_TARGET = buildroot.join('north-stage1.bin')

file STAGE1_TARGET => [ buildroot, *STAGE1_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} stage1 > #{t.name}")
end

STAGE1_MIN_TARGET = buildroot.join('north-stage1-min.bin')

file STAGE1_MIN_TARGET => [ buildroot, *STAGE1_SRC ] do |t|
  bin = Shellwords.escape(root.join('bin', 'meta-north.js'))
  sh("node #{bin} stage1-min > #{t.name}")
end

desc "Build stage1: most everything metacompiled"
task :stage1 => [ STAGE1_TARGET, STAGE1_MIN_TARGET ]

STAGE2_SRC = [ 'build-stage2.4th',
               '02/assembler.4th',
               '02/ops.4th'
             ].collect { |s| root.join('src', s) }
STAGE2_TARGET = buildroot.join('north-stage2.bin')

file STAGE2_TARGET => [ buildroot, STAGE0_TARGET, *STAGE2_SRC ] do |t|
  sh("#{BCCON} #{STAGE0_TARGET} < src/build-stage1.4th > #{t.name}")
end

desc "Build stage2: stage1 built with stage0"
task :stage2 => STAGE2_TARGET

[ 'forth.css',
  'index.css',
  'unscii-8.ttf',
  'sounds/startup.mp3',
  'manifest.webmanifest'
].each do |name|
  output = buildroot.join(name)
  src = root.join('www', name)

  directory File.dirname(output)
  
  file output => [ src, buildroot, File.dirname(output) ] do |t|
    FileUtils.copy(t.sources[0], t.name)
  end
end

desc "Build stage3: stage0 built with stage2"
task :stage3 do
  raise NotImplementedError
end

BrowserifyRunner.bundle buildroot.join('service_worker.js') => [ root.join('www/service_worker.js') ]
BrowserifyRunner.bundle buildroot.join('ipfs.js') => [ root.join('www/ipfs.js') ]
BrowserifyRunner.bundle buildroot.join('index.js') => [ root.join('www/index.js'), STAGE0_TARGET, STAGE1_TARGET ]
html_file buildroot.join('index.html') => [ root.join('www/index.src.html'), buildroot.join('index.js'), buildroot.join('xterm.css') ]

file buildroot.join('xterm.css') => root.join('node_modules', 'xterm', 'dist', 'xterm.css') do |t|
  FileUtils.copy(t.sources[0], t.name)
end

desc "Build all stages."
task :default => outputs

desc 'Start a webserver on port 9090 to serve the build directory.'
task :serve do
  require 'rake-node/http/server'
  RakeNode::HTTP.run(:Port => ENV.fetch('PORT', 9090).to_i,
                      :DocumentRoot => buildroot,
                     :SSLCertPrefix => root.join('server'),
                     :Domain => ENV.fetch('DOMAIN', nil),
                     :IP => ENV.fetch('IP', nil))
end

namespace :doc do
  DOC_SRC_DIR = buildroot.join('doc', 'src')

  directory DOC_SRC_DIR
  
  desc "Turn the source into HTML."
  task :src => DOC_SRC_DIR do |t|
    STAGE1_SRC.each do |src|
      lang = 'forth'
      lang = 'javascript' if src.extname == '.js'
      sh("pygmentize -f html -O full -l #{lang} -o #{Shellwords.escape(DOC_SRC_DIR.join(src.basename))}.html #{Shellwords.escape(src)}")
    end
  end
end

directory release_root do
  sh("git branch -f gh-pages origin/gh-pages && git clone -b gh-pages #{root} #{release_root}")
end

desc "Build and update the gh-pages branch."
task :release => [ :default, release_root ] do
  sh("cp -rav #{buildroot}/* #{release_root}")
  sh("cd #{release_root} && git add -A #{release_root} && git commit && git push origin gh-pages")
end

