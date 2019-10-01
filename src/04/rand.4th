: bitshift
    arg1 arg0 bslc logior return1
;

: bitroll
    arg1 arg0 bsrc logior return1
;

: rand-xorshift
    doc( An xor, shift random number generator. See https://en.m.wikipedia.org/wiki/Xorshift )
    args( seed ++ result new-seed )
    arg0 int32 13 bsl
    arg0 logxor
    dup int32 17 bsr
    logxor
    dup int32 5 bsl logxor
    dup return2
;

: rand-xorshift-n
    doc( `rand-xorshift` but clamped to the ToS and zero. )
    args( seed max ++ new-seed n )
    arg1 rand-xorshift
    swap arg0 uint-mod
    return2
;

: test-rand-xorshift-n
    int32 123 int32 100 rand-xorshift-n .d
    swap rand-xorshift-n .d
    swap rand-xorshift-n .d
    swap rand-xorshift-n .d
    swap rand-xorshift-n .d
    swap rand-xorshift-n .d
;

: rand-xor-roll
    doc( An xor, bit roll random number generator. Appears to be more periodic than `xorshift`. See https://en.m.wikipedia.org/wiki/Xorshift )
    args( seed ++ result new-seed )
    arg0 int32 13 bitshift
    int32 2 overn logxor
    int32 17 bitroll
    int32 2 overn logxor
    int32 5 bitshift
    int32 2 overn logxor
    dup return2
;

global-var rand-seed doc( The state for `rand`. )

: rand
    doc( Returns a 32 bit random number using the state from `rand-seed` which is updated. )
    rand-seed @ rand-xorshift
    rand-seed !
    return1
;

: randf
    rand u->f
    uint32 -1 u->f
    float-div
    return1
;

: rand-n
    doc( Returns a random number clamped to the argument and 0. )
    args( max -- n )
    rand
    int32 31 arg0 logi int-sub bsr
    arg0 uint-mod return1-1
;

: test-rand-n
    int32 123 rand-seed !
    int32 64 DOTIMES[ int32 1000 rand-n .d ]DOTIMES
;
