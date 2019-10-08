( Frames again: )

: shift-frame-up
    args( offset n -- ... )
    doc( Move the parent frame with N arguments OFFSET cells up the stack adjusting the frame links. )
    ( check that granny doesn't get ran over )
    current-frame parent-frame @
    frame-num-args arg0 <= IF
        " not enough arguments to copy" " shift-frame-error" error
    THEN
    ( copy from here )
    current-frame
    ( copy to offset cells away )
    dup arg1 cell+n rotdrop2
    ( copying parent + N args - here bytes )
    current-frame parent-frame @ frame-args arg0 cell+n rotdrop2
    dup current-frame parent-frame @ parent-frame @ >= IF
        " would overwrite parent frame" " shift-frame-error" error
    THEN
    current-frame int-sub
    ( adjust FP link )
    current-frame parent-frame @ arg1 cell+n rotdrop2
    current-frame parent-frame !
    ( now, let's )
    copydown
    ( update this frame )
    current-frame
    arg1 cell+n rotdrop2 set-current-frame
;

( Stack information )

: stack-depth/1
  stack-top arg0 uint-sub cell/ return1
;

: stack-depth
    args stack-depth/1 return1
;

: write-depth
  arg0 stack-depth/1 write-unsigned-int
;
