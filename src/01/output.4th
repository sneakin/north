: control-code?
    arg0 int32 32 < return1
;

: printable-byte?
    arg0 int32 32 < IF int32 0 return1 THEN
    arg0 int32 127 >= IF int32 0 return1 THEN
    arg0 int32 char-code \\ equals IF int32 0 return1 THEN
    int32 1 return1
;

: write-hex-int
    base peek hex
    arg0 int32 16 < IF int32 char-code 0 write-byte THEN
    arg0 write-int drop
    base poke
;

: escape-code-for
    int32 7 arg0 equals IF int32 char-code a return1 THEN
    int32 char-code \b ( 8 ) arg0 equals IF int32 char-code b return1 THEN
    int32 char-code \f ( $c ) arg0 equals IF int32 char-code f return1 THEN
    int32 char-code \e ( $1b ) arg0 equals IF int32 char-code e return1 THEN
    int32 char-code \v ( $b ) arg0 equals IF int32 char-code v return1 THEN
    int32 char-code \n ( $A ) arg0 equals IF int32 char-code n return1 THEN
    int32 char-code \r ( $D ) arg0 equals IF int32 char-code r return1 THEN
    int32 char-code \t ( 9 ) arg0 equals IF int32 char-code t return1 THEN
    int32 char-code \\ ( $5c ) arg0 equals IF int32 char-code \\ return1 THEN
    int32 char-code \" ( $22 ) arg0 equals IF int32 char-code \" return1 THEN
    int32 0 return1
;

: write-escaped-byte
    arg0
    escape-code-for null? UNLESS
        int32 char-code \\ write-byte
        write-byte
        return0
    THEN
    drop
    printable-byte? IF write-byte return0 THEN
    dup int32 256 < IF
        " \\x" write-string drop
        write-hex-int
        return0
    THEN
    " \\u" write-string drop
    write-hex-int
;

: write-escaped-string-n
  arg1 seq-data swapdrop
  dup
  arg0 cell* swapdrop
  int-add
  swap
  literal write-escaped-string-n-loop jump

  write-escaped-string-n-loop:
  dup peek
  terminator? IF return0 THEN
  write-escaped-byte drop
  cell+ swapdrop
  2dup equals IF return0 THEN
  literal write-escaped-string-n-loop jump
;

: write-escaped-string
    arg0 seq-length write-escaped-string-n
;
