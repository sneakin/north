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
  local0 terminator? IF return0 THEN
  drop
  arg1 exec 
  local0 dict-entry-next store-local0 drop
  literal dict-each-loop jump
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
  ( functions )
  arg0 dict-entry-code
  literal call-data dict-entry-code swapdrop
  equals IF longify FUN write-word return0 THEN
  ( also have sequences )
  dict-entry-code 
  literal call-data-seq dict-entry-code swapdrop
  equals IF longify FUN write-word return0 THEN
  ( vars )
  dict-entry-code 
  literal variable-peeker dict-entry-code swapdrop
  equals IF longify VAR write-word return0 THEN
  ( asm )
  longify ASM write-word 
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
