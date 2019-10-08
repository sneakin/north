: help-tty-color-table
    doc( View the 16 TTY colors in a table with color numbers. )
    arg0
    int32 8 DOTIMES[
        arg2
        arg0
        int32 8 DOTIMES[
            arg2 arg0 color/2
            swap .d .d
            arg3 write-string
        ]DOTIMES
        int32 0 int32 0 color/2 write-crnl
    ]DOTIMES
    
    color-reset
;

: help-tty-attr-table
    doc( View a table of TTY character attributes. )
    bold " bold" write-string tty-normal
    write-tab
    italic " italic" write-string italic-off
    write-tab
    underline " underline" write-string underline-off
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

: help-tty-attrs
    doc( View a table of colors and styles availeble on a TTY. )
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
