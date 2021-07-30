constant RTLD-LAZY 1
constant RTLD-NOW 2
constant RTLD-BINDING-MAASK 3
constant RTLD-NO-LOAD 4
constant RTLD-DEEP-BIND 8

def load-library
    args( library-path ++ library-handle )
    RTLD-LAZY
    arg0 null? UNLESS
      to-byte-string shift drop2
      seq-data swapdrop
    THEN
    cdlopen null? IF arg0 " load-library-error" error THEN
    return1
end

def close-library
    args( library-handle )
    arg0 cdlclose
end

def library-get
    args( symbol library )
    arg1 to-byte-string shift drop2 seq-data swapdrop
    arg0 cdlsym return1
end

def ffi-callers-0
    arg0 int32 0 equals IF ' fficall-op-0-0 return1 THEN
    arg0 int32 1 equals IF ' fficall-op-1-0 return1 THEN
    arg0 int32 2 equals IF ' fficall-op-2-0 return1 THEN
    arg0 int32 3 equals IF ' fficall-op-3-0 return1 THEN
    arg0 int32 4 equals IF ' fficall-op-4-0 return1 THEN
    arg0 int32 5 equals IF ' fficall-op-5-0 return1 THEN
    arg0 int32 6 equals IF ' fficall-op-6-0 return1 THEN
    arg0 int32 7 equals IF ' fficall-op-7-0 return1 THEN
    ' fficall-op-n-0 return1
end

def ffi-callers-1
    arg0 int32 0 equals IF ' fficall-op-0-1 return1 THEN
    arg0 int32 1 equals IF ' fficall-op-1-1 return1 THEN
    arg0 int32 2 equals IF ' fficall-op-2-1 return1 THEN
    arg0 int32 3 equals IF ' fficall-op-3-1 return1 THEN
    arg0 int32 4 equals IF ' fficall-op-4-1 return1 THEN
    arg0 int32 5 equals IF ' fficall-op-5-1 return1 THEN
    arg0 int32 6 equals IF ' fficall-op-6-1 return1 THEN
    arg0 int32 7 equals IF ' fficall-op-7-1 return1 THEN
    ' fficall-op-n-1 return1
end

def ffi-caller-for
    args( num-args returns? ++ code-op )
    arg1 arg0 IF ffi-callers-1 ELSE ffi-callers-0 THEN
    return1
end

def does-ffi
    args( dict-entry fn-ptr num-args returns? )
    arg2 arg3 set-dict-entry-data
    arg1 arg0 ffi-caller-for dict-entry-code arg3 set-dict-entry-code
end

def does-ffi>
    args( library dict-entry : num-args returns? )
    arg0 dict-entry-name arg1 library-get rotdrop2
    null? IF arg0 dict-entry-name " does-ffi-error" error THEN
    next-int next-int does-ffi
end

def with-library>
    args( : library ++ library-handle )
    next-word load-library return1
end

def import>
    doc( Create a new dictionary entry that calls the function of the same name in a dynamic library. )
    args( : library word num-args returns? )
    with-library> create does-ffi>
    drop close-library
end

def import/4
    doc( Change a dictionary entry's code and data to call an imported function from a dynamic library. )
    args( library-name entry arity returns )
    arg3 load-library
    arg2 dict-entry-name swapdrop swap library-get null? IF drop2 " import-error" error THEN
    arg2 swap arg1 arg0 does-ffi
    int32 4 dropn close-library
end

( One day: )
( : test-import-0
    import> libc tcgetattr 2 1
end
)

def test-import-1
    " import> libc.so.6 puts 1 0 next-word hello ,s to-byte-string drop seq-data puts" eval-string
    " import> libc.so.6 tcgetattr 2 1" eval-string return-locals
end
