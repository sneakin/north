def hey2 int32 0 int32 1 int32 2 int32 3 return2-n end
def hey1 int32 1 int32 3 return1-n end
def hey0 int32 3 return0-n end

def dict-terminator terminator return1 end

def seq->cstring ( src dest length -- )
  ( " seq->cstring" .S arg2 arg0 cell* swapdrop hexdump .\n )
  arg2 arg1 arg0 int32 2 int-add cell* swapdrop copy
  ( arg1 arg0 cell* swapdrop hexdump )
  arg1 arg0 int32 3 return2-n
end

def copy-string
  arg2 arg1 arg0 int32 2 int-add cell* swapdrop copy int32 3 return0-n
end

def string-length
  arg0 seq-length return1-1
end

def string-peek
  arg1 arg0 seq-peek int32 2 return1-n
end

def write-char-seq/2 arg1 arg0 write-string-n int32 2 return0-n end

alias pick overn

def dict-entry-data@ arg0 dict-entry-data return1-1 end
def dict-entry-code@ arg0 dict-entry-code return1-1 end
