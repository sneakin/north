( More human friendly interaction: )

( Colorful error output: )
:: error
  ( error-msg2 error-msg1 )
  bright red arg0 write-line color-reset
  arg1 write-line
  arg0 lit *status* set-var
  literal 0 lit *state* set-var drop3
  quit ( exit caller )
;

( Pretty eval-loop. )
:: eval-loop
  write-status write-int write-tab
  color-reset prompt
 flush-read-line
  blue write-string color-reset
  make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;

( Make ; print the new entry's name and OK. )
: ;
dict dict-entry-name write-string drop2 write-ok
literal endcol jump-entry-data
; immediate-only

( Print the top of stack. )
: . arg0 write-int ;

( Base helpers: )

: binary literal %10 lit base set-var ;
: hex literal $10 lit base set-var ;
: dec literal #10 lit base set-var ;
