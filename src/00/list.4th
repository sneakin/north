def cons args return1 end
def nil int32 0 return1 end

def map-list! ( cons! fn ++ )
  arg1 UNLESS return0 THEN
  arg1 head swapdrop arg0 exec-core-word ( todo only dictionary entries can be passed, bracketed definitions, :noname maybe, should work too. )
  arg1 tail swapdrop set-arg1
  RECURSE
end

def map-list ( cons fn ++ )
  arg1 arg0 map-list!
end

def count-inner
  arg0 IF
    arg0 tail set-arg0
    arg1 int32 1 int-add set-arg1
    ( literal count tailcall )
    RECURSE
  THEN
  arg1 return1
end

def count-recurse int32 0 arg0 count-inner return1 end

def reduce-list
    args( list initial fn )
    arg2 dup IF
        head swapdrop arg1 arg0 exec-core-word set-arg1
        arg2 tail set-arg2 drop
        RECURSE
    THEN
    arg1 return1
end

def count
    args( list ++ number )
    arg0 int32 0 [ arg1 int32 1 int-add return1 ]
    reduce-list return1
end

def list-index-of/3
    arg2 head arg1 equals IF arg0 int32 1 return2 THEN
    arg2 tail dup IF
        set-arg2
        arg0 int32 1 int-add set-arg0
        RECURSE
    THEN
    int32 0 int32 0 return2
end

def list-index-of
    arg1 arg0 int32 0 list-index-of/3
    return2
end

def test-reduce-list
    int32 0 int32 1 dcons int32 2 dcons int32 3 dcons
    int32 0 ' int-add reduce-list ,d .\n
end
