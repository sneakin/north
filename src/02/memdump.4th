( Return the lesser argument. )
def min
  arg1 arg0 < IF arg1 return1 THEN
  arg0 return1
end

( Memory dumping: )

def memdump-bytes ( ptr num-bytes )
  arg0 int32 0 > UNLESS return0 THEN
  arg1 peek write-unsigned-int write-space
  drop
  arg0 cell- swapdrop set-arg0
  arg1 cell+ swapdrop set-arg1
  RECURSE
end

def memdump-line ( start-ptr num-bytes )
  arg1 write-unsigned-int write-tab
  arg0 int32 32 min rotdrop2 memdump-bytes
  write-crnl
end

( Dump a region of memory to screen destructively using the arguments. )
def memdump/2 ( start-ptr num-bytes -- start-ptr num-bytes )
  arg0 int32 0 > UNLESS return0 THEN
  arg1 arg0 int32 32 min rotdrop2 memdump-line ( arg1 bytes-to-dump )
  arg0 over int-sub set-arg0
  int-add set-arg1
  RECURSE
end

( Dump a region of memory to screen. )
def memdump ( start-ptr num-bytes )
  arg1 arg0 memdump/2
end

def hexdump ( start-ptr num-bytes )
  hex arg1 arg0 memdump/2 dec
end
