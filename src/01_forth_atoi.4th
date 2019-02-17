( Better string to unsigned integer due to looping: )

: base-char-to-int
  ( % is binary )
  arg0 literal 37 equals IF literal 2 return1 THEN
  ( & and # are decimal )
  arg0 literal 38 equals IF literal 10 return1 THEN
  arg0 literal 35 equals IF literal 10 return1 THEN
  ( $ and x are hexadecimal )
  arg0 literal 36 equals IF literal 16 return1 THEN
  arg0 literal 120 equals IF literal 16 return1 THEN
  ( not base char )
  literal 0 return1
;

: number-base-char?
  arg0 base-char-to-int UNLESS false return1 THEN
  true return1
;

( Converts a string pointer with length to an unsigned integer with the supplied base. )
: unsigned-number-base ( ptr-str length base )
  ( locals: base accumulator digit-counter ptr )
  arg0
  zero
  arg1
  arg2
  DO
    arg1 peek ( digit )
    number-base-char? swap
    negative-sign? swap
    rot or
    rotdrop2
    UNLESS
      whitespace? UNLESS
        terminator? IF LEAVE THEN
        digit? UNLESS literal 4 argn literal 10 > UNLESS LEAVE THEN THEN
        digit-char
        arg3 literal 4 argn int-mul
        int-add set-arg3
      THEN
    THEN

    drop
    arg1 cell+ set-arg1 drop
    arg2 literal 1 int-sub dup set-arg2
  WHILE

  local1 local2 not return2
;

( Converts a string to an unsigned integer with the supplied base. )
:: unsigned-number ( str )
  arg0 cell+ dup peek ( str ptr+1 value )
  number-base-char? IF ( str ptr+1 value )
    base-char-to-int swapdrop ( str ptr+1 base )
    rot seq-length swapdrop ( base ptr+1 len )
    literal 1 int-sub ( base ptr+1 len )
    swap cell+ swapdrop rot ( ptr+2 len base )
    unsigned-number-base
    return2
  THEN
  drop swap ( ptr+1 str )
  seq-length swapdrop ( ptr+1 length )
  dup1 peek
  ( todo recurse to the next character )
  negative-sign? swapdrop IF literal 1 int-sub
     swap cell+ swapdrop
     swap
  THEN ( ptr+2 length-1 )
  base peek ( ptr+1 length base )
  unsigned-number-base
  return2
;
