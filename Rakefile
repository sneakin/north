require 'pathname'
require 'shellwords'
require 'rbconfig'

root = Pathname.new(__FILE__).parent.expand_path

$: << root.join('lib')

begin
  load(root.join("Rakefile.main"))
rescue LoadError => e
  $stderr.puts "Try running `rake init`"
end

desc "Initialize project dependencies."
task :init => [ 'init:submodules', 'init:npm' ]

namespace :init do
  task :submodules do
    sh("git submodule update --init")
  end

  task :npm do
    sh("npm install")
  end
end
