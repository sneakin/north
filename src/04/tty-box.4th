( TTY VT100 box drawing. )

: tty-box-nw int32 char-code l return1 ;
: tty-box-ne int32 char-code k return1 ;
: tty-box-se int32 char-code j return1 ;
: tty-box-sw int32 char-code m return1 ;
: tty-box-cross int32 char-code n return1 ;
: tty-box-horiz int32 char-code q return1 ;
: tty-box-vert int32 char-code x return1 ;
: tty-box-wide-vert int32 char-code 0 return1 ;
: tty-box-cross-east int32 char-code t return1 ;
: tty-box-cross-west int32 char-code u return1 ;
: tty-box-cross-north int32 char-code v return1 ;
: tty-box-cross-south int32 char-code w return1 ;

: tty-box-arrow-left int32 char-code , return1 ;
: tty-box-arrow-right int32 char-code + return1 ;
: tty-box-arrow-up int32 char-code - return1 ;
: tty-box-arrow-down int32 char-code . return1 ;

: tty-box-filled-1 int32 char-code a return1 ;
: tty-box-filled-2 int32 char-code h return1 ;
: tty-box-snowman int32 char-code i return1 ;
: tty-box-diamond int32 char-code ` return1 ;
: tty-box-degree int32 char-code f return1 ;
: tty-box-plusminus int32 char-code g return1 ;
: tty-box-lte int32 char-code y return1 ;
: tty-box-gte int32 char-code z return1 ;
: tty-box-pi int32 char-code z return1 ;
: tty-box-notequals int32 char-code { return1 ;
: tty-box-pounds int32 char-code | return1 ;
: tty-box-dot int32 char-code } return1 ;

: tty-box-hbar-0 int32 char-code o return1 ;
: tty-box-hbar-1 int32 char-code p return1 ;
: tty-box-hbar-2 int32 char-code q return1 ;
: tty-box-hbar-3 int32 char-code r return1 ;
: tty-box-hbar-4 int32 char-code s return1 ;
: tty-box-hbar-5 int32 char-code _ return1 ;

( Exercise routines of the above. Lots could be desired. Clipping... )

: negative?
    arg0 int32 0 < IF true ELSE false THEN return1
;

: write-repeated-byte
    args( times char )
    arg0
    arg1 DOTIMES[ arg2 write-byte ]DOTIMES
;

: tty-box-hline
    doc( Draw a horizontal line. )
    args( length )
    arg0 DOTIMES[ tty-box-horiz write-byte ]DOTIMES
;

: tty-box-vline
    doc( Draw a vertical line. )
    args( height )
    arg0 DOTIMES[
      tty-box-vert write-byte
      int32 1 tty-cursor-left
      tty-cursor-down-1
      drop
    ]DOTIMES
;

( Box drawing by going around with the frame and then filling. )

: tty-box-draw-frame
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
;

: tty-box-frame
    doc( Draw a box's frame by tracing around from the cursor position. )
    args( width height )
    tty-box-drawing-on
    arg1 arg0 tty-box-draw-frame
    tty-box-drawing-off
;

: tty-box-fill
    args( width height )
    doc( Draws a solid, empty box from the cursor's position. )
    arg1
    arg0 DOTIMES[
    arg2 space write-repeated-byte
    drop tty-cursor-left drop
    tty-cursor-down-1
    ]DOTIMES
    arg0 tty-cursor-up
;

: tty-box
    args( width height )
    doc( Draw a filled box at the current cursor position. Draws the frame first. )
    arg1 arg0 tty-box-frame
    int32 2 int-sub
    swap int32 2 int-sub swap
    tty-box-fill
;

( Box drawing line by line: )

: tty-box-top
    args( width )
    tty-box-nw write-byte
    arg0 int32 2 int-sub tty-box-hline
    tty-box-ne write-byte
;

: tty-box-bottom
    args( width )
    tty-box-sw write-byte
    arg0 int32 2 int-sub tty-box-hline
    tty-box-se write-byte
;

: tty-filled-box-line
    tty-box-vert write-byte
    arg0 int32 2 int-sub space write-repeated-byte
    tty-box-vert write-byte
;

: tty-filled-box-draw
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
;

: tty-filled-box
    args( width height )
    doc( Draw a filled box at the cursor position. Draws the box line by line. )
    tty-box-drawing-on
    arg1 arg0 tty-filled-box-draw
    tty-box-drawing-off
;

( Manual tests: )

: test-tty-filled-box-rand-draw
    int32 8 rand-n
    int32 8 rand-n
    color/2
    int32 40 rand-n
    int32 14 rand-n
    tty-cursor-to
    int32 40 rand-n
    int32 10 rand-n
    tty-filled-box
;

: test-tty-filled-box-rand/1
    arg0 DOTIMES[ test-tty-filled-box-rand-draw ]DOTIMES
;

: test-tty-filled-box-rand
    doc( Draw random filled boxes. )
    rand-seed @ UNLESS terminator rand-seed ! THEN
    int32 64 test-tty-filled-box-rand/1
;

: test-tty-box-rand-draw
    int32 8 rand-n
    int32 8 rand-n
    color/2
    int32 40 rand-n
    int32 14 rand-n
    tty-cursor-to
    int32 40 rand-n
    int32 10 rand-n
    tty-box
;

: test-tty-box-rand/1
    arg0 DOTIMES[ test-tty-box-rand-draw ]DOTIMES
;

: test-tty-box-rand
    doc( Draw some random boxes. )
    rand-seed @ UNLESS terminator rand-seed ! THEN
    int32 64 test-tty-box-rand/1
;

: test-tty-box
    doc( Draw a box. )
    int32 5 int32 2 color/2
    int32 10 int32 5 tty-cursor-to
    int32 20 int32 5 tty-box
;
