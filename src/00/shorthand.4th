( Short aliases for common & helpful functions. )

alias ! poke
alias @ peek

: q quit ; immediate

: .
  doc( Print the top of stack. )
  arg0 write-int
;

( Printers: )

: ,sp write-space ;
: .\n write-crnl ;
: ,tab write-tab ;
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

( Base helpers: )

: binary int32 %10 base poke ;
: hex int32 $10 base poke ;
: dec int32 #10 base poke ;
