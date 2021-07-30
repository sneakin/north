( Test a storage device by trying each operation. )
def test-storage-at ( dev-irq dev-addr )
  int32 256 dallot-seq ( data )
  int32 256 dallot-seq ( data key )
  int32 256 dallot-seq ( data key out )
  " motd"
  local1 int32 4 copy-seq
  write-line-n drop2
  ( enable device )
  arg0 storage-dev-enable
  arg1 swap storage-wait drop2
  ( write a value )
  " Blanking: " write-string drop
  arg0 local1 local2 " blanking the value" int32 0 storage-write
  arg1 arg0 storage-wait drop2
  ( write the new key )
  " Key: " write-string drop
  ( arg0 storage-dev-key peek swapdrop )
  " size: " write-string drop
  arg0 storage-read-size write-int write-space
  local2 swap byte-string-to-string write-line-n int32 4 dropn
  int32 64 hex memdump dec drop2
  ( read the value )
  " Reading: " write-string drop
  arg0 local1 local0 int32 0 storage-read/4
  write-int write-space drop
  arg1 arg0 storage-wait drop2
  arg0 storage-read-size write-int write-space drop
  local0 int32 32 write-line-n
  ( overwrite the value )
  " Writing: " write-string drop
  arg0 local1 local2 " 😎 hey there 😺 meow\r\n🤦 and again!" int32 0 storage-write
  arg1 arg0 storage-wait drop2
  ( reread the key size )
  " Key size: " write-string drop
  arg0 storage-read-size write-int write-crnl drop
  ( read the new value )
  " Reread: " write-string drop
  int32 256 local0 poke
  local2 local1 arg0 storage-read-size cell/ rotdrop2 copy-seq
  arg0 local1 local0 int32 0 storage-read/4
  write-int write-space drop
  arg1 arg0 storage-wait drop2
  ( check the size )
  " Size: " write-string drop
  arg0 storage-read-size write-int write-space
  ( print the value )
  local0 swap write-line-n
  ( print the size again )
  arg0 storage-read-size write-int write-crnl drop
  ( delete the item )
  " Delete: " write-string drop
  arg0 local1 storage-delete
  arg1 arg0 storage-wait drop2
  ( try reading it )
  " Read Delete: " write-string drop
  int32 256 local0 poke
  arg0 local1 local0 int32 0 storage-read/4
  write-int write-space drop
  arg1 arg0 storage-wait drop2
  arg0 storage-read-size write-int write-space drop
  local0 int32 32 write-line-n
end

def test-ipfs-key-0 ( a hello world document )
  " Qmf412jQZiuVUtdgnB36FXFX7xg5V6KEbSJ4dpQuhkLyfD" return1
end

def test-ipfs-key-1 " QmTjGStKeri3ET1xFn4kgaJYfstHdw3RwQQzTCZm4fZTk7" return1 end

def test-ipfs-storage
  zero
  int32 256 stack-allot store-local0
  write-int write-crnl
  ( enable device: connect in IPFS' case )
  ipfs-storage-addr storage-dev-enable
  ipfs-storage-irq swap storage-wait drop2
  ( read the file )
  ipfs-storage-addr arg0 to-byte-string drop swapdrop local0 int32 0 storage-read/4
  ( write the status )
  " Status: " write-string drop
  write-int write-crnl drop
  ( wait for the data )
  ipfs-storage storage-wait drop2
  ( dump the data )
  " Status: " write-string drop
  ipfs-storage-addr storage-dev-status peek write-int write-crnl drop
  " Data: " write-string drop
  local0 int32 64 hex memdump dec
  " Size: " write-string drop
  ipfs-storage-addr storage-read-size write-int write-crnl drop2
  local0 return1
end

def test-http-storage
  zero
  int32 4096 stack-allot store-local0
  ( enable device )
  http-storage-addr storage-dev-enable
  http-storage-irq swap storage-wait drop2
  " Ready" write-line drop
  ( read a URL )
  http-storage-addr arg0 to-byte-string drop swapdrop local0 int32 0 storage-read/4
  ( write the status )
  write-int write-crnl drop
  ( wait for the data )
  http-storage storage-wait drop2
  ( dump the data )
  http-storage-addr storage-read-size write-int write-crnl drop2
  http-storage-addr storage-dev-status peek write-int write-crnl drop
  local0 int32 64 hex memdump dec
  local0 return1
end

def test-storage
  " Table storage" write-line
  table-storage-irq table-storage-addr test-storage-at drop2
  " Session storage" write-line
  session-storage-irq session-storage-addr test-storage-at drop2
  " Local storage" write-line
  local-storage-irq local-storage-addr test-storage-at drop2
  " IndexedDB" write-line
  indexed-storage-irq indexed-storage-addr test-storage-at drop2
  " HTTP 0" write-line
  " /" write-line test-http-storage
  " IPFS 0" write-line
  test-ipfs-key-0 write-line test-ipfs-storage
  " IPFS 1" write-line
  test-ipfs-key-1 write-line test-ipfs-storage
  ( todo needs to read the new key when setting )
  ipfs-storage test-storage-at drop2
end
