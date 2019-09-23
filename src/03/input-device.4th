: input-dev-init
    " structure InputDevice
field: ready
field: eos
field: intr-mode
bytes: data 4096
    " eval-string
;

: input-dev-addr int32 $f0004000 return1 ;

: input-dev-ready arg0 return1 ;
: input-dev-intr-mode arg0 literal 8 int-add return1 ;

: input-dev-enter-raw-mode
    literal 6 arg0 input-dev-intr-mode swapdrop poke
;

: input-dev-exit-raw-mode
    literal 5 arg0 input-dev-intr-mode swapdrop poke
;
