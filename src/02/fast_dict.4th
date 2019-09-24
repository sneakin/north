global-var dict-index
global-var immediate-index
constant *dict-index-span* 5

: dict-index-add
    args( entry btree )
    arg1 arg0 btree-add
;

: dict-reindex-loop
    args( entry index )
    arg1 terminator? IF return0 THEN
    ( write-dict-entry )
    dict-entry-name .S
    arg0 dict-index-add
    arg1 dict-entry-next set-arg1
    drop-locals RECURSE
;

: dict-reindex
    args( dict index )
    arg1 arg0 dict-reindex-loop
;

: dict-index-reset
    *dict-index-span* ' string-cmp ' dict-entry-name make-btree
    dict-index !
    *dict-index-span* ' string-cmp ' dict-entry-name make-btree
    immediate-index !    
;

: dict-index-patch
    ' dict-lookup-slow dict-entry-data swapdrop
    ' dict-lookup dict-entry-data swapdrop
    equals IF return0 THEN
    ' dict-lookup dict-entry-data
    ' dict-lookup-slow set-dict-entry-data
    ' dict-lookup-fast dict-entry-data
    ' dict-lookup set-dict-entry-data
;

: dict-index-init
    dict-index @ UNLESS
        dict-index-reset
        .\n bold " Indexing immediates" .s color-reset
        immediate-dict @ immediate-index @ dict-reindex
        .\n bold " Indexing dictionary" .s color-reset
        dict dict-index @ dict-reindex
        dict-index-patch
    THEN
;

: dict-index-lookup
    arg0 dict-index @ btree-find return2
;

: immediate-index-lookup
    arg0 immediate-index @ btree-find return2
;

: dict-lookup-slow
    arg1 arg0 dict-lookup return2
;

: dict-lookup-fast
    args( name dict ++ entry found? )
    dict-index @ UNLESS arg1 arg0 dict-lookup-slow return2 THEN
    arg0 ' dict equals IF
        dict-index @
    ELSE
        arg0 immediate-dict @ equals IF
            immediate-index @
        ELSE
            arg1 arg0 dict-lookup-slow return2
        THEN
    THEN
    arg1 swap btree-find return2
;
