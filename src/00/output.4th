( String output: )

: write-string
  args( seq )
  doc( Write a string to the output device. )
  arg0 seq-data swapdrop

  write-string-loop:
    dup peek
    terminator? IF return0 THEN
    write-byte
    cell+ swapdrop
    literal write-string-loop jump
;

: write-string-n
  args( seq number )
  doc( Write a number of characters from the sequence to the output device. )
  arg0 int32 0 equals IF return0 THEN
  arg1 seq-data swapdrop
  dup
  arg0 cell* swapdrop
  int-add
  swap
  literal write-string-n-loop jump

  write-string-n-loop:
  dup peek
  terminator? IF return0 THEN
  write-byte
  cell+ swapdrop
  2dup equals IF return0 THEN
  literal write-string-n-loop jump
;
  
: write-string-rev
  args( seq )
  doc( Write a string to the output device backwards. )
  arg0
  dup
  dup seq-byte-size int-add
  literal write-string-rev-loop jump

  write-string-rev-loop:
  dup peek write-byte
  cell- swapdrop
  2dup equals IF return0 THEN
  literal write-string-rev-loop jump
;

( Integer output: )

: unsigned-int-to-chars-inner
  args( base negative? number -- base negative? terminator chars... number )
  doc( Convert an unsigned integer value to a sequence of characters on the stack possibly adding a negative sign. )
  arg0 arg2 uint-mod char-digit swapdrop
  arg0 arg2 uint-div dup set-arg0
  IF RECURSE THEN

  arg1 IF negative-sign THEN

  terminator set-arg0
  here current-frame swap uint-sub
  cell/ swapdrop
  return-locals
;

: unsigned-int-to-chars
  args( number ++ base negative? terminator chars... length )
  doc( Convert an unsigned integer value to a sequence of characters on the stack. )
  base peek int32 0 arg0 ' unsigned-int-to-chars-inner cont
;

: int-to-chars
  args( number ++ base negative? terminator chars... length )
  doc( Convert an integer value to a sequence of characters on the stack. )
  base peek
  arg0 int32 0 <
  arg0 abs-int
  ' unsigned-int-to-chars-inner cont
;

: unsigned-int-to-string
    args( uint ++ str-ptr)
    doc( Convert an unsigned integer value to an interned string. )
    arg0 unsigned-int-to-chars
    here seq-length intern-seq
    return1
;

: int-to-string
    args( int ++ str-ptr)
    doc( Convert an integer value to an interned string. )
    arg0 int-to-chars
    here seq-length intern-seq
    return1
;

: write-unsigned-int
  args( uint )
  doc( Write out an unsigned integer. )
  arg0 unsigned-int-to-chars here write-string
;

: write-int
  args( integer )
  doc( Write out an integer. )
  arg0 int-to-chars here write-string
;

( Line output: )

: crnl
  doc( Returns a carriage return and linefeed in a word. )
  int32 $0a0d return1
;

: write-crnl
  doc( Write a CRNL to the output device. )
  crnl write-word 
;

: write-line
  doc( Write a stringmplus a CRNL. )
  args( string )
  arg0 write-string write-crnl
;

: write-line-n
  doc( Write a number of characters from a string followed by a CRNL. )
  args( string number )
  arg1 arg0 write-string-n write-crnl
;

: write-line-ret
  arg0 write-string write-crnl
  int32 0 return1
;

( Common outputs: )

: space
    doc( An ASCII space. )
    int32 $20 return1
;

: write-space
    doc( Writes a space out. )
    space write-byte
;

: write-tab
  doc( Write a TAB out. )
  int32 9 write-byte
;

: write-helo
  doc( Write HELO out. )
  int32 $4f4c4548 write-word 
;
