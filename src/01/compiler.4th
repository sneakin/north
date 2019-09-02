: next-param
    next-token dup UNLESS " End of stream" error THEN
    intern-seq
    return1
;

: next-int
    next-token UNLESS " End of stream" error THEN
    number drop
    return1
;
