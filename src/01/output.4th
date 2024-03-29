def control-code?
    arg0 int32 32 < return1
end

def printable-byte?
    arg0 int32 32 < IF int32 0 return1 THEN
    arg0 int32 127 >= IF int32 0 return1 THEN
    arg0 char-code \\ equals IF int32 0 return1 THEN
    int32 1 return1
end

def write-hex-int
    base peek hex
    arg0 int32 16 < IF char-code 0 write-byte THEN
    arg0 write-int drop
    base poke
end

def escape-code-for
    int32 7 arg0 equals IF char-code a return1 THEN
    char-code \b ( 8 ) arg0 equals IF char-code b return1 THEN
    char-code \f ( $c ) arg0 equals IF char-code f return1 THEN
    char-code \e ( $1b ) arg0 equals IF char-code e return1 THEN
    char-code \v ( $b ) arg0 equals IF char-code v return1 THEN
    char-code \n ( $A ) arg0 equals IF char-code n return1 THEN
    char-code \r ( $D ) arg0 equals IF char-code r return1 THEN
    char-code \t ( 9 ) arg0 equals IF char-code t return1 THEN
    char-code \\ ( $5c ) arg0 equals IF char-code \\ return1 THEN
    char-code \" ( $22 ) arg0 equals IF char-code \" return1 THEN
    int32 0 return1
end

def write-escaped-byte
    arg0
    escape-code-for null? UNLESS
        char-code \\ write-byte
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
end

def write-escaped-string-n
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
end

def write-escaped-string
    arg0 seq-length write-escaped-string-n
end
