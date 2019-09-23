: rot-call-frame
    ( rot swap => A RA FP X -- A X RA FP ; roll? )
    arg0
    arg1 set-arg0
    arg2 set-arg1
    set-arg2
;

alias swap-return-address swap
    
( Sequence accessors: )

: head-seq
  arg0 peek return1
;

: tail-seq
  arg0 cell+ return1
;

( Sequence iteration: )

: revmap-seq ( ptr count fn )
  arg1 int32 0 <= IF return0 THEN
  arg1 int32 1 int-sub set-arg1
  arg2 arg1 cell* swapdrop int-add peek
  arg0 exec
  RECURSE
;

: revmap-seq ( seq fn )
  arg1 seq-length swap
  cell+ swapdrop swap
  arg0
  revmap-seq
;

: map-seq/4 ( ptr count fn counter )
  arg0 arg2 >= IF return0 THEN
  arg3 arg0 cell* swapdrop int-add peek
  arg1 exec
  arg0 int32 1 int-add set-arg0
  RECURSE
;

: map-seq-n ( ptr count fn )
    arg2 arg1 arg0 int32 0 map-seq/4
;

: map-seq ( seq fn )
  arg1 seq-length swap
  cell+ swapdrop swap
  arg0 int32 0 map-seq/4
;

( Sequence reduction: )

: reduce-seq/4 ( ptr count fn accumulator counter )
  arg0 arg3 >= IF arg1 return1 THEN
  literal 4 argn arg0 cell* swapdrop int-add peek
  arg1 arg2 exec set-arg1
  arg0 int32 1 int-add set-arg0
  RECURSE
;

: reduce-seq-n ( ptr count fn initial )
    arg3 arg2 arg1 arg0 int32 0
    reduce-seq/4 return1
;

: reduce-seq ( seq fn initial )
    arg2 seq-data swap seq-length swapdrop
    arg1 arg0 int32 0 reduce-seq/4
    return1
;

: int-sum-seq
    arg0 ' int-add int32 0 reduce-seq
    return1
;

: int-prod-seq
    arg0 ' int-mul int32 1 reduce-seq
    return1
;

( Sequence writing: )

: write-seq
  arg0 literal write-line-ret map-seq
;

( Sequences of sequences: )

: seqs-total-size-fn
    arg1 seq-length
    arg0 int-add return1
;

: seqs-total-size
    args( sequence ++ total-size )
    arg0 ' seqs-total-size-fn int32 0 reduce-seq
    return1
;

: seqs-append-reducer
    arg1 seq-data swap seq-byte-size swapdrop
    arg0 swap
    copy
    int-add return1
;

: seqs-append
    args( sequence ++ sequence )
    arg0 seqs-total-size swapdrop
    dallot-seq seq-data
    arg0 ' seqs-append-reducer literal 2 overn reduce-seq
    local0 return1
;

: n-seqs-append
    args( ...sequence number ++ sequence )
    args seqs-append return1
;

: seq-append
    arg0 arg1 literal 2 n-seqs-append return1
;

( Zero filling convenience: )

: fill-seq
    arg0 seq-data
    arg0 seq-byte-size swapdrop
    fill
;

: dallot-zeroed-seq
    arg0 dallot-seq
    fill-seq
    return1
;

