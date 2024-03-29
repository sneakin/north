( Storage device status values: )
def storage-status-none int32 0 return1 end
def storage-status-okay int32 1 return1 end
def storage-status-busy int32 4 return1 end

( Storage device struct offsets: )

def storage-dev-status ( dev-addr )
  arg0 return1
end

def storage-dev-command ( dev-addr )
  arg0 int32 4 uint-add return1
end

def storage-dev-offset ( dev-addr )
  arg0 int32 8 uint-add return1
end

def storage-dev-key ( dev-addr )
  arg0 int32 12 uint-add return1
end

def storage-dev-key-size ( dev-addr )
  arg0 int32 16 uint-add return1
end

def storage-dev-data ( dev-addr )
  arg0 int32 20 uint-add return1
end

def storage-dev-size ( dev-addr )
  arg0 int32 24 uint-add return1
end

def storage-dev-out-pointer ( dev-addr )
  arg0 int32 28 uint-add return1
end

def storage-dev-out-size ( dev-addr )
  arg0 int32 32 uint-add return1
end

( Storage device field setters and getters: )

def storage-dev-set-key ( key-seq dev-addr )
  arg1 cell+ swapdrop arg0 storage-dev-key swapdrop poke
  arg1 seq-byte-size swapdrop arg0 storage-dev-key-size swapdrop poke
end

def storage-key-size ( dev-addr )
  arg0 storage-dev-key-size peek return1
end

def storage-out-size ( dev-addr )
  arg0 storage-dev-out-size peek return1
end

def storage-dev-set-data ( data-seq dev-addr )
  arg1 seq-byte-size swapdrop arg0 storage-dev-size swapdrop poke
  arg1 cell+ swapdrop arg0 storage-dev-data swapdrop poke
end

def storage-dev-set-out ( out-seq dev-addr )
  arg1 seq-byte-size swapdrop arg0 storage-dev-out-size swapdrop poke
  arg1 cell+ swapdrop arg0 storage-dev-out-pointer swapdrop poke
end

( Storage operations: )

def storage-dev-reset ( dev-addr )
  int32 3 arg0 storage-dev-command swapdrop poke
end

def storage-dev-enable ( dev-addr )
  int32 1 arg0 storage-dev-command swapdrop poke
end

def storage-read/4 ( dev-addr key-seq out-seq offset ++ status )
  arg0 arg3 storage-dev-offset swapdrop poke
  arg1 arg3 storage-dev-set-data
  arg2 arg3 storage-dev-set-key
  int32 5 arg3 storage-dev-command swapdrop poke
  ( todo wait for interrupt once that's triggered )
  arg3 storage-dev-size swapdrop peek cell/ swapdrop arg1 poke ( update seq size )
  arg3 storage-dev-status peek return1
end

( todo: put the dev-addr as first arg?, most variable nearest top )

def storage-read ( dev-addr key offset ++ new-seq status )
  ( todo allot and copy key )
  int32 1024 dallot-seq
  arg2 arg1 arg0 storage-read/4
  local0 swap return2
end

def storage-read-size ( dev-addr ++ size-reg )
  arg0 storage-dev-size peek return1
end

def storage-write ( dev-addr key-seq out-ptr data-ptr offset ++ status )
  arg0 int32 4 argn storage-dev-offset swapdrop poke
  arg1 int32 4 argn storage-dev-set-out
  arg3 int32 4 argn storage-dev-set-key
  arg2 int32 4 argn storage-dev-set-data
  int32 6 int32 4 argn storage-dev-command swapdrop poke
  int32 4 argn storage-dev-status peek return1
end

def storage-delete ( dev-addr key ++ status )
  int32 0 arg1 storage-dev-out-size swapdrop poke
  arg0 arg1 storage-dev-set-key
  int32 6 arg1 storage-dev-command swapdrop poke
  arg1 storage-dev-status peek return1
end

( Storage device waiting: )

def storage-busy-wait ( dev-addr cycles )
  arg0 int32 1 int-sub set-arg0
  arg0 int32 0 >
  arg1 storage-dev-status peek storage-status-busy equals
  logand IF RECURSE THEN
end

def storage-sleep-wait ( dev-irq dev-addr )
  " IRQ " write-string arg1 write-int write-space drop2
  " Status: " write-string drop
  arg0 storage-dev-status swapdrop peek write-int write-crnl
  arg0 storage-dev-status swapdrop peek storage-status-none equals
  arg0 storage-dev-status swapdrop peek storage-status-busy equals
  logior IF
    arg1 wait-for-interrupt
    ( drop2 RECURSE )
  THEN
  ( todo check device status and keep waiting? )
  ( todo return the device status? )
end

def storage-busy-wait-cycles int32 65335 return1 end

def storage-wait ( dev-irq dev-addr )
  arg1 arg0 storage-sleep-wait
  ( arg0 storage-busy-wait-cycles storage-busy-wait )
end

def storage-wait-for-ok ( dev-irq dev-addr ++ ok? )
  arg1 arg0 storage-wait
  arg0 storage-dev-status peek
  storage-status-busy equals IF int32 0 return1 THEN
  int32 1 return1
end

( IPFS helpers )

( Unpads the data and key to make setting IPFS' config and key values easier. )
def ipfs-put-config ( data key-seq ++ ok )
  zero int32 256 stack-allot store-local0
  ipfs-storage-addr
  arg0 to-byte-string drop swapdrop
  local0
  arg1 to-byte-string drop swapdrop
  int32 0 storage-write
  ipfs-storage storage-wait-for-ok return1
end

( Commands the IPFS storage device to connect to the network. )
def ipfs-connect ( ipfs-passphrase ++ ok )
  arg0 " config:pass" ipfs-put-config IF
    ipfs-storage-addr storage-dev-enable
    ipfs-storage storage-wait-for-ok
    return1
  THEN
  int32 0 return1
end

( Retrieves the IPFS URL from the network and copies it into OUT-SEQ. 1 is
  returned on success. )
def ipfs-get ( out-seq ipfs-url ++ ok )
  ipfs-storage-addr arg0 to-byte-string drop swapdrop arg1 int32 0 storage-read/4
  ipfs-storage storage-wait-for-ok return1
end

( Stores data on the IPFS network. The data's key is copied to KEY-OUT-SEQ.
  On success, 1 is returned. )
def ipfs-put ( data key-out-seq ++ ok )
  ipfs-storage-addr zero arg0 arg1 int32 0 storage-write
  ipfs-storage storage-wait-for-ok return1
end

( HTTP Helpers )

( Performs an HTTP GET request to the URL copying the response body into
  OUT-SEQ and returning 1 on success. )
def http-get ( out-seq url ++ ok )
  http-storage-addr arg0 to-byte-string drop swapdrop arg1 int32 0 storage-read/4
  http-storage storage-wait-for-ok return1
end

( Byte packs the key and reads the value returning 1 on success. )
def storage-get ( out-seq key dev-irq dev-addr ++ ok )
  arg0 arg2 to-byte-string drop swapdrop arg3 int32 0 storage-read/4
  arg1 arg0 storage-wait-for-ok return1
end
