: cons args return1 ;
: tail arg0 cell+ peek return1 ;
: head arg0 peek return1 ;

: count-inner
  arg0 IF
    arg0 tail set-arg0
    arg1 literal 1 int-add set-arg1
    ( literal count tailcall )
    RECURSE
  THEN
  arg1 return1
;

: count literal 0 arg0 count-inner return1 ;

( Tree structure: btree-ptr -> tip predicate.
  Tip -> Branch -> [ Value, [ Left Branch, Right Branch ] ] | [ Value, nil ]
)

: make-btree ( predicate -- btree-ptr )
  arg0 zero cons return1
;

: btree-leaf? arg0 tail null? return1 ;

: btree-predicate
  arg0 tail return1
;

: btree-set-tip
  arg0 tail arg1 cons return1
;

: btree-tip
  arg0 head return1
;

: btree-make-branch ( left right value -- ptr )
  arg2 arg1 cons arg0 cons return1
;

: btree-branch-value
  arg0 head return1
;

: btree-branch-left
  arg0 tail head return1
;

: btree-branch-right
  arg0 tail tail head return1
;

: btree-add ( value btree )
  ( go head if <, go tail if >=; )
  arg1 arg0 btree-find-parent-for IF
    dup2 swap btree-make-branch return1
  THEN
  btree-set-tip return1
;

: btree-find-parent-for ( obj btree )
  arg1
  arg0 btree-predicate swap
  btree-tip
  
  DO
    ( compare needle with value using the predicate )
    arg3 arg1 arg2 call dup UNLESS drop LEAVE THEN
    ( > so go left )
    literal 0 > IF
      drop btree-branch-left dup UNLESS LEAVE THEN
      set-arg1 drop
      AGAIN
    THEN
    ( < 0 so go right )
    drop btree-branch-right dup UNLESS LEAVE THEN
    set-arg1 drop
  arg1 btree-leaf? swapdrop UNTIL
;
: btree-find ( value btree )
  arg1 arg0 btree-find-parent-for
  btree-branch-left dup arg1 equals IF true return2 THEN
  btree-branch-right dup arg1 equals IF true return2 THEN
  false return2
;
: btree-rm ;
