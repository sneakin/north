def frame-size
  int32 3 cell* return1
end

def call-frame-size
    cell-size int32 3 int-mul return1
end

alias call-seq call-indirect-seq

global-var input-dev-mode

def input-dev-init
    int32 0 input-dev-mode poke
end

def input-dev-addr
  cstdin peek return1  
end

def input-dev-intr-mode
  input-dev-mode
  return1
end

def next-code-pointer
    doc( next-op+ but places a call frame on the stack. )
    arg0
    current-frame frame-eval-address @ set-arg0
    return-address local0 cell+n
    return1
end
