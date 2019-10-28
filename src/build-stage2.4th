" Building stage2..." write-line

mark
*mark* variable *stage2-mark*

src/01/atoi.4th load
src/01/tty.4th load
( src/01/dict.4th load )
src/01/seq.4th load
src/01/ui.4th load

src/02/assembler.4th load
src/02/ops.4th load

( todo... )
" Now to save the dictionary..." write-line
( *init-mark* save-to-mark )
( hex write-unsigned-int dec )

write-ok
