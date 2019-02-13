longify STOP constant TERMINATOR

longify" \r\n" constant CRNL
longify HELO constant HELO
longify"  OK " constant OK1
longify" \r\n$ " constant PS0
longify" \r\n> " constant PS1
longify" \r\nER" constant ERR1
longify" \r\n> " constant ERR2

longify" \x1B[00" constant TTY-ESCAPE
longify" m\x00\x00\x00" constant TTY-RESET
longify" \x1B[30" constant TTY-COLOR-FG
longify" ;40m" constant TTY-COLOR-BG2
longify" ;30m" constant TTY-COLOR_FG2

