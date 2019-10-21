#!/usr/bin/ruby
# preproc filenames*
# Makes defining call sequences easier by prepending data size prefixes to lines subsequennt to `def`,
# adds some keywords for strings, constants, and variables.
#

$bits=ENV.fetch('BITS', 32).to_i
$word_prefix='dd'

#if $bits == 64
#  $word_prefix = 'dq'
#end

INCLUDE_PATH = ENV.fetch('INCLUDE_PATH', '').split(':')
INCLUDE_PATH.push('.')

def find_source_file(name)
  INCLUDE_PATH.each do |path|
    fn = File.join(path, name)
    return fn if File.exists?(fn)
  end

  raise ArgumentError.new("#{name} not found in #{INCLUDE_PATH.join(', ')}")
end

$included_files = Array.new
$definition = nil
$suffix = ''

def process_lines(iter)
  iter.each do |line|
    # turn any forth style comments into asm comments
    line = line.gsub(/[(] (.*)[)]$/, "; \1")
    
    if line =~ /^def(\w{0,2}) (\w+)/
      # Detect lines that start a function definition:
      $definition = line
      $suffix = case $1
               when 'i' then ENV.fetch('SUFFIX', '_i')
               when 'oi' then ENV.fetch('SUFFIX', '_off')
               else ''
               end
      $word_prefix = case $1
                    when 'i' then 'dd'
                    when 'oi' then 'dd'
                    else if $bits == 64
                           'dq'
                         else
                           'dd'
                         end
                    end
      puts line
    elsif line =~ /^string\s+(\w+)\s+(['"].*)/
      # string name "Value...","and more",...
      puts "section .rdata"
      puts "#{$1}: db #{$2},0"
    elsif line =~ /^const\s+(\w+)\s+(.*)/
      # const name value
      puts "section .rdata"
      puts "#{$1} equ #{$2}"
    elsif line =~ /^var\s+(\w+)\s+(.*)/
      # var name value
      puts "section .data"
      puts "#{$1} #{$word_prefix} #{$2}"
    elsif line =~ /^import\s+(\w+)\s+(.*)/
      # import library functions...
      puts ";; #{$1}"
      $2.split(/[, ]+/).each do |fn|
        name, ari, returns = fn.split('/')
        ari = 0 unless ari
        returns = 0 unless returns
        puts "defc #{name},#{ari},#{returns}"
      end
    elsif line =~ /^import_var\s+(\w+)\s+(.*)/
      # import library variables...
      puts ";; #{$1}"
      $2.split(/[, ]+/).each do |name|
        puts "defcvar #{name}"
      end
    elsif line =~ /^(export|global)\s+(.*)/
      $2.split(/\s+/).each do |fn|
        puts "global #{fn}"
      end
    elsif line =~ /^include\s+"(.*)"/
      path = find_source_file($1)
      if $included_files.include?(path)
        puts(";; Skipping include #{$1}")
      else
        puts(";; Including #{$1}")
        $included_files.push(path)
        process_lines(File.readlines(path).each)
        process_lines([ "\n" ])
      end
    else
      # inside a definition
      if $definition
        if line =~ /^\s*$/   # Blank lines
          $definition = nil
          puts line
        elsif line =~ /^\./ || line =~ /^\s+;/
          # Print internal labels and blank lines verbatim.
          puts line
        else
          # Treat any other lines as part of the space or comma separated call sequence.
          tokens = line.gsub(/;.*$/, '').strip.split(/[ ,]+/)
          tokens.each_with_index { |t, i|
            # Specially treat the literal values.
            prefix = case tokens[i - 1]
                     when /^int32/ then 'dd'
                     when /^int64/ then 'dq'
                     when /^pointer/ then 'dq'
                     else $word_prefix
                     end
            t = t + $suffix if t =~ /^[a-zA-Z][_a-zA-Z0-9]*/
            puts "  #{prefix} #{t}"
          }
        end
      else
        # Print all other lines
        puts line
      end
    end
  end
end

process_lines(ARGF.each)
