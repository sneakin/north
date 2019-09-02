alias ! poke
alias @ peek
alias . drop

: .\n write-crnl ;
: ,s arg0 write-string  ;
: .s arg0 write-string return-1 ;
: ,d arg0 write-space write-int ;
: .d arg0 write-space write-int return-1 ;

