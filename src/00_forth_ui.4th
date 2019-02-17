( Basic Prompt )

: write-ok
  literal $204b4f20 write-word 
;

: write-err
  literal $20524520 write-word 
;

: write-status
  *status* peek IF
    write-err literal 0 *status* poke return0
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
  arg0 *status* poke
  literal 0 *state* poke
  quit ( exit caller )
;

: eval-loop
  write-status write-int write-tab
  prompt
  flush-read-line
  make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;
