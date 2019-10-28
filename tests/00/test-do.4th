: test-do
    int32 0
    DO
      arg0 ,i int32 1 int-add set-arg0
      arg0 int32 5 >= IF LEAVE THEN
      AGAIN
    DONE

    local0 int32 5 " incremented the counter" assert-equal
;

: test-again
    " : test-again-0
    int32 0
    DO
      arg0 int32 1 int-add set-arg0
      arg0 ,i int32 3 < IF AGAIN THEN
    longify BYE write-word write-crnl
    DONE
    longify WAIT write-word write-crnl
    ;

    write-ok
    ' test-again-0 decompile .\n
    dict-entry-data int32 4 cell+n rotdrop2 peek ,h
    decompile-seq-by-name
    " eval-string
;
