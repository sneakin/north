( Colorize the prompt: )

:: write-ok
  bright green 
  int32 $204b4f20 write-word 
  color-reset 
;

:: write-err
  bright red 
  int32 $20524520 write-word 
  color-reset 
;

:: prompt
  bright yellow
  int32 $203e0a0d write-word 
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
  bright red arg0 write-line color-reset
  arg1 write-line
  arg0 *status* poke
  int32 0 *state* poke
  quit ( exit caller )
;

( Pretty eval-loop. )
:: eval-read-line
  write-status arg0 write-int drop write-tab dim write-depth
  color-reset prompt
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

: .
  doc( Print the top of stack. )
  arg0 write-int
;

( Base helpers: )

: binary int32 %10 base poke ;
: hex int32 $10 base poke ;
: dec int32 #10 base poke ;
