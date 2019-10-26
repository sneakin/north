: parent-frame
  ( first field )
  return0
;

: frame-return-address
  arg0 int32 1 cell+n return1-1
;

: frame-eval-address
  arg0 int32 2 cell+n return1-1
;

: arg4
    current-frame parent-frame peek
    int32 4 frame-argn return1
;

: frame-locals
    arg0 cell- return1-1
;

: return-address
    current-frame parent-frame peek frame-return-address peek
    return1
;

: local1
    current-frame parent-frame peek
    frame-locals cell- swapdrop peek
    return1
;

: store-local1
    arg0
    current-frame parent-frame peek frame-locals cell-
    swapdrop poke
    return-1
;

: copydown
  arg0 cell-size uint< IF return0 THEN
  arg0 arg2 int-add peek
  arg0 arg1 int-add poke
  arg0 cell-size int-sub set-arg0
  RECURSE
;

: dallot-seq
  arg0 cell-size int-mul
  dup cell-size int32 2 int-mul int-add
  dup dallot
  over over int-add terminator swap poke
  arg0 over poke
  set-arg0
  return0
;

: code-segment
  indirect-offset peek return1
;
