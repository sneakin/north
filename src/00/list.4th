: cons args return1 ;
: dcons arg0 dpush dhere arg1 dpush return1 ;
: tail arg0 cell+ peek return1 ;
: head arg0 peek return1 ;
: nil literal 0 return1 ;

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

: reduce-list
    args( list initial fn )
    arg2 dup IF
        head swapdrop arg1 arg0 exec set-arg1
        arg2 tail set-arg2 drop
        RECURSE
    THEN
    arg1 return1
;

: count
    args( list ++ number )
    arg0 int32 0 [ arg1 int32 1 int-add return1 ]
    reduce-list return1
;

: list-index-of/3
    arg2 head arg1 equals IF arg0 literal 1 return2 THEN
    arg2 tail dup IF
        set-arg2
        arg0 int32 1 int-add set-arg0
        RECURSE
    THEN
    int32 0 int32 0 return2
;

: list-index-of
    arg1 arg0 int32 0 list-index-of/3
    return2
;

: test-reduce-list
    int32 0 int32 1 dcons int32 2 dcons int32 3 dcons
    int32 0 ' int-add reduce-list ,d .\n
;
