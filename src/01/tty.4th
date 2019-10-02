( TTY Color )

: TTY-ESCAPE-ATTR int32 $30305b1b return1 ;
: TTY-ESCAPE-CSI int32 $00005b1b return1 ;
: TTY-ESCAPE-SGR-END int32 $0000006d return1 ;
: TTY-COLOR-FG int32 $30335b1b return1 ;
: TTY-COLOR-BG int32 $30345b1b return1 ;
: TTY-COLOR-BRIGHT-FG int32 $30395b1b return1 ;
: TTY-COLOR-BRIGHT-BG int32 $30315b1b return1 ;
: TTY-COLOR-BRIGHT-BG2 int32 $6d30 return1 ;
: TTY-COLOR-BG2 int32 $6d30343b return1 ;
: TTY-COLOR-FG2 int32 $6d30333b return1 ;

: color-reset
  int32 $6d305b1b write-word
;

: color/2
  TTY-COLOR-FG arg0 int32 24 bsl int-add write-word 
  TTY-COLOR-BG2 arg1 int32 16 bsl int-add write-word 
;

: fgcolor
    TTY-COLOR-FG arg0 int32 24 bsl int-add write-word
    TTY-ESCAPE-SGR-END write-byte
;

: bright-fgcolor
    TTY-COLOR-BRIGHT-FG arg0 int32 24 bsl int-add write-word
    TTY-ESCAPE-SGR-END write-byte
;

: bgcolor
    TTY-COLOR-BG arg0 int32 24 bsl int-add write-word
    TTY-ESCAPE-SGR-END write-byte
;

: bright-bgcolor
    TTY-COLOR-BRIGHT-BG write-word
    TTY-COLOR-BRIGHT-BG2 arg0 int-add write-word
;

: bold
    longify \e[1m write-word
;

: dim
    longify \e[2m write-word
;

: underline
    longify \e[4m write-word
;

: black
  int32 8 int32 0 color/2 
;

: red
  int32 8 int32 1 color/2 
;

: green
  int32 8 int32 2 color/2 
;

: yellow
  int32 8 int32 3 color/2 
;

: blue
  int32 8 int32 4 color/2 
;

: magenta
  int32 8 int32 5 color/2 
;

: cyan
  int32 8 int32 6 color/2 
;

: white
  int32 8 int32 7 color/2 
;

: tty-default-fg
  int32 8 int32 9 color/2 
;

: write-heading
    doc( Print the argument out underlined, bold, and on its own line. )
    bold underline arg0 write-line color-reset write-crnl
;
