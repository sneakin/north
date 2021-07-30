def input-dev-init
    " structure InputDevice
field: ready
field: eos
field: intr-mode
bytes: data 4096
    " eval-string
end

def input-dev-addr int32 $f0004000 return1 end

def input-dev-ready arg0 return1 end
def input-dev-intr-mode arg0 int32 8 int-add return1 end

def input-dev-enter-raw-mode
    int32 6 arg0 input-dev-intr-mode swapdrop poke
end

def input-dev-exit-raw-mode
    int32 5 arg0 input-dev-intr-mode swapdrop poke
end
