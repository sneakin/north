def parent-frame
  ( first field )
  return0
end

def frame-return-address
  arg0 int32 1 cell+n return1-1
end

def frame-eval-address
  arg0 int32 2 cell+n return1-1
end

def arg4
    int32 4
    current-frame parent-frame peek
    frame-argn return1
end

def frame-locals
    arg0 cell- return1-1
end

def return-address
    current-frame parent-frame peek frame-return-address peek
    return1
end

def local1
    current-frame parent-frame peek
    frame-locals cell- swapdrop peek
    return1
end

def store-local1
    arg0
    current-frame parent-frame peek frame-locals cell-
    swapdrop poke
    return-1
end

def copydown
  arg0 cell-size uint< IF return0 THEN
  arg0 arg2 int-add peek
  arg0 arg1 int-add poke
  arg0 cell-size int-sub set-arg0
  RECURSE
end

def dallot-seq
  arg0 cell-size int-mul
  dup cell-size int32 2 int-mul int-add
  dup dallot
  over over int-add terminator swap poke
  arg0 over poke
  set-arg0
  return0
end

def code-segment
  indirect-offset peek return1
end
