: help/1
  doc( Print the doc string of the argument. )
  args( word ++ )
  arg0
  dict-entry-name bright cyan write-string drop
  dict-entry-args dup IF
    color-reset
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
    " No command." write-line return0
  THEN
  help/1
;

: help doc( Print introductory help.)
  " Help:" bright white write-line
  write-crnl
  " Helpful Commands:" color-reset write-line
  ' words help/1
  ' iwords help/1
  ' help: help/1
  ' reboot help/1
  ' : help/1
;
