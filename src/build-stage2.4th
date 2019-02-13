" Building stage2..." write-line

mark
*mark* variable *init-mark*

01-atoi-src load
01-tty-src load
( 01-dict-src load )
01-seq-src load
01-ui-src load

assembler-src load
ops-src load

( todo... )
" Now to save the dictionary..." write-line
*init-mark* save-to-mark
hex write-unsigned-int dec

write-ok
