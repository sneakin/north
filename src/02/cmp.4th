: slot-cmp
    doc( Uses the first argument, a function, to retrieve values from the third and fourth arguments that are then passed to the second argument. )
    args( a b sort-fn key-fn ++ sort-result )
    zero
    arg3 arg0 exec-core-word store-local0
    arg2 arg0 exec-core-word
    local0 over arg1 exec-core-word return1    
;

: key-slot-cmp
    doc( Uses the first argument to get a value from only the third before passing the fourth value as is along with the gotten value to the second function argument. )
    args( key b sort-fn key-fn ++ sort-result )
    arg2 arg0 exec-core-word
    arg3 over arg1 exec-core-word return1    
;

: <=>
    doc( A tri-value comparison of integers. Returns 1 if the ToS is greater than the value below, 0 when equal, and -1 if lesser. )
    args( a b ++ [ -1 | 0 | 1 ] )
    arg1 arg0 equals IF int32 0 return1 THEN
    arg1 arg0 > IF int32 1 return1 THEN
    int32 -1 return1
;

: not-<=>
    doc( `<=>` but reversed. 0 is still equal. )
    args( a b ++ [ -1 | 0 | 1 ] )
    arg1 arg0 <=> negate return1
;

: uint<=>
    doc( `<=>` but for unsigned integers. )
    args( a b ++ [ -1 | 0 | 1 ] )
    arg1 arg0 equals IF int32 0 return1 THEN
    arg1 arg0 uint> IF int32 1 return1 THEN
    int32 -1 return1
;

: not-uint<=>
    doc( `uint<=>` but reversed. 0 is still equal. )
    args( a b ++ [ -1 | 0 | 1 ] )
    arg1 arg0 uint<=> negate return1
;
