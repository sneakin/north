: test-dropn-args-1
    int32 2 dropn-args
;

: test-dropn-args
    .\n " dropn-args" .S
    int32 1 int32 2 int32 3 test-dropn-args-1
    int32 1 " dropped 2 args" assert-equal
;
