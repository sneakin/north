( Return the lesser argument. )
: min
  arg1 arg0 < IF arg1 return1 THEN
  arg0 return1
;

( Memory dumping: )

: memdump-bytes ( ptr num-bytes )
  arg0 int32 0 > UNLESS return0 THEN
  arg1 peek write-unsigned-int write-space
  drop
  arg0 cell- swapdrop set-arg0
  arg1 cell+ swapdrop set-arg1
  RECURSE
;

: memdump-line ( start-ptr num-bytes )
  arg1 write-unsigned-int write-tab
  arg0 int32 32 min rotdrop2 memdump-bytes
  write-crnl
;

( Dump a region of memory to screen destructively using the arguments. )
: memdump/2 ( start-ptr num-bytes -- start-ptr num-bytes )
  arg0 int32 0 > UNLESS return0 THEN
  arg1 arg0 int32 32 min rotdrop2 memdump-line ( arg1 bytes-to-dump )
  arg0 dup1 int-sub set-arg0
  int-add set-arg1
  RECURSE
;

( Dump a region of memory to screen. )
: memdump ( start-ptr num-bytes )
  arg1 arg0 memdump/2
;

: hexdump ( start-ptr num-bytes )
  hex arg1 arg0 memdump/2 dec
;
