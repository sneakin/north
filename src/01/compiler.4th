: next-param-1
    next-token dup UNLESS " End of stream" error THEN
    intern-seq
    ( POSTPONE next-param swap return2 )
    return1
;
