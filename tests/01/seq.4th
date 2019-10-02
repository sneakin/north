: test-sum
    terminator int32 1 int32 2 int32 3 int32 3 here
    ' ,d map-seq drop
    .\n " Sum " .s
    int-sum-seq ,d drop
    .\n " prod " .s
    int-prod-seq ,d write-crnl drop
    terminator int32 11 int32 22 int32 33 int32 44 int32 4 here
    ' ,d map-seq drop
    .\n " Sum " .s
    int-sum-seq ,d drop
    .\n " Prod " .s
    int-prod-seq ,d write-crnl drop
;

: test-seqs-total-size
    terminator int32 11 int32 22 int32 33 int32 3 here
    terminator int32 11 int32 22 int32 33 int32 3 here
    literal 6 overn literal 2 here seqs-total-size ,d

    terminator " hey" " you there" " hey" literal 3 here
    seqs-total-size ,d
;

: test-seqs-append-0
    terminator int32 11 int32 22 int32 33 int32 3 here
    terminator int32 44 int32 55 int32 66 int32 3 here
    literal 6 overn literal 2 here seqs-append return1
;

: test-seqs-append-1
    " how are you?"
    " . "
    "  world"
    " hello"
    literal 4 here seqs-append return1
;
