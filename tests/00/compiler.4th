: test-[]
    [ write-ok fexit ]
    locals here int-sub cell-size " return a single value" assert-equal drop3
    seq-length int32 2 " a seq with 2 items" assert-equal drop3
;

: test-colon
    " here
    : test-colon-0 write-ok ;
    here equals" eval-string
;

: test-double-colon-1
    int32 200 return1
;

: test-double-colon
    test-double-colon-1 int32 200 " starts right" assert-equal
    " :: test-double-colon-1 int32 100 return1 ;" load
    test-double-colon-1 int32 100 " redefined a definition." assert-equal
;
