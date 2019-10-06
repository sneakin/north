( VT100+ TTY control: )

( References:
    http://www.xfree86.org/current/ctlseqs.html
    https://www.gnu.org/software/screen/manual/html_node/Control-Sequences.html
)

: write-bell int32 char-code \b write-byte ;

: tty-reset
    " \ec" write-string
;

: tty-enter-raw-mode
    doc( Switches the input device to raw mode. Returns the previous state of the device. )
    args( ++ prior-state )
    input-dev-addr input-dev-intr-mode peek
    input-reset
    swap input-dev-enter-raw-mode
    swap return1
;

: tty-exit-raw-mode
    doc( Returns the input device to its prior state. )
    args( prior-state )
    arg0 input-dev-addr input-dev-intr-mode swapdrop poke
    input-reset
;

( Helper functions: )

: tty-basic-escape3
    base peek dec
    " \e[" write-string
    arg3 write-int
    " ;" write-string
    arg2 write-int
    " ;" write-string
    arg1 write-int
    arg0 write-string
    local0 base poke
;

: tty-basic-escape2
    base peek dec
    " \e[" write-string
    arg2 write-int
    " ;" write-string
    arg1 write-int
    arg0 write-string
    local0 base poke
;

: tty-basic-escape1
    args( arg code )
    " \e[" write-string
    arg1 write-int
    arg0 write-string
;

: tty-escape-private/1
    arg0 UNLESS longify l return1 THEN
    longify h return1
;

: tty-escape-private!
    arg0 write-string
    arg1 tty-escape-private/1 write-byte
;

( Tabs... )

: tty-tab-set " \eH" write-string ;
: tty-tab-clear " \e[g" write-string ;
: tty-tab-clear-all " \e[3g" write-string ;

( Erasure: )

: tty-erase
    " \e[2J" write-string
;

: tty-erase-all
    " \e[2J" write-string
;

: tty-erase-below
    " \e[0J" write-string
;

: tty-erase-above
    " \e[1J" write-string
;

: tty-erase-line-right
    " \e[0K" write-string
;

: tty-erase-line-left
    " \e[1K" write-string
;

: tty-erase-line
    " \e[2K" write-string
;

( Cursor position procedures: )

: tty-cursor-save
    " \es" write-string
;

: tty-cursor-restore
    " \eu" write-string
;

: tty-cursor-save-attr
    " \e7" write-string
;

: tty-cursor-restore-attr
    " \e8" write-string
;

: tty-cursor-home
    " \eH" write-string
;

: tty-cursor-home-bottom
    " \eF" write-string
;

: tty-cursor-to arg0 arg1 " f" tty-basic-escape2 ;

: tty-cursor-up arg0 " A" tty-basic-escape1 ;
: tty-cursor-down arg0 " B" tty-basic-escape1 ;
: tty-cursor-right arg0 " C" tty-basic-escape1 ;
: tty-cursor-left arg0 " D" tty-basic-escape1 ;

: tty-cursor-down-1 " \eD" write-string ;
: tty-cursor-up-1 " \eM" write-string ;

: tty-cursor-next-line arg0 " E" tty-basic-escape1 ;
: tty-cursor-prev-line arg0 " F" tty-basic-escape1 ;
: tty-cursor-to-col arg0 " G" tty-basic-escape1 ;

: tty-cursor-move
    arg1 negative? IF negate tty-cursor-left ELSE tty-cursor-right THEN
    arg0 negative? IF negate tty-cursor-up ELSE tty-cursor-down THEN
;

: tty-get-cursor
    " \e[6n" write-string
;

: tty-scroll-region-off " \e[r" write-string ;
: tty-scroll-region
    args( top bottom )
    arg1 arg0 " r" tty-basic-escape2
;

: tty-scroll-up
    " \eM" write-string
;

: tty-scroll-down
    " \eD" write-string
;

( Private escape sequences: )

: tty-linewrap/1 arg0 " \e[7" tty-escape-private! ;
: tty-linewrap-on int32 1 tty-linewrap/1 ;
: tty-linewrap-off int32 0 tty-linewrap/1 ;

: tty-local-echo/1 arg0 " \e[12" tty-escape-private! ;
: tty-local-echo-on int32 1 tty-local-echo/1 ;
: tty-local-echo-off int32 0 tty-local-echo/1 ;

: tty-newline-mode/1 arg0 " \e[20" tty-escape-private! ;
: tty-newline-mode int32 1 tty-newline-mode/1 ;
: tty-line-feed-mode int32 0 tty-newline-mode/1 ;

: tty-show-cursor/1 arg0 " \e[?25" tty-escape-private! ;
: tty-show-cursor int32 1 tty-show-cursor/1 ;
: tty-hide-cursor int32 0 tty-show-cursor/1 ;

: tty-alt-buffer/1 arg0 " \e[?1047" tty-escape-private! ;
: tty-alt-buffer int32 1 tty-alt-buffer/1 ;
: tty-normal-buffer int32 0 tty-alt-buffer/1 ;

: tty-alt-buffer-switch/1 arg0 " \e[?1049" tty-escape-private! ;
: tty-alt-buffer-save int32 1 tty-alt-buffer-switch/1 ;
: tty-normal-buffer-restore int32 0 tty-alt-buffer-switch/1 ;

: tty-alt-cursor-save/1 arg0 " \e[?1048" tty-escape-private! ;
: tty-alt-cursor-save int32 1 tty-alt-cursor-save/1 ;
: tty-alt-cursor-restore int32 0 tty-alt-cursor-save/1 ;

: tty-mouse/1 arg0 " \e[?1000" tty-escape-private! ;
: tty-mouse-on int32 1 tty-mouse/1 ;
: tty-mouse-off int32 0 tty-mouse/1 ;

: tty-bracket-paste/1 arg0 " \e[?2004" tty-escape-private! ;
: tty-bracket-paste-on int32 1 tty-bracket-paste/1 ;
: tty-bracket-paste-off int32 0 tty-bracket-paste/1 ;

( Character attributes: )

: color-attr
    arg0 " m" tty-basic-escape1
;

: tty-char-reset int32 0 color-attr ;
: tty-normal int32 22 color-attr ;

: bold int32 1 color-attr ;
: bold-off int32 21 color-attr ;
: dim int32 2 color-attr ;
: italic int32 3 color-attr ;
: italic-off int32 23 color-attr ;
: underline int32 4 color-attr ;
: underline-off int32 24 color-attr ;
: blink-fast int32 5 color-attr ;
: blink-off int32 25 color-attr ;
: blink-slow int32 6 color-attr ;
: inverse int32 7 color-attr ;
: inverse-off int32 27 color-attr ;
: invisible int32 8 color-attr ;
: invisible-off int32 28 color-attr ;
: strike int32 9 color-attr ;
: strike-off int32 29 color-attr ;

: tty-reset-font int32 10 color-attr ;

( Font selection: )

: tty-font-g0 int32 15 write-byte ;
: tty-font-g1 int32 14 write-byte ;
: tty-font-g2 " \eN" write-string ;
: tty-font-g2-1 " \en" write-string ;
: tty-font-g3 " \eO" write-string ;
: tty-font-g3-1 " \eo" write-string ;

: TTY-FONT-US int32 char-code B return1 ;
: TTY-FONT-UK int32 char-code A return1 ;
: TTY-FONT-BOX int32 char-code 0 return1 ;

: tty-set-g0 " \e(" write-string arg0 write-byte ;
: tty-set-g1 " \e)" write-string arg0 write-byte ;
: tty-set-g2 " \e*" write-string arg0 write-byte ;
: tty-set-g3 " \e+" write-string arg0 write-byte ;

: tty-box-drawing-on TTY-FONT-BOX tty-set-g1 tty-font-g1 ;
: tty-box-drawing-off tty-font-g0 ;

( Window codes: )

: tty-window-deiconify int32 1 " t" tty-basic-escape1 ;
: tty-window-iconify int32 2 " t" tty-basic-escape1 ;

: tty-window-move int32 3 arg1 arg0 " t" tty-basic-escape3 ;
: tty-window-pixel-resize int32 4 arg1 arg0 " t" tty-basic-escape3 ;
: tty-window-char-resize int32 8 arg1 arg0 " t" tty-basic-escape3 ;

: tty-window-raise int32 5 " t" tty-basic-escape1 ;
: tty-window-lower int32 6 " t" tty-basic-escape1 ;
: tty-window-refresh int32 7 " t" tty-basic-escape1 ;

: tty-window-restore-maximized int32 9 int32 0 " t" tty-basic-escape2 ;
: tty-window-maximize int32 9 int32 1 " t" tty-basic-escape2 ;

: tty-window-state int32 11 " t" tty-basic-escape1 ;
: tty-window-position int32 13 " t" tty-basic-escape1 ;
: tty-window-pixel-size int32 14 " t" tty-basic-escape1 ;
: tty-window-text-size int32 18 " t" tty-basic-escape1 ;
: tty-window-screen-size int32 19 " t" tty-basic-escape1 ;
: tty-window-icon-label int32 20 " t" tty-basic-escape1 ;
: tty-window-title int32 21 " t" tty-basic-escape1 ;
: tty-window-resize-lines arg0 " t" tty-basic-escape1 ;

: tty-osc-command
    " \e]" write-string
    arg1 write-unsigned-int
    " ;" write-string
    arg0 write-string
    " \a" write-string
;

: tty-set-window-icon-and-title int32 0 arg0 tty-osc-command ;
: tty-set-window-title int32 2 arg0 tty-osc-command ;
: tty-set-window-icon-name int32 1 arg0 tty-osc-command ;


( Bad codes? )

: tty-reversed/1 arg0 " \e[?12" tty-escape-private! ;
: tty-reversed-on int32 1 tty-reversed/1 ;
: tty-reversed-off int32 0 tty-reversed/1 ;

: tty-blinking-cursor/1 arg0 " \e[?12" tty-escape-private! ;
: tty-blinking-cursor int32 1 tty-blinking-cursor/1 ;
: tty-solid-cursor int32 0 tty-blinking-cursor/1 ;

: tty-hi-mouse/1 arg0 " \e[?1001" tty-escape-private! ;
: tty-hi-mouse-on int32 1 tty-hi-mouse/1 ;
: tty-hi-mouse-off int32 0 tty-hi-mouse/1 ;

: tty-mouse-cell-motion/1 arg0 " \e[?1002" tty-escape-private! ;
: tty-mouse-cell-motion-on int32 1 tty-mouse-cell-motion/1 ;
: tty-mouse-cell-motion-off int32 0 tty-mouse-cell-motion/1 ;

: tty-mouse-tracking/1 arg0 " \e[?1003" tty-escape-private! ;
: tty-mouse-tracking-on int32 1 tty-mouse-tracking/1 ;
: tty-mouse-tracking-off int32 0 tty-mouse-tracking/1 ;

: tty-relative/1 arg0 " \e[?6" tty-escape-private! ;
: tty-relative int32 1 tty-relative/1 ;
: tty-absolute int32 0 tty-relative/1 ;

( TTY Input )

constant TTY-READ-EOS 0
constant TTY-READ-BYTE 1
constant TTY-READ-ESCAPE 2
constant TTY-READ-CSI 3
constant TTY-READ-MOUSE 4

: tty-read-byte
    read-byte return1
;

: tty-read-int
    args( digit -- digit next-byte )
    tty-read-byte
    digit? UNLESS return1 THEN
    digit-char swapdrop
    arg0 int32 10 int-mul
    int-add set-arg0
    RECURSE
;

: tty-read-int-seq-loop/3
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
;

: tty-read-int-seq
    args( initial-digit modifier ++ digits code modifier )
    arg1 arg0 int32 0
    ' tty-read-int-seq-loop/3 cont
;

: tty-read-mouse-coords
    tty-read-byte
    tty-read-byte int32 32 int-sub
    tty-read-byte int32 32 int-sub
    local0 TTY-READ-MOUSE int32 4 returnN
;

: tty-read-csi
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
;

: tty-read-escape-seq
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
;

: tty-read
    doc( Read the next byte or escape sequence from the input device. )
    args( ++ ...event-data event-kind )
    tty-read-byte
    escape? IF ' tty-read-escape-seq cont THEN
    TTY-READ-BYTE return2
;

: tty-query2
    tty-enter-raw-mode
    arg0 exec
    tty-read
    local0 tty-exit-raw-mode drop
    TTY-READ-CSI equals IF
      drop3 return2
    ELSE
      int32 0 int32 0 return2
    THEN
;

: tty-read-cursor
    doc( Query the terminal for the cursor position. )
    args( ++ row col )
    ' tty-get-cursor tty-query2 return2
;

: tty-read-window-position
    ' tty-window-position tty-query2 return2
;

: tty-read-window-pixel-size
    ' tty-window-pixel-size tty-query2 return2
;

: tty-read-window-text-size
    ' tty-window-text-size tty-query2 return2
;

: tty-read-window-screen-size
    ' tty-window-screen-size tty-query2 return2
;

( TTY ReadEval: reader + dictionary word execution by key name: )

: tty-readeval-key-name
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
            int32 1
        THEN
        here arg0 int32 2 overn copy-seq
        return0
    THEN
    arg1 TTY-READ-ESCAPE equals IF
        " escape " .s arg3 .d arg2 .d arg1 .d .\n
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
        " csi " .s arg3 .d arg2 .d arg1 .d .\n
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
;

: tty-readeval-key-name-test
    int32 32 stack-allot
    int32 char-code A TTY-READ-BYTE shift tty-readeval-key-name
    int32 64 hexdump
    .\n
    int32 32 stack-allot
    int32 char-code A TTY-READ-ESCAPE int32 2 overn tty-readeval-key-name
    int32 64 hexdump
    .\n
    int32 32 stack-allot
    int32 0 int32 char-code A int32 0 TTY-READ-CSI int32 4 overn tty-readeval-key-name
    int32 64 hexdump
;

: tty-readeval-done!
    lit tty-readeval-done arg0 dict-lookup
    dup IF int32 1 swap set-dict-entry-data THEN
;

: tty-readeval-done?
    lit tty-readeval-done arg0 dict-lookup
    dup UNLESS int32 2 return1 THEN
    dict-entry-data return1
;

: tty-readeval-on-break
    arg0 tty-readeval-done!
;

: tty-readeval-loop
    .\n " readeval " .s
    args( on-char on-key dict ) 
    arg0 tty-readeval-done? swapdrop IF return0 THEN
    tty-read
    arg3 tty-readeval-key-name write-escaped-string
    arg0 dict-lookup ( ...event-data event-kind name dict entry )
    null? IF ( nothing in dictionary )
        drop
        int32 2 overn TTY-READ-BYTE equals
        ( try one of the args )
        IF arg2 ELSE arg1 THEN
    THEN
    null? UNLESS
        "  exec " .s write-dict-entry
        ( todo named events don't need the kind and name )
        ( todo char events only need the name )
        ( todo key events need it all )
        shift drop
        dup arg1 equals UNLESS shift drop THEN
        exec
    THEN
    drop-locals RECURSE
;

: tty-readeval-start
    tty-enter-raw-mode
    tty-mouse-on
    return1
;

: tty-readeval-end
    tty-mouse-off
    arg0 tty-exit-raw-mode
    input-reset
;

: tty-readeval
    doc( Read TTY input  dispatching to dictionary entries
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
    tty-readeval-loop drop
    local0 tty-readeval-end drop
;

: tty-make-readeval-default-dict
    doc( Construct the default dictionary that `tty-readeval`  expects. )
    args( dict )
    arg0
    " \e[c" aliases> tty-readeval-on-status
    " C-c" aliases> tty-readeval-on-break
    " tty-readeval-loop" aliases> tty-readeval-loop
    " tty-readeval-done"
    ' variable-peeker dict-entry-code swapdrop
    int32 0
    make-dict/4
    return1
;

( ReadEval test: )

: tty-readeval-on-csi
    " on-csi" .s
    arg1 .d arg2 .d arg3 .d .\n
    arg3 int32 0 > IF
        args int32 4 cell+n rotdrop2
        arg3 cell* swapdrop
        hexdump drop2
    THEN
;

: tty-readeval-on-escape
    " on-escape" .s
    arg1 .d arg2 .d arg3 .d .\n
;

: tty-readeval-on-return
    "  on-return" .s
    arg0 tty-readeval-done!
;

: tty-readeval-on-newline
    "  on-newline" .s
    arg0 tty-readeval-done!
;

: tty-readeval-on-control
    "  on-control" .s arg1 .d .\n
;

: tty-readeval-on-key
    "  on-key" .s arg1 .d arg2 .d arg3 .d
    int32 4 argn .d
    int32 5 argn .d
    int32 6 argn .d
    int32 7 argn .d
    .\n
;

: tty-readeval-on-char
    "  on-char" .s arg1 .d arg2 .d .\n
;

: tty-readeval-on-mouse
    "  on-mouse" .s
    arg1 .d arg2 .d arg3 .d .\n
;

: tty-readeval-on-up
    "  on-up" .s
    arg1 .d arg2 .d arg3 .d .\n
;

: tty-readeval-on-status
    "  on-status" .s
    arg1 .d arg2 .d arg3 .d .\n
;

: tty-readeval-on-report-cursor
    " on-report-cursor" .s
    arg1 .d arg2 .d arg3 .d .\n
;

: tty-readeval-test-dict
    terminator
    " <up>" aliases> tty-readeval-on-up
    " \e[M" aliases> tty-readeval-on-mouse
    " \e[R" aliases> tty-readeval-on-report-cursor
    " C" aliases> tty-get-cursor
    " M-O-P" aliases> help
    " C-l" aliases> tty-reset
    " C-m" aliases> tty-readeval-on-return
    " C-j" aliases> tty-readeval-on-newline
    " M-\e" aliases> tty-readeval-on-newline
    " on-key" aliases> tty-readeval-on-key
    " on-char" aliases> tty-readeval-on-char
    tty-make-readeval-default-dict
    return1
;

: tty-readeval-test
    tty-readeval-test-dict tty-readeval
;
