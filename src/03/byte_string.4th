def poke-byte ( value addr )
  arg0 peek int32 $FFFFFF00 logand
  arg1 int32 255 logand logior
  arg0 poke
end

def seq-poke-byte ( v seq n )
  arg2 arg1 arg0 int-add cell+ swapdrop
  poke-byte
end

def peek-byte ( addr )
  arg0 peek
  int32 255 logand return1
end

def seq-peek-byte ( seq n )
  arg1 arg0 int-add cell+ swapdrop
  peek-byte return1
end

( Store each cell of SEQ as a byte in OUT-SEQ for LIMIT bytes. )
def to-byte-string/4 ( out-seq seq limit counter )
  arg2 arg0 seq-peek rotdrop2
  ( arg0 write-int write-space drop write-int write-crnl )
  arg3 arg0 seq-poke-byte drop3
  arg0 int32 1 int-add set-arg0
  arg0 arg1 equals IF arg0 return1 THEN
  RECURSE
end

( Returns a new sequence whose bytes are the clamped values of SEQ's cells. )
def to-byte-string ( seq ++ new-seq num-bytes )
  arg0 seq-length swapdrop
  cell+ cell/ swapdrop dallot-seq swap
  arg0 swap int32 0 to-byte-string/4
  local0 swap return2
end

( Convert an ASCII string starting at FIRST-BYTE-ADDR of LIMIT bytes into a string of cells stored in OUT-SEQ. )
def byte-string-to-string/4 ( first-byte-addr out-seq limit counter )
  ( get src byte )
  arg3 arg0 int-add peek-byte swapdrop
  ( write to dest cell )
  arg2 arg0 seq-poke
  ( loop )
  arg0 int32 1 int-add set-arg0
  arg0 arg1 equals IF arg0 return1 THEN
  RECURSE
end

( Converts NUM-BYTES of the byte string in SEQ into a new string. )
def byte-string-to-string ( seq num-bytes ++ new-seq length )
  arg1 cell+ swapdrop ( seq )
  arg0 ( seq length )
  dup dallot-seq ( seq length out-seq )
  swap ( seq out-seq length )
  int32 0 byte-string-to-string/4
  rotdrop2 return2
end
