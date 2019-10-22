( todo trace return values: have the return address enter a trace function: copy the frame or have a list / stack )
( todo breakpoints: replace code field with do-breakpoint that starts an eval-loop. Will need a continue function to exit the loop and call the original code word. Combine do-trace and do-breakpoint? )
( todo profiling: count calls, time calls, memory usage )
( todo variable watching )
( todo stepping: manual step & tracing next. )

( todo dict-entry-def? does-def? )

( Stack printing: )

: write-frame
    args( frame )
    doc( Report on and dump the frame. )
    " Parent:" .s arg0 .h
    .\n " Return address:" .s arg0 frame-return-addr .h
    .\n " Arguments:" .s
    arg0 frame-num-args .i .\n
    arg0
    arg0 frame-byte-size
    memdump
;

: write-current-frame
    doc( Write out the current and parent frame dumping their memory. )
    .\n " Current:" write-heading
    current-frame parent-frame @ write-frame
    .\n " Locals:" write-heading
    current-frame write-frame
    .\n
;

: stack-trace/1
    args( frame counter )
    .\n arg0 .i ,tab
    arg1 .h ,tab
    arg1 frame-return-addr peek .h ,tab
    arg1 frame-num-args dup int32 0 >= IF
        .i ,tab
        arg1 parent-frame peek set-arg1
        arg0 int32 1 int-add set-arg0
        RECURSE
    ELSE
        .\n
    THEN
;

: stack-trace
    doc( Print a brief table of call frames. )
    " id\tFrame\tReturn\t# Args" .s
    current-frame int32 0 stack-trace/1
;

( Call tracing: )

global-var *tracing* doc( Controls if trace messages are printed. )

: start-tracing
    doc( Turns tracing on. All traced words will be logged. )
    true *tracing* !
;

: stop-tracing
    doc( Turns tracing off. No logging will be done.)
    false *tracing* !
;

: trace-definition
    doc( Changes a dictionary entry's code to trace a definition. )
    args( dict-entry ++ changed? )
    arg0 dict-entry-code swapdrop
    ' call-data-seq dict-entry-code swapdrop
    equals IF
        ' do-trace dict-entry-code
        arg0 set-dict-entry-code
        true return1
    THEN
    false return1
;

: untrace-definition
    doc( Untraces a dictionary entry reverts a traced definition to a call-data-seq. )
    args( dict-entry ++ changed? )
    arg0 dict-entry-code swapdrop
    ' do-trace dict-entry-code swapdrop
    equals IF
        ' call-data-seq dict-entry-code
        arg0 set-dict-entry-code
        true return1
    THEN
    false return1
;

: trace-op
    doc( Traces a dictionary entry that performs an op. )
    args( dict-entry ++ changed? )
    arg0 dict-entry-data null? IF
        ( store the code in the data field )
        arg0 dict-entry-code
        swap set-dict-entry-data
        ( install our tracer )
        ' do-op-trace dict-entry-code
        arg0 set-dict-entry-code
        true return1
    THEN
    false return1
;

: untrace-op
    doc( Untraces a dictionary entry that performs an op. )
    args( dict-entry ++ changed? )
    arg0 dict-entry-code swapdrop
    ' do-op-trace dict-entry-code swapdrop
    equals IF
        ( move the data field back to the code field )
        dict-entry-data
        swap set-dict-entry-code
        int32 0 arg0 set-dict-entry-data
        true return1
    THEN
    false return1
;

: trace
    doc( Traces a dictionary entry by changing the code and data fields to call `on-trace` or `on-trace-op`. Will error if given anything but a colon definition or assembly op with no dictionary parameter. )
    args( dict-enhry )
    arg0 trace-definition UNLESS
        trace-op UNLESS
            " can not trace" " trace-error" error
        THEN
    THEN
    start-tracing
;

: untrace
    doc( Untrace a dictionary entry by restoring the code and data fields. )
    args( dict-enhry )
    arg0 dict-entry-code swapdrop
    ' do-op-trace dict-entry-code swapdrop local0 equals IF
        arg0 untrace-op
    THEN
    ' do-trace dict-entry-code swapdrop local0 equals IF
        arg0 untrace-definition
    THEN
;

: trace-log
    doc( The message writer for traced dictionary entries. )
    args( entry msg )
    *tracing* @ IF
        stop-tracing
        ( Write the message, the entry's name. )
        .\n dim arg0 .s ,sp
        arg1 dict-entry-name .s .h .\n
        ( a hexdump of the frame. )
        current-frame parent-frame @
        int32 32 hexdump
        color-reset

        start-tracing
    THEN
;

: on-trace
    doc( Called by do-trace op used by traced words. )
    args( dict-entry )
    arg0 " Trace:" trace-log drop2
    ( shift frame up since arg0 is the called functionOB )
    here cell+ swapdrop set-current-frame
    shift
    jump-entry-data
;

: on-trace-op
    doc( Called by do-op-trace op used by traced assembly op words. )
    args( dict-entry )
    arg0 " Trace op:" trace-log drop2    
    ( drop the frame )
    end drop
    ( trace-op put the code in the data slot )
    swap dict-entry-data swapdrop seq-data swapdrop swap
    ( restore eip and ip )
    jump-return
;
