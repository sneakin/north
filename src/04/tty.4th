( VT100+ TTY control: )

( References:
    http://www.xfree86.org/current/ctlseqs.html
    https://www.gnu.org/software/screen/manual/html_node/Control-Sequences.html
)

def write-bell int32 char-code \b write-byte end

def tty-reset
    " \ec" write-string
end

( Helper functions: )

def tty-basic-escape3
    base peek dec
    " \e[" write-string
    arg3 write-int
    " ;" write-string
    arg2 write-int
    " ;" write-string
    arg1 write-int
    arg0 write-string
    local0 base poke
end

def tty-basic-escape2
    base peek dec
    " \e[" write-string
    arg2 write-int
    " ;" write-string
    arg1 write-int
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
def tty-cursor-home int32 1 tty-cursor-to-column end

def tty-cursor-up arg0 " A" tty-basic-escape1 end
def tty-cursor-down arg0 " B" tty-basic-escape1 end
def tty-cursor-right arg0 " C" tty-basic-escape1 end
def tty-cursor-left arg0 " D" tty-basic-escape1 end

def tty-cursor-down-1 " \eD" write-string end
def tty-cursor-up-1 " \eM" write-string end

def tty-cursor-next-line arg0 " E" tty-basic-escape1 end
def tty-cursor-prev-line arg0 " F" tty-basic-escape1 end
def tty-cursor-to-col arg0 " G" tty-basic-escape1 end

def tty-cursor-move
    arg1 negative? IF negate tty-cursor-left ELSE tty-cursor-right THEN
    arg0 negative? IF negate tty-cursor-up ELSE tty-cursor-down THEN
end

def tty-get-cursor
    " \e[6n" write-string
end

def tty-scroll-region-off " \e[r" write-string end
def tty-scroll-region
    args( top bottom )
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

def tty-char-reset int32 0 color-attr end
def tty-normal int32 22 color-attr end

def bold int32 1 color-attr end
def bold-off int32 21 color-attr end
def dim int32 2 color-attr end
def italic int32 3 color-attr end
def italic-off int32 23 color-attr end
def underline int32 4 color-attr end
def underline-off int32 24 color-attr end
def blink-fast int32 5 color-attr end
def blink-off int32 25 color-attr end
def blink-slow int32 6 color-attr end
def inverse int32 7 color-attr end
def inverse-off int32 27 color-attr end
def invisible int32 8 color-attr end
def invisible-off int32 28 color-attr end
def strike int32 9 color-attr end
def strike-off int32 29 color-attr end

def tty-reset-font int32 10 color-attr end

( Font selection: )

def tty-font-utf8 " \e%G" write-string end
def tty-font-g0 int32 15 write-byte end
def tty-font-g1 int32 14 write-byte end
def tty-font-g2 " \eN" write-string end
def tty-font-g2-1 " \en" write-string end
def tty-font-g3 " \eO" write-string end
def tty-font-g3-1 " \eo" write-string end

def TTY-FONT-US int32 char-code B return1 end
def TTY-FONT-UK int32 char-code A return1 end
def TTY-FONT-BOX int32 char-code 0 return1 end

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
    dup int32 char-code ; equals UNLESS
      arg0 swap arg1 TTY-READ-CSI return-locals
    THEN
    drop
    arg2 IF int32 0 set-arg2 THEN
    RECURSE
end

def tty-read-int-seq
    args( initial-digit modifier ++ digits code modifier )
    arg1 arg0 int32 0
    ' tty-read-int-seq-loop/3 cont
end

def tty-read-mouse-coords
    tty-read-byte
    tty-read-byte int32 32 int-sub
    tty-read-byte int32 32 int-sub
    local0 TTY-READ-MOUSE int32 4 returnN
end

def tty-read-csi
    args( ++ digits code modifier kind-of-escape  )
    tty-read-byte
    digit? IF
        digit-char swapdrop
        int32 0
        ' tty-read-int-seq cont
    THEN
    dup int32 char-code M equals IF
        ' tty-read-mouse-coords cont
    THEN
    dup int32 char-code ? equals IF
        int32 0
        swap
        ' tty-read-int-seq cont
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
    tty-read-byte
    ( CSI codes: \e[ )
    dup int32 char-code [ equals IF
            drop
            ' tty-read-csi cont
    THEN
    ( Function keys: \e[O \e[N )    
    dup int32 char-code N equals
    over int32 char-code O equals
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

def tty-readeval-key-name
    doc( Convert `tty-read` output into a string. Key names are close to Emacs' style names: C- used for control, M- used for alt/meta. )
    args( ...event-data kind output-seq ++ )
    ( todo Function keys & mouse buttons? and a string escape code exception; and device status; cursor position state )
    arg1 TTY-READ-BYTE equals IF
        terminator
        ( Control codes: C-key )
        arg2 control-code? IF
            int32 char-code a int-add int32 1 int-sub
            int32 char-code -
            int32 char-code C
            int32 3
        ELSE
          dup int32 127 equals IF
            int32 char-code ?
            int32 char-code -
            int32 char-code C
            int32 3
          ELSE
            int32 1
          THEN
        THEN
        here arg0 int32 2 overn copy-seq
        return0
    THEN
    arg1 TTY-READ-ESCAPE equals IF
      ( " escape " .s arg3 .d arg2 .d arg1 .d .\n )
        terminator
        ( Control + Meta codes except escape: M-C-letter )
        arg3 control-code?
        over escape? not swapdrop
        logand IF
            int32 char-code a int-add int32 1 int-sub
            int32 char-code -
            int32 char-code C
            int32 char-code -
            int32 char-code M
            int32 5
        ELSE
            ( Function keys: M-O-letter )
            dup int32 char-code O equals IF
                int32 4 argn
                int32 char-code - shift
                int32 char-code - int32 char-code M
                int32 5
            ELSE ( M-key )
                int32 char-code - int32 char-code M
                int32 3
            THEN
        THEN
        here
        arg0 int32 2 overn copy-seq
        return0
    THEN
    arg1 TTY-READ-CSI equals IF
      ( " csi " .s arg3 .d arg2 .d arg1 .d .\n )
        ( Arrow keys are named. )
        int32 char-code D int32 char-code A arg3 in-range? IF
            dup int32 char-code A equals IF " <up>" THEN
            dup int32 char-code B equals IF " <down>" THEN
            dup int32 char-code C equals IF " <right>" THEN
            dup int32 char-code D equals IF " <left>" THEN
            seq-length arg0 swap copy-seq
            return0
        THEN
        dup int32 char-code ~ equals IF
            drop
            int32 5 argn int32 char-code a int-add
            int32 char-code k
            int32 2
            here arg0 int32 2 overn copy-seq
            return0
        THEN
        ( Anything else is the escape sequence minus parameters. )
        terminator arg3 int32 char-code [ int32 char-code \e
        int32 3
        here
        arg0 int32 2 overn copy-seq
        return0
    THEN
    arg1 TTY-READ-MOUSE equals IF
        terminator int32 char-code M int32 char-code [ int32 char-code \e
        int32 3
        here
        arg0 int32 2 overn copy-seq
        return0
    THEN
    terminator int32 0 here arg0 int32 2 overn copy-seq
end

def test-tty-readeval-key-name
    int32 32 stack-allot
    int32 char-code A TTY-READ-BYTE shift tty-readeval-key-name
    int32 64 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 127 TTY-READ-BYTE shift tty-readeval-key-name
    int32 64 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 0 TTY-READ-BYTE shift tty-readeval-key-name
    int32 64 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 char-code \r TTY-READ-BYTE shift tty-readeval-key-name
    int32 64 write-line-n hexdump
    .\n
    int32 32 stack-allot
    int32 char-code A TTY-READ-ESCAPE int32 2 overn tty-readeval-key-name
    int32 64 hexdump
    .\n
    int32 32 stack-allot
    int32 0 int32 char-code A int32 0 TTY-READ-CSI int32 4 overn tty-readeval-key-name
    int32 64 hexdump
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
    dict-entry-data return1
end

def tty-readeval-on-break
  " on-break" .s .\n
    arg0 tty-readeval-done!
end

def tty-readeval-loop
    args( key-name-buffer on-char on-key dict ) 
    arg0 tty-readeval-done? swapdrop IF return0 THEN
    tty-read
    arg3 tty-readeval-key-name ( write-escaped-string )
    seq-length int32 1 > IF
      arg0 dict-lookup ( ...event-data event-kind name dict entry )
    ELSE
      arg0 int32 0
    THEN
    null? IF ( nothing in dictionary )
        drop
        int32 2 overn TTY-READ-BYTE equals
        ( try one of the args )
        IF arg2 ELSE arg1 THEN
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
    int32 8 stack-allot
    " on-char" arg0 dict-lookup rotdrop2
    " on-key" arg0 dict-lookup rotdrop2
    arg0
    tty-readeval-reset-done!
    tty-readeval-loop drop
    tty-readeval-end
end

def tty-make-readeval-default-dict
    doc( Construct the default dictionary that `tty-readeval`  expects. )
    args( dict )
    arg0
    " C-c" aliases> tty-readeval-on-break
    " tty-readeval-loop" aliases> tty-readeval-loop
    " tty-readeval-done" ' variable-peeker dict-entry-code swapdrop int32 0 make-dict/4
    return1
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
    terminator
    " \e[c" aliases> test-tty-readeval-on-status
    " <up>" aliases> test-tty-readeval-on-up
    " \e[M" aliases> test-tty-readeval-on-mouse
    " \e[R" aliases> test-tty-readeval-on-report-cursor
    " C" aliases> tty-get-cursor
    " M-O-P" aliases> help
    " C-l" aliases> tty-reset
    " C-m" aliases> test-tty-readeval-on-return
    " C-j" aliases> test-tty-readeval-on-newline
    " M-\e" aliases> test-tty-readeval-on-newline
    " on-key" aliases> test-tty-readeval-on-key
    " on-char" aliases> test-tty-readeval-on-char
    tty-make-readeval-default-dict
    return1
end

def test-tty-readeval
    test-tty-readeval-dict tty-readeval
end
