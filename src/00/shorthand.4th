alias ! poke
alias @ peek
alias . drop

: ,sp write-space ;
: .\n write-crnl ;
: ,s arg0 write-string  ;
: .s arg0 ,s return-1 ;
: ,S ,sp arg0 ,s ;
: .S ,sp arg0 .s return-1 ;
: ,i arg0 write-space write-int ;
: .i arg0 ,i return-1 ;
: ,u arg0 write-space write-unsigned-int ;
: .u arg0 ,u return-1 ;
: ,h
    base @ int32 16 base !
    arg0 write-space write-unsigned-int
    drop base !
;
: .h arg0 ,h return-1 ;
: ,d arg0 write-space write-int ;
: .d arg0 ,d return-1 ;

