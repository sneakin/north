( Frame functions: )

: frame-argn
    doc( Return the Nth argument of a frame. )
    args( frame ++ value )
    arg0 frame-args arg1 cell+n peek return1-1
;
