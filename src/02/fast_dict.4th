global-var dict-index
global-var immediate-index
constant *dict-index-span* 4

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

: dict-entry-copy
    arg1 dict-entry-data arg0 set-dict-entry-data
    arg1 dict-entry-code arg0 set-dict-entry-code
    arg1 dict-entry-args arg0 set-dict-entry-args
    arg1 dict-entry-doc arg0 set-dict-entry-doc
;

: dict-entry-patch
    args( target new storage )
    arg2 dict-entry-data swapdrop
    arg1 dict-entry-data swapdrop
    equals IF return0 THEN
    arg2 arg0 dict-entry-copy
    arg1 arg2 dict-entry-copy
;

: dict-index-lookup
    arg0 dict-index @ btree-find return2
;

: immediate-index-lookup
    arg0 immediate-index @ btree-find return2
;

: dict-lookup-slow
    arg1 arg0 dict-lookup return1
;

: dict-lookup-fast
    args( name dict ++ entry )
    dict-index @ IF
        arg0 dict equals IF
            dict-index @
        ELSE
            arg0 immediate-dict @ equals IF
                immediate-index @
            ELSE
                arg1 arg0 dict-lookup-slow return1
            THEN
        THEN
        arg1 swap btree-find UNLESS int32 0 THEN return1
    ELSE
        arg1 arg0 dict-lookup-slow return1
    THEN
;

: dict-index-patch
    ' dict-lookup ' dict-lookup-fast ' dict-lookup-slow dict-entry-patch
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

: dict-index-dump/1
    args( btree )
    .\n " Tree" .s .\n
    arg0 btree-dump
    .\n " Nodes" .s .\n
    arg0 ' write-dict-entry btree-map
;

: dict-index-dump
    " Immediates" write-heading
    immediate-index @ dict-index-dump/1
    " Words" write-heading
    dict-index @ dict-index-dump/1
;
