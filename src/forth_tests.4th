: next-param-test-inner
  next-param write-word
  next-param write-word
  next-param write-word
  return0
;

: next-param-test
  next-param-test-inner longify BAM longify BOOM longify POW
  literal 123 constant X
  return1
;

