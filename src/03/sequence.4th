( Allocates NUM-CELLS on the stack. )
: stack-allot ( num-cells ++ seq )
  terminator
  arg0 cell* swapdrop negate move
  arg0 here
  return-address end jump
;

( Copies NUMBER of CELLS from the SRC to DEST sequence. )
: copy-seq-data ( src dest number )
  arg2 cell+ swapdrop
  arg1 cell+ swapdrop
  arg0 cell* swapdrop
  copy
;

( Copies NUMBER of CELLS from the SRC to DEST sequence and updates DEST size to NUMBER. )
: copy-seq ( src dest number )
  arg2 arg1 arg0 copy-seq-data
  arg0 arg1 poke
;
