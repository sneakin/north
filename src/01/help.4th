def help/1
  doc( Print the doc string of the argument. )
  args( word ++ )
  arg0
  dict-entry-name bold cyan write-string drop
  dict-entry-args dup IF
    color-reset dim
    "  ( " write-string drop
    write-string
    "  )" write-string drop
  THEN drop
  write-crnl
  dict-entry-doc dup UNLESS " No help." THEN
  color-reset write-line drop
end

def help:
  doc( Print the following word's doc string. )
  args( _ : word ++ )
  POSTPONE ' dup UNLESS
    " No help." write-line return0
  THEN
  help/1
end

def ihelp:
  doc( Print the following immediate word's doc string. )
  args( _ : word ++ )
  POSTPONE i' dup UNLESS
    " No help." write-line return0
  THEN
  help/1
end

def help doc( Print introductory help.)
  about
  write-crnl
  " Helpful Commands:" write-heading
  ' words help/1
  ' help: help/1
  ' iwords help/1
  ' ihelp: help/1
  ' ' help/1
  ' i' help/1
  ' decompile help/1
  write-crnl
  " System commands:" write-heading
  ' reboot help/1
  ' quit help/1
  ' bye help/1
  ' exit help/1
    write-crnl
  " Compiling words:" write-heading
  ' variable help/1
  ' def help/1
  ( fixme may have a discrepancy in meta and self compiling with immediate lookups )
  ( ' end help/1 )
  " end  Leave compiling mode started by def." write-crnl
  ' ( help/1
  ' " help/1
  ' begin help/1
  ' end-frame help/1
  ' return1 help/1
  ' RECURSE help/1
  ' IF help/1
  ' UNLESS help/1
  ' ELSE help/1
  ' THEN help/1
  ' [ help/1
  ' DOTIMES[ help/1
  write-crnl " Data Values:" write-heading
  ' literal help/1
  ' int32 help/1
  ' POSTPONE help/1
end

( todo categorical help commands for help, stack, system, compiling, frame & data, math, logic, input/output, assembly, internals ... )
( todo hypertext pager / viewer w/ links and semantic class coloring. )