alias swap-return-address swap
    
( Sequence accessors: )

def head-seq
  arg0 peek return1
end

def tail-seq
  arg0 cell+ return1
end

( Sequence iteration: )

def revmap-seq ( ptr count fn )
  arg1 int32 0 <= IF return0 THEN
  arg1 int32 1 int-sub set-arg1
  arg2 arg1 cell* swapdrop int-add peek
  arg0 exec-core-word
  RECURSE
end

def revmap-seq ( seq fn )
  arg1 seq-length swap
  cell+ swapdrop swap
  arg0
  revmap-seq
end

def map-seq/4 ( ptr count fn counter )
  arg0 arg2 >= IF return0 THEN
  arg3 arg0 cell* swapdrop int-add peek
  arg1 exec-core-word
  arg0 int32 1 int-add set-arg0
  RECURSE
end

def map-seq-n ( ptr count fn )
    arg2 arg1 arg0 int32 0 map-seq/4
end

def map-seq ( seq fn )
  arg1 seq-length swap
  cell+ swapdrop swap
  arg0 int32 0 map-seq/4
end

( Sequence reduction: )

def reduce-seq/4 ( ptr count fn accumulator counter )
  arg0 arg3 >= IF arg1 return1 THEN
  int32 4 argn arg0 cell* swapdrop int-add peek
  arg1 arg2 exec-core-word set-arg1
  arg0 int32 1 int-add set-arg0
  RECURSE
end

def reduce-seq-n ( ptr count fn initial )
    arg3 arg2 arg1 arg0 int32 0
    reduce-seq/4 return1
end

def reduce-seq ( seq fn initial )
    arg2 seq-data swap seq-length swapdrop
    arg1 arg0 int32 0 reduce-seq/4
    return1
end

def int-sum-seq
    arg0 ' int-add int32 0 reduce-seq
    return1
end

def int-prod-seq
    arg0 ' int-mul int32 1 reduce-seq
    return1
end

( Sequence writing: )

def write-seq
  arg0 literal write-line-ret map-seq
end

( Sequences of sequences: )

def seqs-total-size-fn
    arg1 seq-length
    arg0 int-add return1
end

def seqs-total-size
    args( sequence ++ total-size )
    arg0 ' seqs-total-size-fn int32 0 reduce-seq
    return1
end

def seqs-append-reducer
    arg1 seq-data swap seq-byte-size swapdrop
    arg0 swap
    copy
    int-add return1
end

def seqs-append
    args( sequence ++ sequence )
    arg0 seqs-total-size swapdrop
    dallot-seq seq-data
    arg0 ' seqs-append-reducer int32 2 overn reduce-seq
    local0 return1
end

def n-seqs-append
    args( ...sequence number ++ sequence )
    args seqs-append return1
end

def seq-append
    arg0 arg1 int32 2 n-seqs-append return1
end

( Zero filling convenience: )

def fill-seq
    arg0 seq-data
    arg0 seq-byte-size swapdrop
    fill
end

def dallot-zeroed-seq
    arg0 dallot-seq
    fill-seq
    return1
end

