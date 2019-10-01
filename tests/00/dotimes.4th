: dood " dood " write-string ;

: doods
    doc( Print N doods! )
    arg0 DOTIMES[
        dood write-space
    ]DOTIMES
    " !!!" write-line
;

: test-dotimes-doods
    int32 5 doods
;

: test-dotimes-args
    int32 66
    int32 10 DOTIMES[
    arg0 ,i
    arg1 ,i
    arg2 ,i
    arg3 ,i
    .\n
    ]DOTIMES
;
