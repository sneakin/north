: test-swapdrop
    int32 12 int32 34 swapdrop
    int32 34 " drops the second stack item" assert-equal
;

: test-locals
    " test-locals" .S
    int32 12
    int32 34
    int32 56
    here locals swap int-sub int32 2 cell* swapdrop " here to locals is one less" assert-equal drop3
    ( convenience accessors )
    local0 int32 12 " get local 0" assert-equal drop3
    local1 int32 34 " get local 1" assert-equal drop3
    ( offset from locals )
    locals peek int32 12 " get local 0 from locals" assert-equal drop3
    locals cell- swapdrop peek int32 34 " get local 1 from locals" assert-equal drop3
    locals cell-2 swapdrop peek int32 56 " get local 2 from locals" assert-equal drop3
    ( setters )
    int32 56 store-local0
    local0 int32 56 " set local0" assert-equal drop3
    int32 78 store-local1
    local1 int32 78 " set local1" assert-equal drop3    
;

: test-return2-1
    int32 12 int32 34 return2
;

: test-return2
    " test-return2" .S
    int32 889
    here
    test-return2-1
    local0 int32 889 " returned to this frame" assert-equal drop3
    here local1 swap int-sub int32 3 cell* swapdrop " moved the stack" assert-equal drop3
    int32 34 " returned the first arg" assert-equal drop3
    int32 12 " returned the second arg" assert-equal drop3
;

: test-cont-2
    int32 12 arg0 return2
;

: test-cont-1
    int32 34 ' test-cont-2 cont
;

: test-cont
    " test-cont" .S
    int32 99
    here
    test-cont-1
    local0 int32 99 " returned to this frame" assert-equal drop3
    ( here local1 swap int-sub int32 6 cell* swapdrop " did not clear the stack" assert-equal drop3 )
    int32 34 " returned the first arg" assert-equal drop3
    int32 12 " returned the second arg" assert-equal drop3
;

: test-return-locals-1
    int32 16
    int32 32
    int32 64
    int32 128
    return-locals
;
: test-return-locals
    " return-locals" .S
    test-return-locals-1
    here locals swap int-sub int32 3 cell* swapdrop " moved the stack" assert-equal drop3
    int32 128 " returned 128" assert-equal drop3
    int32 64 " returned 64" assert-equal drop3
    int32 32 " returned 32" assert-equal drop3
    int32 16 " returned 16" assert-equal drop3
;

: test-returnN-1
    int32 16
    int32 32
    int32 64
    int32 128
    int32 4 returnN
;

: test-returnN
    " returnN" .S
    test-returnN-1
    here locals swap int-sub int32 3 cell* swapdrop " moved the stack" assert-equal drop3
    int32 128 " returned 128" assert-equal drop3
    int32 64 " returned 64" assert-equal drop3
    int32 32 " returned 32" assert-equal drop3
    int32 16 " returned 16" assert-equal drop3
;

: test-here
    int32 1234
    here peek int32 1234 " peeks the ToS" assert-equal
;

: test-int-cmp
    int32 -16 int32 5 > int32 0 " is not gt" assert-equal
    int32 -16 int32 5 >= int32 0 " is not gte" assert-equal
    int32 -16 int32 5 < int32 1 " is lt" assert-equal
    int32 -16 int32 5 <= int32 1 " is lte" assert-equal

    int32 16 int32 5 > int32 1 " is gt" assert-equal
    int32 16 int32 5 >= int32 1 " is gte" assert-equal
    int32 16 int32 5 < int32 0 " is not lt" assert-equal
    int32 16 int32 5 <= int32 0 " is not lte" assert-equal

    int32 1 int32 5 > int32 0 " is not gt" assert-equal
    int32 1 int32 5 >= int32 0 " is not gte" assert-equal
    int32 1 int32 5 < int32 1 " is lt" assert-equal
    int32 1 int32 5 <= int32 1 " is lte" assert-equal

    int32 5 int32 5 > int32 0 " is not 5 > 5" assert-equal
    int32 5 int32 5 >= int32 1 " is 5 >= 5" assert-equal
    int32 5 int32 5 < int32 0 " is 5 < 5" assert-equal
    int32 5 int32 5 <= int32 1 " is 5 <= 5" assert-equal
;

: test-uint-cmp
    int32 16 int32 5 uint> int32 1 " is gt" assert-equal
    int32 16 int32 5 uint>= int32 1 " is gte" assert-equal
    int32 16 int32 5 uint< int32 0 " is not lt" assert-equal
    int32 16 int32 5 uint<= int32 0 " is not lte" assert-equal

    int32 1 int32 5 uint> int32 0 " is not gt" assert-equal
    int32 1 int32 5 uint>= int32 0 " is not gte" assert-equal
    int32 1 int32 5 uint< int32 1 " is lt" assert-equal
    int32 1 int32 5 uint<= int32 1 " is lte" assert-equal

    int32 5 int32 5 uint> int32 0 " is not 5 > 5" assert-equal
    int32 5 int32 5 uint>= int32 1 " is 5 >= 5" assert-equal
    int32 5 int32 5 uint< int32 0 " is 5 < 5" assert-equal
    int32 5 int32 5 uint<= int32 1 " is 5 <= 5" assert-equal
;

: test-uint-math
    int32 16 int32 5 uint-div int32 3 " returns the quotient" assert-equal
    int32 12 int32 5 uint-mod int32 2 " returns the remainder" assert-equal
;

: test-char-digit
    int32 4 char-digit int32 char-code 4 " is 4" assert-equal
    int32 9 char-digit int32 char-code 9 " is 9" assert-equal
;

: test-digit-char
    int32 char-code 4 digit-char int32 4 " is 4" assert-equal
    int32 char-code 9 digit-char int32 9 " is 9" assert-equal
;

: test-core
    test-int-cmp
    test-uint-cmp
    test-uint-math
    test-here
    test-swapdrop
    test-return2
    test-locals
    test-cont
    test-returnN
    test-return-locals
    test-char-digit
;