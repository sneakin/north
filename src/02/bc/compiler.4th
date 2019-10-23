: compile-def-word
    ( asm words call code )
    ( vars & constants call code )
    ( data literals need to skip value )
    ( definitions call code but need data in eax )
    a-ins int32 0 int32 0 a-load int16,
    arg0 int32,
    a-cs int32 0 a-call int16,
    arg0 dict-entry-code int32,
;

: takes-param?
    arg0 ' literal equals
    arg0 ' int32 equals
    logior
    arg0 ' uint32 equals
    logior
    arg0 ' pointer equals
    logior
    arg0 ' string equals
    logior return1
;

: compile-def-loop
    args( seq counter )
    arg1 seq-length arg0 < IF return0 THEN
    arg0 seq-peek ,h
    takes-param? IF
      int32,
      arg0 int32 1 int-add set-arg0
      arg1 arg0 seq-peek int32,
    ELSE dict-entry? IF compile-def-word THEN
    THEN
    arg0 int32 1 int-add set-arg0
    drop-locals RECURSE
;

: compile-def
    doc( Call threads an indirect thread. )
    args( dictionary-entry ++ assembly-seq )
    start-seq
    arg0 dict-entry-data int32 0 compile-def-loop
    local0 end-seq return1
;
