( Dictionary forgeting: )

: dict-forget
  ( name dict )
  ( find parent )
  arg1 arg0 dict-lookup-parent
  dup UNLESS return0 THEN
  dict-entry-next dict-entry-next ( parent child grandkid )
  ( link parent to child )
  rot set-dict-entry-next
;

( Dictionary iteration: )

: dict-each  
  arg0 

  dict-each-loop:
  local0 terminator? literal dict-each-done ifthenjump 
  drop
  arg1 exec 
  local0 dict-entry-next store-local0 drop
  literal dict-each-loop jump

  dict-each-done: return0
;

( Dictionary output listing: )

: write-dict-entry-name
  arg0 dict-entry-name write-string
;

: write-dict-entry-data
  arg0 dict-entry-data write-unsigned-int 
;

: write-dict-entry-code
  arg0 dict-entry-code write-unsigned-int 
;

: write-dict-entry-kind
  arg0 
  ( functions )
  dict-entry-code
  literal call-data-code 
  equals literal write-dict-entry-kind-func ifthenjump 
  ( also have sequences )
  dict-entry-code 
  literal call-data-seq-code 
  equals literal write-dict-entry-kind-func ifthenjump 
  ( vars )
  dict-entry-code 
  literal variable-peeker-code 
  equals literal write-dict-entry-kind-var ifthenjump 
  ( asm )
  literal longify ASM write-word 
  return0

  write-dict-entry-kind-func:
  literal longify FUN write-word 
  return0

  write-dict-entry-kind-var:
  literal longify VAR write-word 
;

: write-dict-entry
  arg0
  write-dict-entry-kind write-tab 
  write-dict-entry-name write-tab 
  write-dict-entry-code write-tab 
  write-dict-entry-data write-crnl 
;

: dict-list
  literal write-dict-entry dict dict-each 
;

( Dictionary predicates: )

( Returns the number of definitions in the dictionary. )
: dict-count ( dictionary -- count )
  literal 0
  arg0
  
  DO arg2 literal 1 int-add set-arg2
     arg1 dict-entry-next swapdrop dup set-arg1
  null? swapdrop UNTIL

  local0 return1
;

: dict-entry-indirect?
  arg0 dict-entry-code swapdrop
  literal call-data-seq dict-entry-code swapdrop
  dup1 equals UNLESS
    literal call-data dict-entry-code swapdrop
    equals UNLESS
      false return1
    THEN
  THEN

  true return1
;

: dict-entry?
  arg0 dict-entry-name seq-length cell* swapdrop
  int-add cell+ peek
  terminator?
  return1
;
