: cons args return1 ;
: dcons arg0 dpush dhere arg1 dpush return1 ;
: tail arg0 cell+ peek return1 ;
: head arg0 peek return1 ;

: map-list! ( cons! fn ++ )
  arg1 UNLESS return0 THEN
  arg1 head swapdrop arg0 exec ( todo only dictionary entries can be passed, bracketed definitions, :noname maybe, should work too. )
  arg1 tail swapdrop set-arg1
  RECURSE
;

: map-list ( cons fn ++ )
  arg1 arg0 map-list!
;

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

: nil literal 0 return1 ;

( Tree structure: btree-ptr -> tip predicate.
  Tip -> Branch -> [ Value, [ Left Branch, Right Branch ] ] | [ Value, nil ]
struct btree-branch
  field value
  field left
  field right

struct btree
  field tip
  field predicate
)

: make-btree ( predicate tip -- btree-list )
  nil arg1 cons arg0 cons exit
;

: make-empty-btree ( predicate -- btree-list )
  arg0 nil make-btree exit
;

: btree-predicate
  arg0 tail head return1
;

: btree-set-tip
  arg0 btree-predicate arg1 make-btree return1
;

: btree-tip
  arg0 head return1
;

( Branches )

: btree-make-branch ( left right value -- ptr )
  nil arg2 cons arg1 cons arg0 cons exit
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

: btree-leaf? arg0 tail null? return1 ;

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
