( String output: )

: write-string
  arg0 literal 4 int-add

  write-string-loop:
    dup peek dup
    terminator equals IF drop2 return0 THEN
    write-byte
    literal 4 int-add
    literal write-string-loop jump
;

: write-string-n
  arg1 literal 4 int-add
  dup
  arg0 cell* swapdrop
  int-add
  swap
  literal write-string-n-loop jump

  write-string-n-loop:
  dup peek
  dup
  terminator equals IF drop2 return0 THEN
  write-byte
  literal 4 int-add
  2dup equals IF drop2 return0 THEN
  literal write-string-n-loop jump
;
  
: write-string-rev
  arg0
  dup
  dup seq-byte-size int-add
  literal write-string-rev-loop jump

  write-string-rev-loop:
  dup peek write-byte
  literal -4 int-add
  2dup equals IF drop2 return0 THEN
  literal write-string-rev-loop jump
;

( Integer output: )

( Convert an unsigned integer value to a string possibly adding a negative sign. )
: unsigned-int-to-string-inner ( negative? number -- 0 str-ptr )
  arg0 base peek uint-mod char-digit swapdrop
  arg0 base peek uint-div dup set-arg0
  IF RECURSE THEN

  arg1 IF negative-sign THEN

  here
  dup current-frame swap uint-sub
  cell/ swapdrop
  intern return1
;

( Convert an unsigned integer value to a string. )
: unsigned-int-to-string ( number ++ str-ptr )
  literal 0 arg0 unsigned-int-to-string-inner return1
;

( Convert an integer value to a string. )
: int-to-string ( number ++ str-ptr )
  arg0 literal 0 <
  arg0 abs-int
  unsigned-int-to-string-inner return1
;

( Write out an unsigned integer. )
: write-unsigned-int
  arg0 unsigned-int-to-string write-string
;

( Write out an integer. )
: write-int
  arg0 int-to-string write-string
;

( Line output: )

: crnl
  literal $0a0d return1
;

: write-crnl
  crnl write-word 
;

: write-line
  arg0 write-string write-crnl
;

: write-line-n
  arg1 arg0 write-string-n write-crnl
;

: write-line-ret
  arg0 write-string write-crnl
  literal 0 return1
;

( Common outputs: )

: space literal $20 return1 ;
: write-space space write-byte ;

: write-tab
  literal 9 write-byte
;

: write-helo
  literal $4f4c4548 write-word 
;
