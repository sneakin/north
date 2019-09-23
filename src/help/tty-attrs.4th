: help-tty-color-table
    doc( View the 16 TTY colors in a table with color numbers. )
    arg0
    int32 10 DOTIMES[
        arg3
        arg1
        int32 10 DOTIMES[
            arg3 arg1 color/2
            swap .d .d
            int32 4 argn write-string
        ]DOTIMES
        int32 0 int32 0 color/2 write-crnl
    ]DOTIMES
    
    color-reset
;

: help-tty-attr-table
    doc( View a table of TTY character attributes. )
    bold " Bold" write-string tty-normal
    write-tab
    italic " Italic" write-string italic-off
    write-tab
    underline " Underline" write-string underline-off
    write-crnl
    blink-fast " blink-fast" write-string blink-off
    write-tab
    blink-slow " blink-slow" write-string blink-off
    write-tab
    inverse " inverse" write-string inverse-off
    write-crnl
    invisible " invisible" write-string invisible-off
    write-tab
    strike " strike" write-string strike-off
    color-reset write-crnl
;

: write-heading
    doc( Print the argument out underlined, bold, and on its own line. )
    bold underline arg0 write-line color-reset write-crnl
;

: help-tty-attrs
    doc( View a table of colors and styles availeble on a TTY. )
    int32 1 int32 1 tty-cursor-to
    " Normal" write-heading
    "  hey! " dim help-tty-color-table
    write-crnl
    " Dim" write-heading
    "  hey! " dim help-tty-color-table
    write-crnl
    " Bold" write-heading
    "  hey! " bold help-tty-color-table
    write-crnl
    " Attributes" write-heading
    help-tty-attr-table
    write-crnl
;
