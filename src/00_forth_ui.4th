( Better user output: )

: error
  ( error-msg2 error-msg1 )
  arg0 write-line
  arg1 write-line
  arg0 literal *status*-sym set-var
  literal 0 literal *state*-sym set-var drop3
  quit ( exit caller )
;

: eval-loop
  write-status write-int write-tab
  prompt
  flush-read-line
  make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;
