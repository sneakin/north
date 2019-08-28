: help/1
  doc( Print the doc string of the argument. )
  args( word ++ )
  arg0
  dict-entry-name bright cyan write-string drop
  dict-entry-args dup IF
    color-reset dim
    "  ( " write-string drop
    write-string
    "  )" write-string drop
  THEN drop
  write-crnl
  dict-entry-doc dup UNLESS " No help." THEN
  color-reset write-line drop
;

: help:
  doc( Print the following word's doc string. )
  args( _ : word ++ )
  POSTPONE ' dup UNLESS
    " No help." write-line return0
  THEN
  help/1
;

: ihelp:
  doc( Print the following immediate word's doc string. )
  args( _ : word ++ )
  POSTPONE i' dup UNLESS
    " No help." write-line return0
  THEN
  help/1
;

: help doc( Print introductory help.)
  about
  write-crnl
  " Helpful Commands:" write-line
  ' words help/1
  ' help: help/1
  ' iwords help/1
  ' ihelp: help/1
  write-crnl
  " System commands:" write-line
  ' reboot help/1
  ' quit help/1
  ' bye help/1
  write-crnl
  " Compiling words:" write-line
  ' : help/1
  ( fixme way have a discrepancy in meta and self compiling with immediate lookups )
  ' ; help/1
  ' ' help/1
  ' variable help/1
;

( todo categorical help commands for help, stack, system, compiling, frame & data, math, logic, input/output, assembly, internals ... )
( todo hypertext pager / viewer w/ links and semantic class coloring. )