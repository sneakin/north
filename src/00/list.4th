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
