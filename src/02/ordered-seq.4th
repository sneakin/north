: <=>
    arg1 arg0 equals IF int32 0 return1 THEN
    arg1 arg0 > IF int32 1 return1 THEN
    int32 -1 return1
;

: not-<=>
    arg1 arg0 <=> negate return1
;

: uint<=>
    arg1 arg0 equals IF int32 0 return1 THEN
    arg1 arg0 uint> IF int32 1 return1 THEN
    int32 -1 return1
;

: not-uint<=>
    arg1 arg0 uint<=> negate return1
;

(
structure ordered-seq
field: count
field: items
)

: ordered-seq-count arg0 return1-1 ;
: ordered-seq-items arg0 cell+ return1-1 ;

: dallot-ordered-seq/2
    int32 2 cell* dallot
    arg0 over ordered-seq-count !
    arg1 over ordered-seq-items !
    return1
;

: dallot-ordered-seq/1
    arg0 int32 0 dallot-ordered-seq/2
    return1
;

: make-ordered-seq
    args( max-size )
    arg0 dallot-zeroed-seq dallot-ordered-seq/1 return1
;

: ordered-seq-max-count
    arg0 ordered-seq-items @ seq-length return1
;

: ordered-seq-full?
    arg0 ordered-seq-count @
    arg0 ordered-seq-max-count swapdrop
    >= return1
;

: ordered-seq-peek
    arg1 ordered-seq-items @ arg0 seq-peek
    return1
;

: ordered-seq-poke
    arg2 arg1 ordered-seq-items @ arg0 seq-poke
;

( todo check the last and first items first, unless there's one item. )
: ordered-seq-add/4
    args( item seq sort-fn counter ++ reject added? )
    arg0 arg2 ordered-seq-max-count swapdrop >= IF
        arg3 false return2
    THEN
    arg0 arg2 ordered-seq-count @ >= IF
        ( place the item in the open slot )
        arg3 arg2 arg0 ordered-seq-poke
        ( increase the count )
        int32 1 int-add arg2 ordered-seq-count !
        int32 0 true return2
    THEN
    ( cache the current value )
    arg2 arg0 ordered-seq-peek rotdrop2
    ( swap the item if the sort is negative )
    arg3 over arg1 exec int32 0 < IF
        arg3 arg2 arg0 ordered-seq-poke
        local0 set-arg3
    THEN
    ( increment counter )
    arg0 int32 1 int-add set-arg0
    ( and loop )
    drop-locals RECURSE
;

: ordered-seq-add
    args( item seq sort-fn ++ )
    arg2 arg1 arg0 int32 0 ordered-seq-add/4 return2
;

: ordered-seq-index/4
    args( key seq sort-fn counter ++ index found? )
    arg0 arg2 ordered-seq-max-count swapdrop >= IF int32 -1 false return2 THEN
    arg0 arg2 ordered-seq-count @ >= IF int32 -1 false return2 THEN
    arg2 arg0 ordered-seq-peek rotdrop2
    arg3 over arg1 exec int32 0 equals IF arg0 true return2 THEN
    arg0 int32 1 int-add set-arg0
    drop-locals RECURSE
;

: ordered-seq-index
    args( key seq sort-fn ++ index found? )
    arg2 arg1 arg0 int32 0 ordered-seq-index/4 return2
;

: ordered-seq-find
    args( key seq sort-fn ++ item found? )
    arg2 arg1 arg0 ordered-seq-index IF
        arg1 swap ordered-seq-peek true return2
    THEN
    int32 -1 false return2
;

: map-ordered-seq
    args( seq fn )
    arg1 ordered-seq-items @ seq-data
    arg1 ordered-seq-count @
    arg0
    map-seq-n
;

: reduce-ordered-seq
    args( seq fn initial ++ result )
    arg2 ordered-seq-items @ seq-data
    arg2 ordered-seq-count @
    arg1 arg0 reduce-seq-n
    return1
;

: ordered-seq-pop
    args( ordered-seq ++ item ok? )
    arg0 ordered-seq-count @
    dup int32 0 > IF
        int32 1 int-sub
        ( get item )
        arg0 swap ordered-seq-peek
        ( update the counter )
        swap arg0 ordered-seq-count !
        ( return the item )
        true return2
    THEN
    int32 -1 false return2
;

: ordered-seq-shift
    args( ordered-seq ++ item ok? )
    arg0 ordered-seq-count @
    dup int32 0 > IF
        ( update count )
        int32 1 int-sub
        dup arg0 ordered-seq-count !
        ( get the first value )
        arg0 int32 0 ordered-seq-peek rotdrop2
        ( copy the items down )
        arg0 ordered-seq-items @ seq-data swapdrop
        cell+ swap int32 3 overn cell* swapdrop copy drop3
        ( return the first item )
        true return2
    THEN
    int32 -1 false return2
;

: assert-ordered-seq-item
    arg1 arg3 ordered-seq-peek arg2 arg0 assert-equal
;

: assert-ordered-seq-item-string
    arg1 arg3 ordered-seq-peek arg2 arg0 assert-strings
;

: assert-ordered-seq-count
    arg1 arg0 ordered-seq-count @ " set the count" assert-equal
;

: test-ordered-seq-add-lt
    doc( Test `ordered-seq-add` with `<=>` as the sort-fn. )
    dhere
    int32 3 make-ordered-seq swapdrop
    swap int32 7 cell+n rotdrop2 " alloted a seq of 3 and 2 cells from dhere" assert-equal
    local0 ordered-seq-count @ int32 0 " zeroed count" assert-equal
    local0 ordered-seq-max-count int32 3 " alloted a seq for data" assert-equal
    
    ( first item )
    int32 12 local0 ' <=> ordered-seq-add
    int32 0 true " has no reject" assert-equal2 drop2
    int32 1 local0 assert-ordered-seq-count
    int32 0 int32 12 local0 " adds an item" assert-ordered-seq-item

    int32 15 local0 ' <=> ordered-seq-add
    int32 0 true " has no reject" assert-equal2 drop2
    int32 2 local0 assert-ordered-seq-count
    int32 1 int32 15 local0 " adds a second item after" assert-ordered-seq-item
    int32 0 int32 12 local0 " left the first" assert-ordered-seq-item

    int32 10 local0 ' <=> ordered-seq-add
    int32 0 true " has no reject" assert-equal2 drop2
    int32 3 local0 assert-ordered-seq-count
    int32 0 int32 10 local0 " prepends lesser items" assert-ordered-seq-item
    int32 1 int32 12 local0 " shifted greater items" assert-ordered-seq-item
    int32 2 int32 15 local0 " shifted greater items" assert-ordered-seq-item

    int32 17 local0 ' <=> ordered-seq-add
    int32 17 false " rejected the value" assert-equal2 drop2
    int32 3 local0 assert-ordered-seq-count
    int32 0 int32 10 local0 " left item 0" assert-ordered-seq-item
    int32 1 int32 12 local0 " left item 1" assert-ordered-seq-item
    int32 2 int32 15 local0 " left item 2" assert-ordered-seq-item

    int32 5 local0 ' <=> ordered-seq-add
    int32 15 false " rejected the greatest value" assert-equal2 drop2
    int32 3 local0 assert-ordered-seq-count
    int32 0 int32 5 local0 " became item 0" assert-ordered-seq-item
    int32 1 int32 10 local0 " shifted item 1" assert-ordered-seq-item
    int32 2 int32 12 local0 " shifted item 2" assert-ordered-seq-item

    int32 11 local0 ' <=> ordered-seq-add
    int32 12 false " rejected the greatest value" assert-equal2 drop2
    int32 3 local0 assert-ordered-seq-count
    int32 0 int32 5 local0 " left item 0" assert-ordered-seq-item
    int32 1 int32 10 local0 " shifted item 1" assert-ordered-seq-item
    int32 2 int32 11 local0 " became item 2" assert-ordered-seq-item

    local0 return1
;

: make-ordered-seq-test
    int32 4 make-ordered-seq swapdrop
    int32 15 local0 ' not-<=> ordered-seq-add
    int32 10 local0 ' not-<=> ordered-seq-add
    int32 20 local0 ' not-<=> ordered-seq-add
    int32 12 local0 ' not-<=> ordered-seq-add
    local0 return1
;

: test-ordered-seq-add-gt
    doc( Test ordered-seq-add with `not-<=>`. )
    make-ordered-seq-test
    int32 19 local0 ' not-<=> ordered-seq-add
    int32 10 false " rejected the greatest value" assert-equal2 drop2
    int32 4 local0 assert-ordered-seq-count
    int32 0 int32 20 local0 " item 0" assert-ordered-seq-item
    int32 1 int32 19 local0 " item 1" assert-ordered-seq-item
    int32 2 int32 15 local0 " item 2" assert-ordered-seq-item
    int32 3 int32 12 local0 " item 3" assert-ordered-seq-item
;

: test-ordered-seq-index
    make-ordered-seq-test
    int32 100 local0 ' not-<=> ordered-seq-index int32 0 " was not found" assert-equal int32 3 dropn
    int32 -1 " dummy value" assert-equal
    int32 20 local0 ' not-<=> ordered-seq-index int32 1 " found the item" assert-equal int32 3 dropn
    int32 0 " 20 in slot 0" assert-equal
    int32 15 local0 ' not-<=> ordered-seq-index int32 1 " found the item" assert-equal int32 3 dropn
    int32 1 " 15 in slot 1" assert-equal
    int32 12 local0 ' not-<=> ordered-seq-index int32 1 " found the item" assert-equal int32 3 dropn
    int32 2 " 12 in slot 2" assert-equal
    int32 10 local0 ' not-<=> ordered-seq-index int32 1 " found the item" assert-equal int32 3 dropn
    int32 3 " 15 in slot 3" assert-equal
;

: make-ordered-seq-test-strings
    int32 4 make-ordered-seq swapdrop
    " george" local0 ' string-cmp ordered-seq-add
    " henry" local0 ' string-cmp ordered-seq-add
    " bob" local0 ' string-cmp ordered-seq-add
    " cathy" local0 ' string-cmp ordered-seq-add
    local0 return1
;

: test-ordered-seq-add-string
    doc( Test ordered-seq-add with string values and `string-cmp` as the sort-fn. )
    make-ordered-seq-test-strings
    " fred" local0 ' string-cmp ordered-seq-add
    false " had a reject" assert-equal int32 3 dropn
    " henry" " rejected the greatest value" assert-strings
    int32 4 local0 assert-ordered-seq-count
    int32 0 " bob" local0 " item 0" assert-ordered-seq-item-string
    int32 1 " cathy" local0 " item 1" assert-ordered-seq-item-string
    int32 2 " fred" local0 " item 2" assert-ordered-seq-item-string
    int32 3 " george" local0 " item 3" assert-ordered-seq-item-string
    local0 return1
;

: test-ordered-seq-index-string
    doc( Test ordered-seq-index with finding string values. )
    make-ordered-seq-test-strings
    " dog" local0 ' string-cmp ordered-seq-index int32 0 " did not find the string" assert-equal int32 3 dropn
    int32 -1 " dummy value" assert-equal
    " cathy" local0 ' string-cmp ordered-seq-index int32 1 " found the string" assert-equal int32 3 dropn
    int32 1 " found cathy" assert-equal
;

: test-ordered-seq-pop
    make-ordered-seq-test

    local0 ordered-seq-pop true " it popped" assert-equal int32 3 dropn
    int32 10 " was the last item" assert-equal
    local0 ordered-seq-count @ int32 3 " decreased count" assert-equal

    local0 ordered-seq-pop true " it popped" assert-equal int32 3 dropn
    int32 12 " was the last item" assert-equal
    local0 ordered-seq-count @ int32 2 " decreased count" assert-equal

    local0 ordered-seq-pop true " it popped" assert-equal int32 3 dropn
    int32 15 " was the last item" assert-equal
    local0 ordered-seq-count @ int32 1 " decreased count" assert-equal

    local0 ordered-seq-pop true " it popped" assert-equal int32 3 dropn
    int32 20 " was the last item" assert-equal
    local0 ordered-seq-count @ int32 0 " decreased count" assert-equal

    local0 ordered-seq-pop false " it failed" assert-equal int32 3 dropn
    int32 -1 " was the dummy item" assert-equal
    local0 ordered-seq-count @ int32 0 " left count at zero" assert-equal
;

: test-ordered-seq-shift
    make-ordered-seq-test

    local0 ordered-seq-shift true " it shifted" assert-equal int32 3 dropn
    int32 20 " was the last item" assert-equal
    local0 ordered-seq-count @ int32 3 " decreased count" assert-equal

    local0 ordered-seq-shift true " it shifted" assert-equal int32 3 dropn
    int32 15 " was the third item" assert-equal
    local0 ordered-seq-count @ int32 2 " decreased count" assert-equal

    local0 ordered-seq-shift true " it shifted" assert-equal int32 3 dropn
    int32 12 " was the second item" assert-equal
    local0 ordered-seq-count @ int32 1 " decreased count" assert-equal

    local0 ordered-seq-shift true " it shifted" assert-equal int32 3 dropn
    int32 10 " was the first item" assert-equal
    local0 ordered-seq-count @ int32 0 " decreased count" assert-equal

    local0 ordered-seq-shift false " it failed" assert-equal int32 3 dropn
    int32 -1 " was the dummy item" assert-equal
    local0 ordered-seq-count @ int32 0 " left count at zero" assert-equal
;

: test-ordered-seq
    test-ordered-seq-add-lt
    test-ordered-seq-add-gt
    test-ordered-seq-index
    test-ordered-seq-add-string
    test-ordered-seq-index-string
    test-ordered-seq-pop
    test-ordered-seq-shift
;
