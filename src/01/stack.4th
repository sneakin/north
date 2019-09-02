( Frames: )

: return1-1
    doc( Returns from a frame by replacing an argment with the return value. )
    drop-call-frame set-arg0
;

( Stack information )

: stack-depth
  stack-top args uint-sub cell/ return1
;

: write-depth
  stack-depth write-unsigned-int
;
