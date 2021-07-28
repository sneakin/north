( Short aliases for common & helpful functions. )

alias ! poke
alias @ peek

def q quit ; immediate

def .
  doc( Print the top of stack. )
  arg0 write-int
end

( Printers: )

def ,sp write-space ;
def .\n write-crnl ;
def ,tab write-tab ;
def ,s arg0 write-string  ;
def .s arg0 ,s return-1 ;
def ,S ,sp arg0 ,s ;
def .S ,sp arg0 .s return-1 ;
def ,i arg0 write-space write-int ;
def .i arg0 ,i return-1 ;
def ,u arg0 write-space write-unsigned-int ;
def .u arg0 ,u return-1 ;
def ,h
    base @ int32 16 base !
    arg0 write-space write-unsigned-int
    drop base !
end
def .h arg0 ,h return-1 ;
def ,d arg0 write-space write-int ;
def .d arg0 ,d return-1 ;

( Base helpers: )

def binary int32 %10 base poke ;
def hex int32 $10 base poke ;
def dec int32 #10 base poke ;
