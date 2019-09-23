: tty-readline-dict
    terminator
    ( " \e[A" aliases: tty-readeval-on-up )
    ( " \e[c" aliases: tty-readeval-on-status )
    " \e[M" aliases> tty-readeval-on-mouse
    " \r" aliases> tty-readeval-on-return
    " \n" aliases> tty-readeval-on-newline
    tty-make-readeval-default-dict
    return1
;

: tty-readline
    tty-readline-dict tty-readeval
;
