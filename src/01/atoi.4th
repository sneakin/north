( Better string to unsigned integer due to looping: )

def base-char-to-int
  ( % is binary )
  arg0 int32 37 equals IF int32 2 return1 THEN
  ( & and # are decimal )
  arg0 int32 38 equals IF int32 10 return1 THEN
  arg0 int32 35 equals IF int32 10 return1 THEN
  ( $ and x are hexadecimal )
  arg0 int32 36 equals IF int32 16 return1 THEN
  arg0 int32 120 equals IF int32 16 return1 THEN
  ( not base char )
  int32 0 return1
end

def number-base-char?
  arg0 base-char-to-int UNLESS false return1 THEN
  true return1
end

( Converts a string pointer with length to an unsigned integer with the supplied base. )
def stage-01:unsigned-number-base ( ptr-str length base )
  ( locals: base accumulator digit-counter ptr )
  arg0
  zero
  arg1
  arg2
  DO
    arg0 peek ( digit )
    number-base-char? swap
    negative-sign? swap
    rot or
    rotdrop2
    UNLESS
      whitespace? UNLESS
        terminator? IF LEAVE THEN
        digit? UNLESS arg3 int32 10 > UNLESS LEAVE THEN THEN
        digit-char
        arg2 arg3 int-mul
        int-add set-arg2
      THEN
    THEN

    drop
    arg0 cell+ set-arg0 drop
    arg1 int32 1 int-sub dup set-arg1
    ( WHILE )
    IF AGAIN THEN
  DONE

  local1 local2 not return2
end

( Converts a string to an unsigned integer with the supplied base. )
def stage-01:unsigned-number ( str )
  arg0 cell+ dup peek ( str ptr+1 value )
  number-base-char? IF ( str ptr+1 value )
    base-char-to-int swapdrop ( str ptr+1 base )
    rot seq-length swapdrop ( base ptr+1 len )
    int32 1 int-sub ( base ptr+1 len )
    swap cell+ swapdrop rot ( ptr+2 len base )
    stage-01:unsigned-number-base
    return2
  THEN
  drop swap ( ptr+1 str )
  seq-length swapdrop ( ptr+1 length )
  over peek
  ( todo recurse to the next character )
  negative-sign? swapdrop IF int32 1 int-sub
     swap cell+ swapdrop
     swap
  THEN ( ptr+2 length-1 )
  base peek ( ptr+1 length base )
  stage-01:unsigned-number-base
  return2
end

( `::` changes the code field before the definition is compiled breaking number parsing, so the entry is patched post definition. )

' unsigned-number ' stage-01:unsigned-number copy-dict-entry drop2
