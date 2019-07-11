#!/usr/bin/ruby
# preproc filenames*
# Makes defining call sequences easier by prepending data size prefixes to lines subsequennt to `def`,
# adds some keywords for strings, constants, and variables.
#

bits=ENV.fetch('BITS', 32).to_i
word_prefix='dd'

if bits == 64
  word_prefix = 'dq'
end

definition = nil

ARGF.each do |line|
  if line =~ /^def/
    # Detect lines that start a function definition:
    definition = line
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
    puts "#{$1} #{cell_prefix} #{$2}"
  elsif line =~ /^import\s+(\w+)\s+(.*)/
    # import library functions...
    puts ";; #{$1}"
    $2.split(/[, ]+/).each do |fn|
      name, ari, returns = fn.split('/')
      ari = 0 unless ari
      returns = 0 unless returns
      puts "defc #{name},#{ari},#{returns}"
    end
  elsif line =~ /^export\s+(.*)/
    $1.split(/\s+/).each do |fn|
      puts "export #{fn}"
    end
  else
    # inside a definition
    if definition
      if line =~ /^\s*$/   # Blank lines
        definition = nil
        puts line
      elsif line =~ /^\./ || line =~ /^\s+;/
        # Print internal labels and blank lines verbatim.
        puts line
      else
        # Treat any other lines as part of the space or comma separated call sequence.
        puts "  #{word_prefix} #{line.split(/[ ,]+/).join(',')}"
      end
    else
      # Print all other lines
      puts line
    end
  end
end
