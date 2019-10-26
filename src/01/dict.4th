( Dictionary manipulation: )

: dict-forget
  ( name dict )
  ( find parent )
  arg1 arg0 dict-lookup-parent
  dup UNLESS return0 THEN
  dict-entry-next dict-entry-next ( parent child grandkid )
  ( link parent to child )
  rot set-dict-entry-next
;

: add-dict-after
    arg0 dict-entry-next swapdrop
    arg3 arg2 arg1 make-dict/4
    arg0 set-dict-entry-next
    drop return1
;

( Dictionary iteration: )

: dict-each  ( fn dict -- fn last-dict)
  arg0 terminator? IF return0 THEN
  arg1 exec-core-word
  arg0 dict-entry-next set-arg0 drop2
  RECURSE
;

( Dictionary output listing: )

: write-dict-entry-name
  arg0 dict-entry-name write-escaped-string
;

: write-dict-entry-data
  arg0 dict-entry-data write-unsigned-int 
;

: write-dict-entry-code
  arg0 dict-entry-code write-unsigned-int 
;

: write-dict-entry-next
  arg0 dict-entry-next write-unsigned-int
;

: write-dict-entry-kind
  ( functions )
  arg0 dict-entry-code
  literal call-data-seq dict-entry-code swapdrop
  equals IF longify IFUN write-word return0 THEN
  ( functions with offset words )
  dict-entry-code
  literal call-offset-data-seq dict-entry-code swapdrop
  equals IF longify OFUN write-word return0 THEN
  ( constants )
  dict-entry-code 
  literal value-peeker dict-entry-code swapdrop
  equals IF longify CON write-word return0 THEN
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
  write-dict-entry-data write-tab 
  write-dict-entry-next write-crnl 
;

( Write a dictionary out entry by entry. )
: dict-list ( dict )
  literal write-dict-entry arg0 dict-each 
;

: words doc( Write the primary dictionary out. )
  dict dict-list
;

: iwords doc( Write the immediate dictionary out. )
  immediate-dict peek dict-list
;

( Dictionary predicates: )

( Returns the number of definitions in the dictionary. )
: dict-count ( dictionary -- count )
  int32 0
  arg0
  
  DO arg2 int32 1 int-add set-arg2
     arg1 dict-entry-next swapdrop dup set-arg1
  null? swapdrop UNTIL

  local0 return1
;

: dict-entry-indirect?
  arg0 dict-entry-code swapdrop
  literal call-data-seq dict-entry-code swapdrop
  over equals UNLESS
    false return1
  THEN

  true return1
;

: in-range-unsigned?
    doc( Inclusively test if VALUE is between MAX and MIN. )
    args( Max min value ++ result )
  arg0 dup arg1 uint>= IF
    arg2 uint<= IF int32 1 return1 THEN
    int32 0 return1
  THEN
  
  drop int32 0 return1
;

: pointer?
    stack-top here arg0 in-range-unsigned? IF true return1 THEN
    dhere data-segment arg0 in-range-unsigned? IF true return1 THEN
    code-segment int32 binary-size int-add code-segment arg0 in-range-unsigned? IF true return1 THEN
    false return1
;

: dict-entry?
    arg0 pointer? UNLESS int32 0 return1 THEN
    ( name a valid string? )
    dict-entry-name pointer? UNLESS int32 0 return1 THEN
    seq-length cell* swapdrop
    int-add cell+ peek
    terminator? return1
;

: dict-entry-def?
    arg0 dict-entry-code
    ' call-data-seq dict-entry-code swapdrop
    equals return1
;

( Dictionary building helpers: )

: aliases>
    doc( Creates a dictionary entry named NAME, linked to the PREV-ENTRY
    and with the same code and data values as the following param. )
    args( prev-entry name : entry-to-copy ++ dict-entry )
    arg1
    arg0
    next-param dict-entry-code
    swap dict-entry-data swapdrop
    make-dict/4 return1
;
