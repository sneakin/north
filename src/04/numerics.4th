: max-int
  arg1 arg0 >= IF arg1 ELSE arg0 THEN
  int32 2 return1-n
;

: min-int
  arg1 arg0 >= IF arg0 ELSE arg1 THEN
  int32 2 return1-n
;

: minmax-int
  arg1 arg0 > IF
    arg0
    arg1 set-arg0
    set-arg1
  THEN
;
