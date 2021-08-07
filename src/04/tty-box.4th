( TTY VT100 box drawing. )

def tty-box-nw char-code l return1 end
def tty-box-ne char-code k return1 end
def tty-box-se char-code j return1 end
def tty-box-sw char-code m return1 end
def tty-box-cross char-code n return1 end
def tty-box-horiz char-code q return1 end
def tty-box-vert char-code x return1 end
def tty-box-wide-vert char-code 0 return1 end
def tty-box-cross-east char-code t return1 end
def tty-box-cross-west char-code u return1 end
def tty-box-cross-north char-code v return1 end
def tty-box-cross-south char-code w return1 end

def tty-box-arrow-left char-code , return1 end
def tty-box-arrow-right char-code + return1 end
def tty-box-arrow-up char-code - return1 end
def tty-box-arrow-down char-code . return1 end

def tty-box-filled-1 char-code a return1 end
def tty-box-filled-2 char-code h return1 end
def tty-box-snowman char-code i return1 end
def tty-box-diamond char-code ` return1 end
def tty-box-degree char-code f return1 end
def tty-box-plusminus char-code g return1 end
def tty-box-lte char-code y return1 end
def tty-box-gte char-code z return1 end
def tty-box-pi char-code z return1 end
def tty-box-notequals char-code { return1 end
def tty-box-pounds char-code | return1 end
def tty-box-dot char-code } return1 end

def tty-box-hbar-0 char-code o return1 end
def tty-box-hbar-1 char-code p return1 end
def tty-box-hbar-2 char-code q return1 end
def tty-box-hbar-3 char-code r return1 end
def tty-box-hbar-4 char-code s return1 end
def tty-box-hbar-5 char-code _ return1 end

( Exercise routines of the above. Lots could be desired. Clipping... )

def write-repeated-byte
    args( times char )
    arg0
    arg1 DOTIMES[ arg2 write-byte ]DOTIMES
end

def tty-box-hline
    doc( Draw a horizontal line. )
    args( length )
    arg0 DOTIMES[ tty-box-horiz write-byte ]DOTIMES
end

def tty-box-vline
    doc( Draw a vertical line. )
    args( height )
    arg0 DOTIMES[
      tty-box-vert write-byte
      int32 1 tty-cursor-left
      tty-cursor-down-1
      drop
    ]DOTIMES
end

( Box drawing by going around with the frame and then filling. )

def tty-box-draw-frame
    args( width height )
    ( top line )
    tty-box-nw write-byte
    arg1 int32 2 int-sub tty-box-hline drop
    tty-box-ne write-byte
    ( left )
    arg1 tty-cursor-left
    tty-cursor-down-1
    arg0 int32 2 int-sub tty-box-vline drop
    ( bottom )
    tty-box-sw write-byte
    arg1 int32 2 int-sub tty-box-hline
    tty-box-se write-byte
    ( right )
    int32 -1 int32 2 arg0 int-sub tty-cursor-move
    arg0 int32 2 int-sub tty-box-vline
    ( home cursor )
    int32 2 arg1 int-sub
    int32 2 arg0 int-sub tty-cursor-move
end

def tty-box-frame
    doc( Draw a box's frame by tracing around from the cursor position. )
    args( width height )
    tty-box-drawing-on
    arg1 arg0 tty-box-draw-frame
    tty-box-drawing-off
end

def tty-box-fill
    args( width height )
    doc( Draws a solid, empty box from the cursor's position. )
    arg1
    arg0 DOTIMES[
    arg2 space write-repeated-byte
    drop tty-cursor-left drop
    tty-cursor-down-1
    ]DOTIMES
    arg0 tty-cursor-up
end

def tty-box
    args( width height )
    doc( Draw a filled box at the current cursor position. Draws the frame first. )
    arg1 arg0 tty-box-frame
    int32 2 int-sub
    swap int32 2 int-sub swap
    tty-box-fill
end

( Box drawing line by line: )

def tty-box-top
    args( width )
    tty-box-nw write-byte
    arg0 int32 2 int-sub tty-box-hline
    tty-box-ne write-byte
end

def tty-box-bottom
    args( width )
    tty-box-sw write-byte
    arg0 int32 2 int-sub tty-box-hline
    tty-box-se write-byte
end

def tty-filled-box-line
    tty-box-vert write-byte
    arg0 int32 2 int-sub space write-repeated-byte
    tty-box-vert write-byte
end

def tty-filled-box-draw
    args( width height )
    ( top bar )
    arg1 tty-box-top
    ( interior lines )
    arg0 int32 2 int-sub DOTIMES[
    arg2 tty-cursor-left
    tty-cursor-down-1
    arg2 tty-filled-box-line
    drop2
    ]DOTIMES
    ( bottom bar)
    arg1 tty-cursor-left
    tty-cursor-down-1
    arg1 tty-box-bottom
    ( home cursor )
    int32 1 arg1 int-sub
    int32 2 arg0 int-sub
    tty-cursor-move
end

def tty-filled-box
    args( width height )
    doc( Draw a filled box at the cursor position. Draws the box line by line. )
    tty-box-drawing-on
    arg1 arg0 tty-filled-box-draw
    tty-box-drawing-off
end

( Manual tests: )

def test-tty-filled-box-rand-draw
    int32 8 rand-n
    int32 8 rand-n
    color/2
    int32 40 rand-n
    int32 14 rand-n
    tty-cursor-to
    int32 40 rand-n
    int32 10 rand-n
    tty-filled-box
end

def test-tty-filled-box-rand/1
    arg0 DOTIMES[ test-tty-filled-box-rand-draw ]DOTIMES
end

def test-tty-filled-box-rand
    doc( Draw random filled boxes. )
    rand-seed @ UNLESS terminator rand-seed ! THEN
    int32 64 test-tty-filled-box-rand/1
end

def test-tty-box-rand-draw
    int32 8 rand-n
    int32 8 rand-n
    color/2
    int32 40 rand-n
    int32 14 rand-n
    tty-cursor-to
    int32 40 rand-n
    int32 10 rand-n
    tty-box
end

def test-tty-box-rand/1
    arg0 DOTIMES[ test-tty-box-rand-draw ]DOTIMES
end

def test-tty-box-rand
    doc( Draw some random boxes. )
    rand-seed @ UNLESS terminator rand-seed ! THEN
    int32 64 test-tty-box-rand/1
end

def test-tty-box
    doc( Draw a box. )
    int32 5 int32 2 color/2
    int32 10 int32 5 tty-cursor-to
    int32 20 int32 5 tty-box
end
