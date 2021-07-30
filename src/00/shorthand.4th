( Short aliases for common & helpful functions. )

alias ! poke
alias @ peek

def q quit ; immediate

def .
  doc( Print the top of stack. )
  arg0 write-int
end

( Printers: )

def ,sp write-space end
def .\n write-crnl end
def ,tab write-tab end
def ,s arg0 write-string  end
def .s arg0 ,s return-1 end
def ,S ,sp arg0 ,s end
def .S ,sp arg0 .s return-1 end
def ,i arg0 write-space write-int end
def .i arg0 ,i return-1 end
def ,u arg0 write-space write-unsigned-int end
def .u arg0 ,u return-1 end
def ,h
    base @ int32 16 base !
    arg0 write-space write-unsigned-int
    drop base !
end
def .h arg0 ,h return-1 end
def ,d arg0 write-space write-int end
def .d arg0 ,d return-1 end

( Base helpers: )

def binary int32 %10 base poke end
def hex int32 $10 base poke end
def dec int32 #10 base poke end
