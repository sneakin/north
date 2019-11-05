: tty-enter-raw-mode
    doc( Switches the input device to raw mode. Returns the previous state of the device. )
    args( ++ prior-state )
    input-dev-addr input-dev-intr-mode peek
    input-reset
    swap input-dev-enter-raw-mode
    swap return1
;

: tty-exit-raw-mode
    doc( Returns the input device to its prior state. )
    args( prior-state )
    arg0 input-dev-addr input-dev-intr-mode swapdrop poke
    input-reset
;
