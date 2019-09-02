: dood " dood " write-string ;

: doods
    doc( Print N doods! )
    arg0 DOTIMES[
        dood write-space
    ]DOTIMES
    " !!!" write-line
;

: test-dotimes
    int32 5 doods
;
