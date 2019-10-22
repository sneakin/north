: frame-size
  int32 2 cell* return1
;

: call-frame-size
    cell-size int32 2 int-mul return1
;

: unshift-call-frame
    arg0
    arg1 set-arg0
    set-arg1
;

: next-code-pointer
    doc( next-op+ but places a call frame on the stack. )
    return-address arg0 cell+n return1-1
;
