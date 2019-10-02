( Interrupt handling procedures: )

( todo javascript compiler needs to track a data segment offset for variable pointers )
( variable interrupt-waiting-for int32 0 )
( variable isr-handlers num-interrupts make-array )
global-var isr-handlers
global-var interrupt-waiting-for

constant isr-byte-size 8

: isr-offset ( interrupt ++ offset )
  arg0 isr-byte-size int-mul return1
;

: isr-address ( interrupt ++ address )
  arg0 isr-offset isr-table int-add return1
;

( Sets the ISR for an interrupt using the assembly code in two cells. )
: isr-set ( asm-word1 asm-word0 interrupt )
  arg0 isr-byte-size int-mul isr-table int-add
  dup arg1 swap poke
  cell+ arg2 swap poke
;

( Returns the ISR's two cells of assembly. )
: isr-get ( interrupt ++ asm-word1 asm-word0 )
  arg0 isr-address
  dup peek
  swap cell+ swapdrop peek
  return2
;

: isr-handler-address ( interrupt )
  arg0 cell* isr-handlers int-add return1
;

( Sets the definition the ISR trampoline for the interrupt will call. )
: isr-set-handler ( definition interrupt )
  arg1 arg0 isr-handler-address swapdrop poke
;

( Returns the definition the ISR trampoline will call. )
: isr-get-handler ( interrupt ++ handler )
  arg0 isr-handler-address peek return1
;

( Called by the ISR trampoline to call the actual definition for the
  interrupt. Passes the interrupt number in arg0. )
: isr-call
  int32 4 argn isr-byte-size int-div
  isr-handler-address peek
  dup IF
    exec
    bye ( exit the ISR thread )
  THEN
;

( Sets both the ISR and handler definition while returning the old ISR and handler. )
: isr-install-handler/4 ( asm1 asm0 handler interrupt ++ old-asm1 old-asm0 old-handler)
  ( get isr )
  arg0 isr-get rot
  isr-get-handler swapdrop
  ( install isr )
  arg3 arg2 arg0 isr-set drop3
  ( install handler )
  arg1 arg0 isr-set-handler drop2
  int32 3 returnN
;

( Assembles the ISR code to call the isr-trampoline's code and rti. )
: isr-trampoline-caller
  zero zero zero
  here ' isr-trampoline emit-asm-call
  emit-rti
  local1 local2 return2 
;

( Sets an interrupts handler to the definition and installs the trampoline for the ISR. The old ISR cells and handler are returned. )
: isr-install-handler/2 ( definition interrupt ++ old-asm1 old-asm0 old-handler )
  isr-trampoline-caller arg1 arg0 isr-install-handler/4 int32 3 returnN
;

( Handler that wait-for-interrupt uses. )
: wait-for-interrupt-isr
  ( wake if waiting )
  arg0 interrupt-waiting-for peek int32 1 int-sub equals IF wake THEN
;

( Waits for the interrupt to be triggered by installing an ISR and sleeping.
  The ISR and handler are restored before return. )
: wait-for-interrupt ( interrupt-number )
  ( do not wait if waiting )
  ( interrupt-waiting-for peek IF return0 THEN )
  ( set flag )
  arg0 int32 1 int-add interrupt-waiting-for poke
  ( save interrupt state, install handler, and enable interrupts )
  ' wait-for-interrupt-isr arg0 isr-install-handler/2
  push-status
  ( sleep )
  sleep
  ( restore interrupt previous ISR and handler )
  pop-status
  arg0 isr-install-handler/4
  ( clear the flag )
  int32 0 interrupt-waiting-for poke
;

constant test-isr-x 0

: test-isr-handler
  test-isr-x int32 1 int-add
  ' test-isr-x set-dict-entry-data
;

: test-isr ( interrupt )
  ' test-isr-handler arg0 isr-install-handler/2
;
