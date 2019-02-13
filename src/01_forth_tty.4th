( TTY Color )

: TTY-ESCAPE literal $30305b1b return1 ;
: TTY-RESET literal $6d000000 return1 ;
: TTY-COLOR-FG literal $30335b1b return1 ;
: TTY-COLOR-BG2 literal $6d30343b return1 ;
: TTY-COLOR-FG2 literal $6d30333b return1 ;

: color-reset
  TTY-ESCAPE write-word
  TTY-RESET write-word 
;

: color-attr
  TTY-ESCAPE
  arg0 literal 24 bsl int-add write-word 
  TTY-RESET write-word 
;

: color
  TTY-COLOR-FG arg0 literal 24 bsl int-add write-word 
  TTY-COLOR-BG2 arg1 literal 16 bsl int-add write-word 
;

: fgcolor
  TTY-ESCAPE arg1 literal 24 bsl int-add write-word 
  TTY-COLOR-FG2 arg0 literal 16 bsl int-add write-word 
;

: bright
  literal 1 color-attr 
;

: dim
  literal 2 color-attr 
;

: black
  literal 8 literal 0 color 
;

: white
  literal 8 literal 7 color 
;

: red
  literal 8 literal 1 color 
;

: green
  literal 8 literal 2 color 
;

: yellow
  literal 8 literal 3 color 
;

: blue
  literal 8 literal 4 color 
;

( Colorize the prompt: )

:: write-ok
  bright green 
  literal $204b4f20 write-word 
  color-reset 
;

:: write-err
  bright red 
  literal $20524520 write-word 
  color-reset 
;

:: prompt
  bright yellow 
  literal $203e0a0d write-word 
  color-reset 
;
