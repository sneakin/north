( Basic Prompt )

: write-ok
  literal $204b4f20 write-word 
;

: write-err
  literal $20524520 write-word 
;

: write-status
  *status* IF
    write-err literal 0 lit *status* set-var return0
  THEN
  write-ok
;
 
: prompt
  literal $203e0a0d write-word 
;

( More input prompt: )

(
: eval-loop
  write-status prompt
  flush-read-line
  make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;
)

: error
  ( error-msg2 error-msg1 )
  arg0 write-line
  arg1 write-line
  arg0 lit *status* set-var
  literal 0 lit *state* set-var drop3
  quit ( exit caller )
;

: eval-loop
  write-status write-int write-tab
  prompt
  flush-read-line
  make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;
