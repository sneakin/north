( VT100+ TTY control: )

( References:
    http://www.xfree86.org/current/ctlseqs.html
    https://www.gnu.org/software/screen/manual/html_node/Control-Sequences.html
)

def write-bell char-code \b write-byte end

def tty-reset
    " \ec" write-string
end

( Helper functions: )

def write-tty-values/3 ( values n counter -- )
  arg0 arg1 int>= IF int32 3 return0-n THEN
  arg0 cell-size int-mul arg2 peek-off write-int
  arg0 int32 1 int-add set-arg0
  arg0 arg1 int< IF " ;" write-string THEN RECURSE
end

def write-tty-values ( ...values n -- )
  args up-stack arg0 int32 0 write-tty-values/3
  arg0 int32 1 int-add return0-n
end

def tty-basic-escape ( values n suffix prefix -- )
    base peek dec
    " \e" write-string
    arg0 write-string
    arg3 arg2 int32 0 write-tty-values/3
    arg1 write-string
    local0 base poke
end

def tty-basic-escape3
    base peek dec
    " \e[" write-string
    args up-stack int32 3 int32 0 write-tty-values/3
    arg0 write-string
    local0 base poke
end

def tty-basic-escape2
    base peek dec
    " \e[" write-string
    args up-stack int32 2 int32 0 write-tty-values/3
    arg0 write-string
    local0 base poke
end

def tty-basic-escape1
    args( arg code )
    " \e[" write-string
    arg1 write-int
    arg0 write-string
end

def tty-escape-private/1
    arg0 UNLESS longify l return1 THEN
    longify h return1
end

def tty-escape-private!
    arg0 write-string
    arg1 tty-escape-private/1 write-byte
end

( Tabs... )

def tty-tab-set " \eH" write-string end
def tty-tab-clear " \e[g" write-string end
def tty-tab-clear-all " \e[3g" write-string end

( Erasure: )

def tty-erase
    " \e[2J" write-string
end

def tty-erase-all
    " \e[2J" write-string
end

def tty-erase-below
    " \e[0J" write-string
end

def tty-erase-above
    " \e[1J" write-string
end

def tty-erase-line-right
    " \e[0K" write-string
end

def tty-erase-line-left
    " \e[1K" write-string
end

def tty-erase-line
    " \e[2K" write-string
end

( Cursor position procedures: )

def tty-cursor-save
    " \e[s" write-string
end

def tty-cursor-restore
    " \e[u" write-string
end

def tty-cursor-save-attr
    " \e7" write-string
end

def tty-cursor-restore-attr
    " \e8" write-string
end

def tty-cursor-home-bottom
    " \eF" write-string
end

def tty-cursor-to arg0 arg1 " f" tty-basic-escape2 end
def tty-cursor-to-column arg0 " G" tty-basic-escape1 end
def tty-cursor-home int32 0 tty-cursor-to-column end

def tty-cursor-up arg0 " A" tty-basic-escape1 end
def tty-cursor-down arg0 " B" tty-basic-escape1 end
def tty-cursor-right arg0 " C" tty-basic-escape1 end
def tty-cursor-left arg0 " D" tty-basic-escape1 end

def tty-cursor-down-1 " \eD" write-string end
def tty-cursor-up-1 " \eM" write-string end

def tty-cursor-next-line arg0 " E" tty-basic-escape1 end
def tty-cursor-prev-line arg0 " F" tty-basic-escape1 end

def tty-cursor-move
    arg1 negative? IF negate tty-cursor-left ELSE tty-cursor-right THEN
    arg0 negative? IF negate tty-cursor-up ELSE tty-cursor-down THEN
end

def tty-get-cursor
    " \e[6n" write-string
end

def tty-scroll-region-off " \e[r" write-string end
def tty-scroll-region
    args( max-line min-line )
    arg1 arg0 " r" tty-basic-escape2
end

def tty-scroll-up
    " \eM" write-string
end

def tty-scroll-down
    " \eD" write-string
end

( Private escape sequences: )

def tty-linewrap/1 arg0 " \e[7" tty-escape-private! end
def tty-linewrap-on int32 1 tty-linewrap/1 end
def tty-linewrap-off int32 0 tty-linewrap/1 end

def tty-local-echo/1 arg0 " \e[12" tty-escape-private! end
def tty-local-echo-on int32 1 tty-local-echo/1 end
def tty-local-echo-off int32 0 tty-local-echo/1 end

def tty-newline-mode/1 arg0 " \e[20" tty-escape-private! end
def tty-newline-mode int32 1 tty-newline-mode/1 end
def tty-line-feed-mode int32 0 tty-newline-mode/1 end

def tty-show-cursor/1 arg0 " \e[?25" tty-escape-private! end
def tty-show-cursor int32 1 tty-show-cursor/1 end
def tty-hide-cursor int32 0 tty-show-cursor/1 end

def tty-alt-buffer/1 arg0 " \e[?1047" tty-escape-private! end
def tty-alt-buffer int32 1 tty-alt-buffer/1 end
def tty-normal-buffer int32 0 tty-alt-buffer/1 end

def tty-alt-buffer-switch/1 arg0 " \e[?1049" tty-escape-private! end
def tty-alt-buffer-save int32 1 tty-alt-buffer-switch/1 end
def tty-normal-buffer-restore int32 0 tty-alt-buffer-switch/1 end

def tty-alt-cursor-save/1 arg0 " \e[?1048" tty-escape-private! end
def tty-alt-cursor-save int32 1 tty-alt-cursor-save/1 end
def tty-alt-cursor-restore int32 0 tty-alt-cursor-save/1 end

def tty-mouse/1 arg0 " \e[?1000" tty-escape-private! end
def tty-mouse-on int32 1 tty-mouse/1 end
def tty-mouse-off int32 0 tty-mouse/1 end

def tty-bracket-paste/1 arg0 " \e[?2004" tty-escape-private! end
def tty-bracket-paste-on int32 1 tty-bracket-paste/1 end
def tty-bracket-paste-off int32 0 tty-bracket-paste/1 end

( Character attributes: )

def color-attr
    arg0 " m" tty-basic-escape1
end

def color-attr-off
  arg0 int32 20 int-add color-attr
end

def tty-char-reset int32 0 color-attr end
def tty-normal int32 22 color-attr end

constant TTY-ATTN-NORMAL 0
constant TTY-ATTR-BOLD 1
constant TTY-ATTR-DIM 2
constant TTY-ATTR-ITALIC 3
constant TTY-ATTR-UNDERLINE 4
constant TTY-ATTR-BLINK 5
constant TTY-ATTR-BLINK-SLOW 6
constant TTY-ATTR-INVERSE 7
constant TTY-ATTR-INVISIBLE 8
constant TTY-ATTR-STRIKE 9

def bold TTY-ATTR-BOLD color-attr end
def bold-off TTY-ATTR-BOLD color-attr-off end
def dim TTY-ATTR-DIM color-attr end
def italic TTY-ATTR-ITALIC color-attr end
def italic-off TTY-ATTR-ITALIC color-attr-off end
def underline TTY-ATTR-UNDERLINE color-attr end
def underline-off TTY-ATTR-UNDERLINE color-attr-off end
def blink-fast TTY-ATTR-BLINK color-attr end
def blink-off TTY-ATTR-BLINK color-attr-off end
def blink-slow TTY-ATTR-BLINK-SLOW color-attr end
def inverse TTY-ATTR-INVERSE color-attr end
def inverse-off TTY-ATTR-INVERSE color-attr-off end
def invisible TTY-ATTR-INVISIBLE color-attr end
def invisible-off TTY-ATTR-INVISIBLE color-attr-off end
def strike TTY-ATTR-STRIKE color-attr end
def strike-off TTY-ATTR-STRIKE color-attr-off end

def tty-reset-font int32 10 color-attr end

def tty-default-fg arg0 39 " m" tty-basic-escape2 end
def tty-default-bg arg0 49 " m" tty-basic-escape2 end

def tty-rgb ( b g r attr -- )
  arg3 arg2 arg1 2 arg0 here 5 " m" " [" tty-basic-escape
  4 return0-n
end

def tty-fgbg-rgb ( fb fg fr bb bg br -- )
  5 argn 4 argn arg3 2 38 arg2 arg1 arg0 2 48 here 10 " m" " [" tty-basic-escape
  6 return0-n
end

def tty-fg-rgb ( b g r -- )
  arg2 arg1 arg0 38 tty-rgb
  3 return0-n
end

def tty-bg-rgb ( b g r -- )
  arg2 arg1 arg0 48 tty-rgb
  3 return0-n
end

def tty-palette ( index attr -- )
  arg1 5 arg0 " m" tty-basic-escape3
  2 return0-n
end

def tty-fgbg-palette ( fg bg -- )
  arg1 5 38 arg0 5 48 here 6 " m" " [" tty-basic-escape
  2 return0-n
end

def tty-fg-palette ( index -- )
  arg0 38 tty-palette
  1 return0-n
end

def tty-bg-palette ( index -- )
  arg0 48 tty-palette
  1 return0-n
end

( Font selection: )

def tty-font-utf8 " \e%G" write-string end
def tty-font-g0 int32 15 write-byte end
def tty-font-g1 int32 14 write-byte end
def tty-font-g2 " \eN" write-string end
def tty-font-g2-1 " \en" write-string end
def tty-font-g3 " \eO" write-string end
def tty-font-g3-1 " \eo" write-string end

def TTY-FONT-US char-code B return1 end
def TTY-FONT-UK char-code A return1 end
def TTY-FONT-BOX char-code 0 return1 end

def tty-set-g0 " \e(" write-string arg0 write-byte end
def tty-set-g1 " \e)" write-string arg0 write-byte end
def tty-set-g2 " \e*" write-string arg0 write-byte end
def tty-set-g3 " \e+" write-string arg0 write-byte end

def tty-box-drawing-on TTY-FONT-BOX tty-set-g1 tty-font-g1 end
def tty-box-drawing-off tty-font-g0 end

( Window codes: )

def tty-window-deiconify int32 1 " t" tty-basic-escape1 end
def tty-window-iconify int32 2 " t" tty-basic-escape1 end

def tty-window-move int32 3 arg1 arg0 " t" tty-basic-escape3 end
def tty-window-pixel-resize int32 4 arg1 arg0 " t" tty-basic-escape3 end
def tty-window-char-resize int32 8 arg1 arg0 " t" tty-basic-escape3 end

def tty-window-raise int32 5 " t" tty-basic-escape1 end
def tty-window-lower int32 6 " t" tty-basic-escape1 end
def tty-window-refresh int32 7 " t" tty-basic-escape1 end

def tty-window-restore-maximized int32 9 int32 0 " t" tty-basic-escape2 end
def tty-window-maximize int32 9 int32 1 " t" tty-basic-escape2 end

def tty-window-state int32 11 " t" tty-basic-escape1 end
def tty-window-position int32 13 " t" tty-basic-escape1 end
def tty-window-pixel-size int32 14 " t" tty-basic-escape1 end
def tty-window-text-size int32 18 " t" tty-basic-escape1 end
def tty-window-screen-size int32 19 " t" tty-basic-escape1 end
def tty-window-icon-label int32 20 " t" tty-basic-escape1 end
def tty-window-title int32 21 " t" tty-basic-escape1 end
def tty-window-resize-lines arg0 " t" tty-basic-escape1 end

def tty-osc-command
    " \e]" write-string
    arg1 write-unsigned-int
    " ;" write-string
    arg0 write-string
    " \a" write-string
end

def tty-set-window-icon-and-title int32 0 arg0 tty-osc-command end
def tty-set-window-title int32 2 arg0 tty-osc-command end
def tty-set-window-icon-name int32 1 arg0 tty-osc-command end

( Rectangular regions: )

def tty-fill-rect ( right bottom left top char -- )
  ( CSI P c ; P t ; P l ; P b ; P r $ x )
  args int32 5 " $x" " [" tty-basic-escape
  int32 5 return0-n
end

def tty-erase-rect ( right bottom left top -- )
  ( CSI P t ; P l ; P b ; P r $ z )
  args int32 4 " $z" " [" tty-basic-escape
  int32 4 return0-n
end

def tty-chattr-rect ( attr right bottom left top -- )
  ( CSI P t ; P l ; P b ; P r ; P s $ r )
  args int32 5 " $r" " [" tty-basic-escape
  int32 5 return0-n
end

def tty-copy-rect ( dest-page dest-left dest-top src-page src-right src-bottom src-left src-top -- )
  ( CSI P t ; P l ; P b ; P r ; P p ; P t ; P l ; P p $ v )
  args int32 8 " $v" " [" tty-basic-escape
  int32 8 return0-n
end
			
( Bad codes? )

def tty-reversed/1 arg0 " \e[?12" tty-escape-private! end
def tty-reversed-on int32 1 tty-reversed/1 end
def tty-reversed-off int32 0 tty-reversed/1 end

def tty-blinking-cursor/1 arg0 " \e[?12" tty-escape-private! end
def tty-blinking-cursor int32 1 tty-blinking-cursor/1 end
def tty-solid-cursor int32 0 tty-blinking-cursor/1 end

def tty-hi-mouse/1 arg0 " \e[?1001" tty-escape-private! end
def tty-hi-mouse-on int32 1 tty-hi-mouse/1 end
def tty-hi-mouse-off int32 0 tty-hi-mouse/1 end

def tty-mouse-cell-motion/1 arg0 " \e[?1002" tty-escape-private! end
def tty-mouse-cell-motion-on int32 1 tty-mouse-cell-motion/1 end
def tty-mouse-cell-motion-off int32 0 tty-mouse-cell-motion/1 end

def tty-mouse-tracking/1 arg0 " \e[?1003" tty-escape-private! end
def tty-mouse-tracking-on int32 1 tty-mouse-tracking/1 end
def tty-mouse-tracking-off int32 0 tty-mouse-tracking/1 end

def tty-relative/1 arg0 " \e[?6" tty-escape-private! end
def tty-relative int32 1 tty-relative/1 end
def tty-absolute int32 0 tty-relative/1 end

( TTY Input )

constant TTY-READ-EOS 0
constant TTY-READ-BYTE 1
constant TTY-READ-ESCAPE 2
constant TTY-READ-CSI 3
constant TTY-READ-MOUSE 4

def tty-read-byte
    read-byte return1
end

def tty-read-int
    args( digit -- digit next-byte )
    tty-read-byte
    digit? UNLESS return1 THEN
    digit-char swapdrop
    arg0 int32 10 int-mul
    int-add set-arg0
    RECURSE
end

def tty-read-int-seq-loop/3
    args( initial-digit modifier counter ++ digits... num-digits next-byte modifier )
    ( Scanning: [ digit+ ';' ]* digit* char )
    arg0 int32 1 int-add set-arg0
    arg2 tty-read-int
    dup char-code ; equals UNLESS
      arg0 swap arg1 TTY-READ-CSI return-locals
    THEN
    drop
    arg2 IF int32 0 set-arg2 THEN
    RECURSE
end

def tty-read-int-seq
    args( initial-digit modifier ++ digits code modifier )
    arg1 arg0 int32 0
    tty-read-int-seq-loop/3 return-locals
end

def tty-read-mouse-coords
    tty-read-byte
    tty-read-byte int32 32 int-sub
    tty-read-byte int32 32 int-sub
    local0 TTY-READ-MOUSE int32 4 returnN
end

def tty-read-csi
    args( ++ digits code modifier kind-of-escape  )
    tty-read-byte ( here 1 write-line/2 )
    digit? IF
        digit-char swapdrop
        int32 0
        tty-read-int-seq return-locals
    THEN
    dup char-code M equals IF
        tty-read-mouse-coords int32 4 returnN
    THEN
    dup char-code ? equals IF
        int32 0
        swap
        tty-read-int-seq return-locals
    THEN
    int32 0 swap int32 0 TTY-READ-CSI int32 4 returnN
end

def tty-read-escape-seq
    doc( Read a VT100 escape sequence after reading the escape byte.
    Makes a list of integer parameters, number of parameters,
    the final codo, the initial modifier, and  the kind of sequence. )
    ( escape fromats:
    \eA meta keys
    \eOA function keys and numeric keypad
    \e[x;y;z;...A
    \e[?xx;yy;...A

    Summed up as: \e mod? [ digit+ ; ]? code

    )
    args( ++ digit-seq code mod )
    tty-read-byte ( here 1 write-line/2 )
    ( CSI codes: \e[ )
    dup char-code [ equals IF
            drop
            ' tty-read-csi cont
    THEN
    ( Function keys: \e[O \e[N )    
    dup char-code N equals
    over char-code O equals
    logior IF
        int32 0
        tty-read-byte
        roll TTY-READ-ESCAPE int32 4 returnN
    THEN
    ( Just \eX )
    int32 0 swap int32 0 TTY-READ-ESCAPE int32 4 returnN
end

def tty-read
    doc( Read the next byte or escape sequence from the input device. )
    args( ++ ...event-data event-kind )
    tty-read-byte
    escape? IF ' tty-read-escape-seq cont THEN
    TTY-READ-BYTE return2
end

def tty-query2
    tty-enter-raw-mode
    arg0 exec-core-word
    tty-read
    local0 tty-exit-raw-mode drop
    TTY-READ-CSI equals IF
      drop3 return2
    ELSE
      int32 0 int32 0 return2
    THEN
end

def tty-read-cursor
    doc( Query the terminal for the cursor position. )
    args( ++ row col )
    ' tty-get-cursor tty-query2 return2
end

def tty-read-window-position
    ' tty-window-position tty-query2 return2
end

def tty-read-window-pixel-size
    ' tty-window-pixel-size tty-query2 return2
end

def tty-read-window-text-size
    ' tty-window-text-size tty-query2 return2
end

def tty-read-window-screen-size
    ' tty-window-screen-size tty-query2 return2
end

( TTY ReadEval: reader + dictionary word execution by key name: )

def tty-readeval-arrow-name
  char-code D char-code A arg0 in-range? IF
    arg0 char-code A equals
    IF s" <up>" ELSE
      arg0 char-code B equals
      IF s" <down>" ELSE
	arg0 char-code C equals
	IF s" <right>" ELSE
	  arg0 char-code D equals
	  IF s" <left>"
	  ELSE s" <unknown>"
	  THEN
	THEN
      THEN
    THEN
    true int32 3 returnN
  ELSE
    false return1
  THEN
end

def tty-readeval-key-name
    doc( Convert `tty-read` output into a string. Key names are close to Emacs' style names: C- used for control, M- used for alt/meta. )
    args( ...event-data kind output-seq ++ )
    ( todo Function keys & mouse buttons? and a string escape code exception; and device status; cursor position state )
    arg1 TTY-READ-BYTE equals IF
        terminator
        ( Control codes: C-key )
        arg2 control-code? IF
            char-code a int-add int32 1 int-sub
            char-code -
            char-code C
            int32 3
        ELSE
          dup int32 127 equals IF
            char-code ?
            char-code -
            char-code C
            int32 3
          ELSE
            int32 1
          THEN
        THEN
        here arg0 int32 2 pick seq->cstring
        return0
    THEN
    arg1 TTY-READ-ESCAPE equals IF
      ( " escape " .s arg3 .d arg2 .d arg1 .d .\n )
        terminator
        ( Control + Meta codes except escape: M-C-letter )
        arg3 control-code?
        over escape? not swapdrop
        logand IF
            char-code a int-add int32 1 int-sub
            char-code -
            char-code C
            char-code -
            char-code M
            int32 5
        ELSE
            ( Function keys: M-O-letter )
          dup char-code O equals IF
	    int32 4 argn tty-readeval-arrow-name IF
              arg0
	      swap cell-align swapdrop copy-string
              return0
	    ELSE drop
	    THEN

            int32 4 argn
            char-code - shift
            char-code - char-code M
            int32 5
          ELSE ( M-key )
            char-code - char-code M
            int32 3
          THEN
        THEN
        here
        arg0 int32 2 pick seq->cstring
        return0
    THEN
    arg1 TTY-READ-CSI equals IF
      ( " csi " .s arg3 .d arg2 .d arg1 .d .\n )
      ( Arrow keys are named. )
      arg3 tty-readeval-arrow-name IF
        arg0
	swap cell-align swapdrop copy-string
        return0
      THEN
      dup char-code ~ equals IF
	drop
	int32 5 argn char-code a int-add
	char-code k
	int32 2
	here arg0 int32 2 pick seq->cstring
	return0
      THEN
      ( Anything else is the escape sequence minus parameters. )
      terminator arg3 char-code [ char-code \e
      int32 3
      here
      arg0 int32 2 pick seq->cstring
      return0
    THEN
    arg1 TTY-READ-MOUSE equals IF
        terminator char-code M char-code [ char-code \e
        int32 3
        here
        arg0 int32 2 pick seq->cstring
        return0
    THEN
    terminator int32 0 here arg0 int32 2 pick seq->cstring
end

def test-tty-readeval-key-name
    int32 32 stack-allot
    char-code A TTY-READ-BYTE shift tty-readeval-key-name
    int32 16 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 127 TTY-READ-BYTE shift tty-readeval-key-name
    int32 16 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 0 TTY-READ-BYTE shift tty-readeval-key-name
    int32 16 write-line-n hexdump
    .\n
    int32 32 stack-allot
    char-code \r TTY-READ-BYTE shift tty-readeval-key-name
    int32 16 write-line-n hexdump
    .\n
    int32 32 stack-allot
    char-code A TTY-READ-ESCAPE int32 2 pick tty-readeval-key-name
    int32 16 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 0 char-code A int32 0 TTY-READ-CSI int32 4 pick tty-readeval-key-name
    int32 16 write-line-n hexdump
end

def tty-readeval-done!/2
  args( readeval-dict value )
    lit tty-readeval-done arg1 dict-lookup
    dup IF arg0 swap set-dict-entry-data THEN
end

def tty-readeval-done!
  arg0 int32 1 tty-readeval-done!/2
end

def tty-readeval-reset-done!
  arg0 int32 0 tty-readeval-done!/2
end

def tty-readeval-done?
    lit tty-readeval-done arg0 dict-lookup
    dup UNLESS int32 2 return1 THEN
    dict-entry-data@ return1
end

def tty-readeval-on-break
  " on-break" .s .\n
    arg0 tty-readeval-done!
end

def tty-readeval-loop
    args( key-name-buffer on-char on-key dict ) 
    arg0 tty-readeval-done? ( here int32 128 hexdump drop2 ) swapdrop IF return0 THEN
    tty-read
    arg3 tty-readeval-key-name ( dup write-line ) ( write-escaped-string )
    dup string-length int32 1 >= IF
      arg0 dict-lookup ( ...event-data event-kind name dict entry )
    ELSE
      arg0 int32 0
    THEN
    null? IF ( nothing in dictionary )
        drop
        int32 2 pick TTY-READ-BYTE equals IF
          int32 3 pick control-code? swapdrop
          ( try one of the args )
	  IF arg1 ELSE arg2 THEN
	ELSE arg1
	THEN
	null? IF drop arg1 THEN
    THEN
    null? UNLESS 
      ( "  exec " .s write-dict-entry )
      ( todo named events don't need the kind and name )
      ( todo char events only need the name )
      ( todo key events need it all )
      shift drop
      dup arg1 equals UNLESS shift drop THEN
      exec-core-word
    THEN
    drop-locals RECURSE
end

def tty-readeval-start
    tty-enter-raw-mode
    tty-mouse-on
end

def tty-readeval-end
    tty-mouse-off
    tty-exit-raw-mode
    input-reset
end

def tty-readeval
    doc( Read TTY input dispatching to dictionary entries
    whose name matches the input's key name, or to on-char for
    simple byte inputs, and on-key for escaped inputs.
    The default handlers when called receive all of the input
    data whereas dictionary entries only receive the event parameters,
    code, and modifier. )
    args( dict )
    tty-readeval-start
    int32 16 stack-allot
    " on-char" arg0 dict-lookup rotdrop2
    " on-key" arg0 dict-lookup rotdrop2
    arg0
    tty-readeval-reset-done!
    tty-readeval-loop drop
    tty-readeval-end yellow here int32 64 hexdump drop2
end

def tty-make-readeval-default-dict
    doc( Construct the default dictionary that `tty-readeval`  expects. )
    args( dict )
    arg0
    " C-c" aliases> tty-readeval-on-break
    " tty-readeval-loop" aliases> tty-readeval-loop
    " tty-readeval-done" ' variable-peeker dict-entry-code@ int32 0 make-dict/4
    exit-frame
end

( ReadEval test: )

def test-tty-readeval-on-csi
    " on-csi" .s
    arg1 .d arg2 .d arg3 .d .\n
    arg3 int32 0 > IF
        args int32 4 cell+n rotdrop2
        arg3 cell* swapdrop
        hexdump drop2
    THEN
end

def test-tty-readeval-on-escape
    " on-escape" .s
    arg1 .d arg2 .d arg3 .d .\n
end

def test-tty-readeval-on-return
    "  on-return" .s
    arg0 tty-readeval-done!
end

def test-tty-readeval-on-newline
    "  on-newline" .s
    arg0 tty-readeval-done!
end

def test-tty-readeval-on-control
    "  on-control" .s arg1 .d .\n
end

def test-tty-readeval-on-key
    "  on-key" .s arg1 .d arg2 .d arg3 .d
    int32 4 argn .d
    int32 5 argn .d
    int32 6 argn .d
    int32 7 argn .d
    .\n
end

def test-tty-readeval-on-char
  arg1 control-code? IF
    "  on-char control" .s arg1 .d arg2 .d .\n
  ELSE
    "  on-char" .s arg1 .d arg2 .d .\n
  THEN
end

def test-tty-readeval-on-mouse
    "  on-mouse" .s
    arg1 .d arg2 .d arg3 .d .\n
end

def test-tty-readeval-on-up
    "  on-up" .s
    arg1 .d arg2 .d arg3 .d .\n
end

def test-tty-readeval-on-status
    "  on-status" .s
    arg1 .d arg2 .d arg3 .d .\n
end

def test-tty-readeval-on-report-cursor
    " on-report-cursor" .s
    arg1 .d arg2 .d arg3 .d .\n
end

def test-tty-readeval-dict
    dict-terminator
    " \e[c" aliases> test-tty-readeval-on-status
    " <up>" aliases> test-tty-readeval-on-up
    " \e[M" aliases> test-tty-readeval-on-mouse
    " \e[R" aliases> test-tty-readeval-on-report-cursor
    " C" aliases> tty-get-cursor
    " M-O-P" aliases> help
    " <f2>" aliases> help
    " C-l" aliases> tty-reset
    " C-m" aliases> test-tty-readeval-on-return
    " C-j" aliases> test-tty-readeval-on-newline
    " M-\e" aliases> test-tty-readeval-on-newline
    " on-key" aliases> test-tty-readeval-on-key
    " on-char" aliases> test-tty-readeval-on-char
    tty-make-readeval-default-dict
    exit-frame
end

def test-tty-readeval
  test-tty-readeval-dict tty-readeval
end
