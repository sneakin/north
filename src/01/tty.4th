( TTY Color )

: TTY-ESCAPE int32 $30305b1b return1 ;
: TTY-RESET int32 $0000006d return1 ;
: TTY-COLOR-FG int32 $30335b1b return1 ;
: TTY-COLOR-BG2 int32 $6d30343b return1 ;
: TTY-COLOR-FG2 int32 $6d30333b return1 ;

: color-reset
  TTY-ESCAPE write-word
  TTY-RESET write-byte
;

: color-attr
  TTY-ESCAPE
  arg0 int32 24 bsl int-add write-word 
  TTY-RESET write-word 
;

: color
  TTY-COLOR-FG arg0 int32 24 bsl int-add write-word 
  TTY-COLOR-BG2 arg1 int32 16 bsl int-add write-word 
;

: fgcolor
  TTY-ESCAPE arg1 int32 24 bsl int-add write-word 
  TTY-COLOR-FG2 arg0 int32 16 bsl int-add write-word 
;

: bright
  int32 1 color-attr 
;

: dim
  int32 2 color-attr 
;

: black
  int32 8 int32 0 color 
;

: white
  int32 8 int32 7 color 
;

: red
  int32 8 int32 1 color 
;

: green
  int32 8 int32 2 color 
;

: yellow
  int32 8 int32 3 color 
;

: blue
  int32 8 int32 4 color 
;
