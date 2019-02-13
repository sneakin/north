( super basic reader functions )

: eat-spaces
  eat-spaces-loop:
  read-byte
  whitespace? literal eat-spaces-reloop ifthenjump
  return1

  eat-spaces-reloop: drop literal eat-spaces-loop jump
;

: read-token
  start-seq
  eat-spaces
  dpush

  read-token-loop:
  read-byte
  whitespace? literal read-token-done ifthenjump
  dpush
  literal read-token-loop jump

  read-token-done: drop end-seq return1
;

: b-lit
  read-token return1
;

: b'
  b-lit dict dict-lookup return1
;

( Barebones evaluation loop. )

: prompt0
  bright yellow 
  literal PS0 write-word 
  color-reset 
;

: bootstrap-loop
  bootstrap-loop-inner:
  write-status prompt0 
  read-token 
  dict dict-lookup  ( fixme: dict and token are on stack during call, tail call needs to eat caller's frame? )
  swapdrop 
  dup not literal bootstrap-loop-not-found ifthenjump 
  swapdrop 
  exec 
  literal bootstrap-loop-inner jump 
  exit

  bootstrap-loop-not-found: drop
  literal bootstrap-loop-inner jump
;

: boo
  literal longify BOO write-word 
  literal 0 literal boo-done ifthenjump write-err 

  boo-done: write-ok 
  literal $8765 return1
;
