( Integer functions: )

: clamp-uint8
    doc( Clamp a cell to the range of 0 to 255. )
    arg0 int32 $FF logand return1-1
;

: uint32-bytes-lsb
    doc( Return a 32 bit number's bytes with the least signifigant byte on top. )
    arg0 int32 24 bsr clamp-uint8
    arg0 int32 16 bsr clamp-uint8
    arg0 int32 8 bsr clamp-uint8
    arg0 clamp-uint8
    int32 4 returnN
;

: uint32-bytes-msb
    doc( Return a 32 bit number's bytes with the most signifigant byte on top. )
    arg0 clamp-uint8
    arg0 int32 8 bsr clamp-uint8
    arg0 int32 16 bsr clamp-uint8
    arg0 int32 24 bsr clamp-uint8
    int32 4 returnN
;

: make-uint32-lsb-n
    doc( Make a 32 bit value from N bytes on the stack. )
    args( ...bytes number ++ uint32 )
    zero
    arg0 DOTIMES[
        arg0 int32 1 int-add current-frame parent-frame peek frame-argn
        arg0 int32 8 int-mul bsl
        arg2 logior set-arg2
    ]DOTIMES
    local0 return1
;
