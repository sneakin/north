( TTY Color )

def TTY-ESCAPE-ATTR int32 $30305b1b return1 end
def TTY-ESCAPE-CSI int32 $00005b1b return1 end
def TTY-ESCAPE-SGR-END int32 $0000006d return1 end
def TTY-COLOR-FG int32 $30335b1b return1 end
def TTY-COLOR-BG int32 $30345b1b return1 end
def TTY-COLOR-BRIGHT-FG int32 $30395b1b return1 end
def TTY-COLOR-BRIGHT-BG int32 $30315b1b return1 end
def TTY-COLOR-BRIGHT-BG2 int32 $6d30 return1 end
def TTY-COLOR-BG2 int32 $6d30343b return1 end
def TTY-COLOR-FG2 int32 $6d30333b return1 end

def color-reset
  int32 $6d305b1b write-word
end

def color/2
  TTY-COLOR-FG arg0 int32 24 bsl int-add write-word 
  TTY-COLOR-BG2 arg1 int32 16 bsl int-add write-word 
end

def fgcolor
    TTY-COLOR-FG arg0 int32 24 bsl int-add write-word
    TTY-ESCAPE-SGR-END write-byte
end

def bright-fgcolor
    TTY-COLOR-BRIGHT-FG arg0 int32 24 bsl int-add write-word
    TTY-ESCAPE-SGR-END write-byte
end

def bgcolor
    TTY-COLOR-BG arg0 int32 24 bsl int-add write-word
    TTY-ESCAPE-SGR-END write-byte
end

def bright-bgcolor
    TTY-COLOR-BRIGHT-BG write-word
    TTY-COLOR-BRIGHT-BG2 arg0 int-add write-word
end

def bold
    longify \e[1m write-word
end

def dim
    longify \e[2m write-word
end

def underline
    longify \e[4m write-word
end

def black
  int32 8 int32 0 color/2 
end

def red
  int32 8 int32 1 color/2 
end

def green
  int32 8 int32 2 color/2 
end

def yellow
  int32 8 int32 3 color/2 
end

def blue
  int32 8 int32 4 color/2 
end

def magenta
  int32 8 int32 5 color/2 
end

def cyan
  int32 8 int32 6 color/2 
end

def white
  int32 8 int32 7 color/2 
end

def tty-default-fg
  int32 8 int32 9 color/2 
end

def write-heading
    doc( Print the argument out underlined, bold, and on its own line. )
    bold underline arg0 write-line color-reset write-crnl
end
