( Basic Prompt )

: write-ok
  int32 $204b4f20 write-word 
;

: write-err
  int32 $20524520 write-word 
;

: write-status
  *status* peek IF
    write-err int32 0 *status* poke return0
  THEN
  write-ok
;
 
: prompt
  int32 $203e0a0d write-word 
;

( More input prompt: )

:: error
  ( error-msg2 error-msg1 )
  arg0 write-line
  arg1 write-line
  arg0 *status* poke
  int32 0 *state* poke
  eval-loop ( let's poke around )
;

:: eval-read-line
  write-status arg0 write-int drop write-tab
  prompt read-line return1
;
