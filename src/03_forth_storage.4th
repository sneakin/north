( Storage device status values: )
: storage-status-none literal 0 return1 ;
: storage-status-okay literal 1 return1 ;
: storage-status-busy literal 4 return1 ;

( Storage device struct offsets: )

: storage-dev-status ( dev-addr )
  arg0 return1
;

: storage-dev-command ( dev-addr )
  arg0 literal 4 uint-add return1
;

: storage-dev-offset ( dev-addr )
  arg0 literal 8 uint-add return1
;

: storage-dev-key ( dev-addr )
  arg0 literal 12 uint-add return1
;

: storage-dev-key-size ( dev-addr )
  arg0 literal 16 uint-add return1
;

: storage-dev-data ( dev-addr )
  arg0 literal 20 uint-add return1
;

: storage-dev-size ( dev-addr )
  arg0 literal 24 uint-add return1
;

: storage-dev-out-pointer ( dev-addr )
  arg0 literal 28 uint-add return1
;

: storage-dev-out-size ( dev-addr )
  arg0 literal 32 uint-add return1
;

( Storage device field setters and getters: )

: storage-dev-set-key ( key-seq dev-addr )
  arg1 cell+ swapdrop arg0 storage-dev-key swapdrop poke
  arg1 seq-byte-size swapdrop arg0 storage-dev-key-size swapdrop poke
;

: storage-key-size ( dev-addr )
  arg0 storage-dev-key-size peek return1
;

: storage-out-size ( dev-addr )
  arg0 storage-dev-out-size peek return1
;

: storage-dev-set-data ( data-seq dev-addr )
  arg1 seq-byte-size swapdrop arg0 storage-dev-size swapdrop poke
  arg1 cell+ swapdrop arg0 storage-dev-data swapdrop poke
;

: storage-dev-set-out ( out-seq dev-addr )
  arg1 seq-byte-size swapdrop arg0 storage-dev-out-size swapdrop poke
  arg1 cell+ swapdrop arg0 storage-dev-out-pointer swapdrop poke
;

( Storage operations: )

: storage-dev-reset ( dev-addr )
  literal 3 arg0 storage-dev-command swapdrop poke
;

: storage-dev-enable ( dev-addr )
  literal 1 arg0 storage-dev-command swapdrop poke
;

: storage-read/4 ( dev-addr key-seq out-seq offset ++ status )
  arg0 arg3 storage-dev-offset swapdrop poke
  arg1 arg3 storage-dev-set-data
  arg2 arg3 storage-dev-set-key
  literal 5 arg3 storage-dev-command swapdrop poke
  ( todo wait for interrupt once that's triggered )
  arg3 storage-dev-size swapdrop peek cell/ swapdrop arg1 poke ( update seq size )
  arg3 storage-dev-status peek return1
;

( todo: put the dev-addr as first arg?, most variable nearest top )

: storage-read ( dev-addr key offset ++ new-seq status )
  ( todo allot and copy key )
  literal 1024 dallot
  arg2 arg1 arg0 storage-read/4
  local0 swap return2
;

: storage-read-size ( dev-addr ++ size-reg )
  arg0 storage-dev-size peek return1
;

: storage-write ( dev-addr key-seq out-ptr data-ptr offset ++ status )
  arg0 literal 4 argn storage-dev-offset swapdrop poke
  arg1 literal 4 argn storage-dev-set-out
  arg3 literal 4 argn storage-dev-set-key
  arg2 literal 4 argn storage-dev-set-data
  literal 6 literal 4 argn storage-dev-command swapdrop poke
  literal 4 argn storage-dev-status peek return1
;

: storage-delete ( dev-addr key ++ status )
  literal 0 arg1 storage-dev-out-size swapdrop poke
  arg0 arg1 storage-dev-set-key
  literal 6 arg1 storage-dev-command swapdrop poke
  arg1 storage-dev-status peek return1
;

( Storage device waiting: )

: storage-busy-wait ( dev-addr cycles )
  arg0 literal 1 int-sub set-arg0
  arg0 literal 0 >
  arg1 storage-dev-status peek storage-status-busy equals
  logand IF RECURSE THEN
;

: storage-sleep-wait ( dev-irq dev-addr )
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
;

: storage-busy-wait-cycles literal 65335 return1 ;

: storage-wait ( dev-irq dev-addr )
  arg1 arg0 storage-sleep-wait
  ( arg0 storage-busy-wait-cycles storage-busy-wait )
;

: storage-wait-for-ok ( dev-irq dev-addr ++ ok? )
  arg1 arg0 storage-wait
  arg0 storage-dev-status peek
  storage-status-busy equals IF literal 0 return1 THEN
  literal 1 return1
;

( IPFS helpers )

( Unpads the data and key to make setting IPFS' config and key values easier. )
: ipfs-put-config ( data key-seq ++ ok )
  zero literal 256 stack-allot store-local0
  ipfs-storage-addr
  arg0 to-byte-string drop swapdrop
  local0
  arg1 to-byte-string drop swapdrop
  literal 0 storage-write
  ipfs-storage storage-wait-for-ok return1
;

( Commands the IPFS storage device to connect to the network. )
: ipfs-connect ( ipfs-passphrase ++ ok )
  arg0 " config:pass" ipfs-put-config IF
    ipfs-storage-addr storage-dev-enable
    ipfs-storage storage-wait-for-ok
    return1
  THEN
  literal 0 return1
;

( Retrieves the IPFS URL from the network and copies it into OUT-SEQ. 1 is
  returned on success. )
: ipfs-get ( out-seq ipfs-url ++ ok )
  ipfs-storage-addr arg0 to-byte-string drop swapdrop arg1 literal 0 storage-read/4
  ipfs-storage storage-wait-for-ok return1
;

( Stores data on the IPFS network. The data's key is copied to KEY-OUT-SEQ.
  On success, 1 is returned. )
: ipfs-put ( data key-out-seq ++ ok )
  ipfs-storage-addr zero arg0 arg1 literal 0 storage-write
  ipfs-storage storage-wait-for-ok return1
;

( HTTP Helpers )

( Performs an HTTP GET request to the URL copying the response body into
  OUT-SEQ and returning 1 on success. )
: http-get ( out-seq url ++ ok )
  http-storage-addr arg0 to-byte-string drop swapdrop arg1 literal 0 storage-read/4
  http-storage storage-wait-for-ok return1
;
