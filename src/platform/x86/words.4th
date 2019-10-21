: frame-size
  int32 3 cell* return1
;

: call-frame-size
    cell-size int32 3 int-mul return1
;

global-var input-dev-mode

: input-dev-init
    int32 0 input-dev-mode poke
;

: input-dev-addr
  cstdin peek return1  
;

: input-dev-intr-mode
  input-dev-mode
  return1
;

: input-dev-enter-raw-mode
  return0
;
