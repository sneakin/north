( Unicode encoding and decoding: )

( UTF-8 encodes values less than 0x10FFFF into 1 to 4 bytes:

| # bytes |  # bits | bit layout                          |
|  1 byte |       7 | 0ABBCCDD                            |
|       2 |     5+6 | 110AABBC 10CDDEEF                   |
|       3 |   4+6+6 | 1110AABB 10CCDDEE 10FFGGHH          |
|       4 | 3+6+6+6 | 11110AAB 10BCCDDE 10EFFGGH 10HIIJJK |

See https://www.fileformat.info/info/unicode/utf8.htm )

( todo char-code needs Unicode support as do escaped strings with \u000000. )
( todo tokenizer updated to Unicode )

constant UNICODE-MAX $10FFFF

( UTF-8 byte classifiers: )

: utf8-single? arg0 int32 $7F <= return1 ;
: utf8-second? arg0 int32 $C0 logand int32 $80 equals return1 ;
: utf8-double? arg0 int32 $E0 logand int32 $C0 equals return1 ;
: utf8-triple? arg0 int32 $F0 logand int32 $E0 equals return1 ;
: utf8-quad? arg0 int32 $F8 logand int32 $F0 equals return1 ;

( UTF-32 cells to UTF-8 sequences: )

: utf8-encode-second
    arg0 int32 $3F logand int32 $80 logior
    arg0 int32 6 bsr
    return2
;

: utf32->utf8
    doc( Convert an integer into an UTF-8 byte sequence as cells on the stack. )
    args( int32 ++ bytes... number-bytes )
    arg0 int32 $7F <= IF arg0 int32 1 return2 THEN
    arg0 int32 $7FF <= IF
        arg0 utf8-encode-second
        int32 $C0 logior
        int32 2 int32 3 returnN
    THEN
    arg0 int32 $FFFF <= IF
        arg0
        utf8-encode-second shift drop
        utf8-encode-second shift drop
        int32 $E0 logior
        int32 3 int32 4 returnN
    THEN
    arg0 UNICODE-MAX <= IF
        arg0
        utf8-encode-second shift drop
        utf8-encode-second shift drop
        utf8-encode-second shift drop
        int32 $F0 logior
        int32 4 int32 5 returnN
    THEN
    arg0 .\n .h " invalid UTF-32 code" " argument-error" error
;

( UTF-8 cell sequence to UTF-32mcell: )

: utf8-decode-second
    arg0 int32 $3F logand return1
;

: utf8->utf32
    doc( Convert a UTF-8 cell sequence into an UTF-32 value. )
    args( ptr -- next-ptr int32 )
    ( 0xxxxxxx )
    arg0 peek int32 $7F <= IF
        arg0
        cell+ set-arg0 peek
        return1
    THEN
    ( 10xxxxxx )
    arg0 peek int32 $7F logand
    dup int32 $3F <= IF int32 0 return1 THEN
    ( 110xxxxx )
    arg0 peek int32 $3F logand
    dup int32 $1F <= IF
        int32 6 bsl
        arg0 cell+ swapdrop dup set-arg0
        peek utf8-decode-second swapdrop
        logior
        return1
    THEN
    ( 1110xxxx )
    int32 $1F logand
    dup int32 $0F <= IF
        int32 6 bsl
        arg0 cell+ swapdrop dup set-arg0
        peek utf8-decode-second swapdrop
        logior
        int32 6 bsl
        arg0 cell+ swapdrop dup set-arg0
        peek utf8-decode-second swapdrop
        logior
        return1
    THEN
    ( 11110xxx )
    int32 $0F logand
    int32 6 bsl
    arg0 cell+ swapdrop dup set-arg0
    peek utf8-decode-second swapdrop
    logior
    int32 6 bsl
    arg0 cell+ swapdrop dup set-arg0
    peek utf8-decode-second swapdrop
    logior
    int32 6 bsl
    arg0 cell+ swapdrop dup set-arg0
    peek utf8-decode-second swapdrop
    logior
    return1
;

: utf8-cell->utf32-loop
    args( ptr counter ++ utf32-chars... number )
    arg0 int32 4 < UNLESS arg0 return-locals THEN
    arg1 utf8->utf32
    dup int32 0 equals IF drop2 arg0 return-locals THEN
    swap dup arg1 equals IF drop2 arg0 return-locals THEN
    set-arg1
    arg0 int32 1 int-add set-arg0
    RECURSE
;

: utf8-cell->utf32
    doc( Convert a cell with UTF-8 byte sequence as a value into UTF-32 cells. )
    args( cell ++ characters... number )
    arg0 uint32-bytes-lsb
    here int32 0 utf8-cell->utf32-loop
    dup int32 1 int-add returnN
;

: utf32->utf8-cell
    doc( Convert a UTF-32 value into UTF-8 and pack the bytes into a cell. )
    arg0 utf32->utf8 make-uint32-lsb-n return1
;

( UTF Output: )

: write-utf32-char
    doc( Write a UTF-32 character to the output device as UTF-8 bytes. )
    arg0 utf32->utf8
    DOTIMES[ arg0 int32 2 int-add argn write-byte ]DOTIMES
;

: write-utf32-string-n
    doc( Write N characters from a pointer to a UTF-32 sequence. )
    args( ptr num-chars -- end-ptr 0 )
    arg0 int32 0 > UNLESS return0 THEN
    arg1 peek write-utf32-char
    arg1 cell+ set-arg1 drop
    arg0 int32 1 int-sub set-arg0
    RECURSE
;

: write-utf32-string
    doc( Write a UTF-32 sequence to the output device. )
    arg0 seq-data
    swap seq-length
    swapdrop
    write-utf32-string-n
;

( UTF input: )

: read-utf8
    doc( Read a UTF-8 byte sequence from the input device in as a UTF-32 cell. )
    read-byte
    utf8-second? IF drop RECURSE THEN
    utf8-quad? IF read-byte read-byte rot read-byte swap here utf8->utf32 return1 THEN
    utf8-triple? IF read-byte read-byte rot here utf8->utf32 return1 THEN
    utf8-double? IF read-byte swap here utf8->utf32 return1 THEN
    return1
;

: char-map
    args( offset number )
    arg1
    arg0 int32 8 int-div DOTIMES[
        arg2 arg0 int32 8 int-mul int-add
        write-crnl write-int write-tab
        int32 8 DOTIMES[
            arg2 arg0 int-add
            write-utf32-char write-space
            drop
        ]DOTIMES
    ]DOTIMES
    write-crnl
;

( Fun with the left over bits: )

: color-char-color
    doc( Returns the foreground and background colorsmofba color-char. )
    args( color-char ++ bg fg )
    arg0 UNICODE-MAX
    lognot logand int32 24 bsr
    dup int32 3 bsr int32 $7 logand
    swap int32 $7 logand
    return2
;

: color-char-bold?
    doc( Returns the color-char's bold bit. )
    arg0 int32 30 bsr
    int32 1 logand return1
;

: color-char-char
    doc( Returns the UTF-32 character of a color-char. )
    arg0 UNICODE-MAX
    2dup logand
    return1
;

: write-color-char
    doc( Write a color charmout with formating. )
    arg0 color-char-bold? IF bold ELSE bold-off THEN
    arg0 color-char-color color/2 drop2
    color-char-char write-utf32-char
;

: make-color-char
    args( char fg bg attrs ++ color-char )
    doc( Encodes color and formating attributes in the MSB of UTF-32. )
    arg0 int32 3 logand int32 6 bsl
    arg1 int32 7 logand int32 3 bsl
    logior
    arg2 int32 7 logand logior
    int32 24 bsl
    arg3 UNICODE-MAX logand logior
    return1
;

( Test functions: )

: test-color-char
    int32 char-code N int32 4 int32 2 int32 0 make-color-char write-color-char
    int32 char-code O int32 2 int32 4 int32 1 make-color-char write-color-char
    int32 char-code L int32 3 int32 5 int32 2 make-color-char write-color-char
    int32 char-code A int32 5 int32 3 int32 3 make-color-char write-color-char
    int32 char-code N int32 6 int32 1 int32 4 make-color-char write-color-char
    int32 char-code ' int32 0 int32 7 int32 5 make-color-char write-color-char
    int32 char-code S int32 7 int32 0 int32 6 make-color-char write-color-char
;

: test-utf32
    ( single byte )
    int32 $77 utf32->utf8
    int32 1 " 1 byte" assert-equal drop3
    int32 $77 " $77" assert-equal drop3

    ( pair of bytes )
    int32 $80 utf32->utf8
    int32 2 " 2 bytes" assert-equal drop3
    int32 $C2 " $C2" assert-equal drop3
    int32 $80 " $80" assert-equal drop3

    ( three bytes )
    int32 $FFFF utf32->utf8
    int32 3 " 3 bytes" assert-equal drop3
    int32 $EF " $EF" assert-equal drop3
    int32 $BF " $BF" assert-equal drop3
    int32 $BF " $BF 2" assert-equal drop3

    ( another three )
    int32 $EC1 utf32->utf8
    int32 3 " 3 bytes" assert-equal drop3
    int32 $E0 " $E0" assert-equal drop3
    int32 $BB " $BB" assert-equal drop3
    int32 $81 " $81" assert-equal drop3

    ( near the maximum with four bytes )
    int32 $10000 utf32->utf8
    int32 4 " 4 bytes" assert-equal drop3
    int32 $F0 " $F0" assert-equal drop3
    int32 $90 " $90" assert-equal drop3
    int32 $80 " $80" assert-equal drop3
    int32 $80 " $80" assert-equal drop3
;

: test-utf8
    ( single byte )
    int32 $77 here utf8->utf32
    int32 $77 " is $77" assert-equal drop3
    here cell+2 swapdrop " moved the pointer" assert-equal

    ( two bytes )
    int32 $80 int32 $C2 here utf8->utf32
    int32 $80 " is $80" assert-equal drop3
    here cell+2 swapdrop " moved the pointer 1 cell" assert-equal

    ( three bytes )
    int32 $81 int32 $BB int32 $E0 here utf8->utf32
    int32 $EC1 " is $0EC1" assert-equal drop3
    here int32 3 cell+n rotdrop2 " moved the pointer 3 cells" assert-equal

    ( another three )
    int32 $BF int32 $BF int32 $EF here utf8->utf32
    int32 $FFFF " is $FFFF" assert-equal drop3
    here int32 3 cell+n rotdrop2 " moved the pointer 3 cells" assert-equal

    ( full four )
    int32 $80 int32 $80 int32 $90 int32 $F0 here utf8->utf32
    int32 $10000 " is $10000" assert-equal drop3
    here int32 4 cell+n rotdrop2 " moved the pointer 4 cells" assert-equal
;

: test-utf8-cells
    ( round trip )
    int32 $8888 utf32->utf8-cell
    int32 $88A2E8 " encoded into a single cell" assert-equal drop
    utf8-cell->utf32
    int32 1 " has one char" assert-equal drop3
    int32 $8888 " converts back" assert-equal

    ( fully packed )
    int32 $44556677 utf8-cell->utf32
    int32 4 " has four characters" assert-equal drop3
    int32 $44 " char 1" assert-equal drop3
    int32 $55 " char 2" assert-equal drop3
    int32 $66 " char 3" assert-equal drop3
    int32 $77 " char 4" assert-equal drop3
;

: test-utf
    test-utf32
    test-utf8
    test-utf8-cells
;

