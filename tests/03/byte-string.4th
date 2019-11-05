( Test the byte-string conversions. )
: test-byte-string-conversion
  int32 256 dallot-seq
  " Bytes" write-line drop
  " hey there" to-byte-string
  2dup hex memdump drop2 dec
  drop cell+
  local0 int32 256 int32 0 byte-string-to-string/4 rotdrop2
  " Cells" write-line drop
  local0 swap hex memdump drop2 dec
  local0 local1 string-equal write-int write-crnl
;
