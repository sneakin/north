: assert-equal
    arg2 arg1 equals IF " ." .s ELSE
        " assertion failed" .s .\n
        arg2 .d arg1 .d .\n
        arg0 " assertion failed" error
    THEN
;

: assert-strings
    arg2 arg1 string-equal IF " ." .s ELSE
        " assertion failed" .s .\n
        arg2 .s arg1 .s .\n
        arg0 " assertion failed" error
    THEN
;

: assert-equal2
    arg3 arg1 arg0 assert-equal
    arg4 arg2 arg0 assert-equal
;

: test-assert
    int32 0 int32 0 " equates" assert-equal
    int32 1 int32 1 " equates" assert-equal
;
