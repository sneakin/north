: next-param-1
    next-token dup UNLESS " End of stream" error THEN
    intern-seq
    ( POSTPONE next-param swap return2 )
    return1
;

: next-int
    next-token UNLESS " End of stream" error THEN
    number drop
    ( POSTPONE int32 swap return2 )
    return1
;
