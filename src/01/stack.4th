( Stack information )

: stack-depth
  stack-top args uint-sub cell/ return1
;

: write-depth
  stack-depth write-unsigned-int
;
