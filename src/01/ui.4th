( Colorize the prompt: )

:: write-ok
  bold green 
  int32 $204b4f20 write-word 
  color-reset 
;

:: write-err
  bold red 
  int32 $20524520 write-word 
  color-reset 
;

:: prompt
  bold yellow
  " > " write-string
  color-reset 
;

:: write-status
  *status* peek UNLESS write-ok return0 THEN
  write-err int32 0 *status* poke return0
;
 
( More human friendly interaction: )

( Colorful error output: )
:: error
  ( error-msg2 error-msg1 )
  bold red arg0 write-line color-reset drop
  arg1 write-line drop
  arg0 *status* poke
  int32 0 *state* poke
  ( todo preserve the input line for continuing )
  ' eval-start cont ( let's poke around )
;

( Pretty eval-loop. )
:: eval-read-line
  write-status
  eval-tos @
  dup @ write-int drop
  write-tab dim write-depth drop
  color-reset write-crnl prompt
  read-line
  blue write-string color-reset
  return1
;

( Make ; print the new entry's name and OK. )
: ;
  doc( Closes a colon definition updating the last word's data field. )
  dict dict-entry-name write-string drop2 write-ok
  ' endcol jump-entry-data
; immediate-only
