: test-if-f
    arg0 IF int32 10 return1 THEN
    int32 20 return1
;

: test-if
    int32 0 test-if-f .d
    int32 1 test-if-f .d
    " : test-if-f
    arg0 IF int32 10 return1 THEN
    int32 20 return1
    ;
    ' test-if-f decompile
    int32 0 test-if-f .d
    int32 1 test-if-f .d
    " eval-string
;

: test-unless-f
    arg0 UNLESS int32 10 return1 THEN
    int32 20 return1
;

: test-unless
    int32 0 test-unless-f .d
    int32 1 test-unless-f .d
    " : test-unless-f
    arg0 UNLESS int32 10 return1 THEN
    int32 20 return1
    ;
    ' test-unless-f decompile
    int32 0 test-unless-f .d
    int32 1 test-unless-f .d
    " eval-string
;

: test-else-f
    arg0 IF
        arg0 int32 1 int-add
    ELSE
        int32 -1
    THEN
    return1
;
    
: test-else
    int32 0 test-else-f .d
    int32 1 test-else-f .d
  " : test-else-f
      arg0 IF
          arg0 int32 1 int-add
      ELSE
          int32 -1
      THEN
      return1
    ;
    '  test-else-f decompile
    int32 0 test-else-f .d
    int32 1 test-else-f .d
    " eval-string
;
