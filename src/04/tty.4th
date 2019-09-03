: escape?
    arg0 char-code \e equals return1
;

: tty-reset
    " \ec" write-string
;

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

: tty-cursor-to arg1 arg0 " f" tty-basic-escape2 ;

: tty-cursor-up arg0 " A" tty-basic-escape1 ;
: tty-cursor-down arg0 " B" tty-basic-escape1 ;
: tty-cursor-right arg0 " C" tty-basic-escape1 ;
: tty-cursor-left arg0 " D" tty-basic-escape1 ;

: tty-cursor-next-line arg0 " E" tty-basic-escape1 ;
: tty-cursor-prev-line arg0 " F" tty-basic-escape1 ;
: tty-cursor-to-col arg0 " G" tty-basic-escape1 ;

: tty-get-cursor
    " \e[6n" write-string
;

: tty-scroll-up
    " \eD" write-string
;

: tty-scroll-down
    " \eM" write-string
;

( Private escape sequences: )

: tty-escape-private/1
    arg0 UNLESS longify l return1 THEN
    longify h return1
;

: tty-escape-private!
    arg0 write-string
    tty-escape-private/1 write-byte
;

: tty-newline-mode/1 " \e[20" tty-escape-private! ;
: tty-newline-mode int32 1 tty-newline-mode/1 ;
: tty-line-feed-mode int32 0 tty-newline-mode/1 ;

: tty-show-cursor/1 " \e[?25" tty-escape-private! ;
: tty-show-cursor int32 1 tty-show-cursor/1 ;
: tty-hide-cursor int32 0 tty-show-cursor/1 ;

: tty-alt-buffer/1 " \e[?1047" tty-escape-private! ;
: tty-alt-buffer int32 1 tty-alt-buffer/1 ;
: tty-normal-buffer int32 0 tty-alt-buffer/1 ;

: tty-alt-buffer-clear/1 " \e[?1049" tty-escape-private! ;
: tty-alt-buffer-clear int32 1 tty-alt-buffer-clear/1 ;
: tty-normal-buffer-clear int32 0 tty-alt-buffer-clear/1 ;

: tty-mouse/1 " \e[?1000" tty-escape-private! ;
: tty-mouse-on int32 1 tty-mouse/1 ;
: tty-mouse-off int32 0 tty-mouse/1 ;

: tty-bracket-paste/1 " \e[?2004" tty-escape-private! ;
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
