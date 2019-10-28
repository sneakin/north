: test-do-while
    int32 0
    DO
      arg0 int32 1 int-add ,i set-arg0 .\n
      arg0 int32 5 < WHILE
    DONE

    local0 int32 5 " incremented the counter" assert-equal
;

' test-do-while decompile
dict-entry-data 3 seq-peek decompile-seq-by-name