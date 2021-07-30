( Common writers )

def program-size
  literal *program-size* return1
end

def set-arg
  current-frame parent-frame @ frame-size arg0 cell* swapdrop int-add int-add
  arg1 swap poke
  return-2
end

( Data storing: )

def dpush-byte
  arg0 dpush
  dhere int32 3 int-sub dmove
end

def cell-align
  arg0 int32 4 int-div int32 1 int-add int32 4 int-mul return1
end

def copydown
  ( src dest num-bytes )
  arg0 cell- swapdrop

  copydown-loop:
  ( dest )
  local0 arg1 int-add
  ( src )
  local0 arg2 int-add
  peek
  ( store )
  swap poke
  ( dec )
  local0 cell- swapdrop store-local0
  ( loop? )
  dup int32 0 >= literal copydown-loop ifthenjump
end

( Tokenizer exercisers: )

def each-token
  ( str fn )
  terminator
  arg1 make-tokenizer swapdrop

  each-token-loop: ( tokenizer )
  tokenizer-next-token ( tokenizer next-tokenizer token )
  dup not literal each-token-done ifthenjump
  rotdrop ( token next-tokenizer )
  literal each-token-loop jump

  each-token-done:
  drop ( the null token )
  drop ( the state )
  drop ( the old state )
  ( pop the tokens into a list )
  start-seq

  each-token-pop-loop: ( tokens... seq )
  swap ( tokens1... seq token0 )
  terminator? literal each-token-pop-loop-done ifthenjump
  arg0 ( seq token0 fn )
  exec ( seq token0 result )
  dpush ( seq token0 )
  drop
  literal each-token-pop-loop jump
  
  each-token-pop-loop-done:
  drop ( terminator )
  end-seq
  return1
end  

def write-tokens
  arg0 literal write-line-ret each-token
end

def write-tokens1
  arg0 tokenize literal write-line-ret map-seq
end

( Constants )

def const
  ( value : name )
  next-param literal call-data-code arg0 constant-capturer
  swapdrop add-dict
end

def args1
  args cell+ return1
end

def local-ref
  ( the-location name => entry )
  arg0
  literal pointer-peeker-code
  args cell+ swapdrop
  add-dict
end

def store-local-ref
  ( value entry )
  arg0 dict-entry-data
  arg1 swap poke
end

def wait-return
  " Press return..." write-string
  flush-read-line
end

( Evaluation )

( fixme a frame not linking to it's parent as the parent's link gets overwritten by data )

def if-test
  arg0 IF write-ok return0 THEN
  write-err return0
end

def pop-to-seq
  ( start-ptr )
  start-seq
  arg0
  args cell+2 swapdrop

  pop-to-seq-loop:
  local1 peek
  dpush
  local1 local2 < IF local0 end-seq return1 THEN
  local1 cell- store-local1 drop
  literal pop-to-seq-loop jump
end
  
def pause2
  *debug* peek IF wait-return THEN
end
 
def one
  int32 1 return1
end

def cell-3
  arg0 int32 -3 cell+n
  return1
end

def tail-call-test-1
  arg0 int32 0 equals IF arg0 return1 THEN
  literal HELO write-word
  arg0 int32 1 int-sub
  literal tail-call-test-1 tailcall1
end

def tail-call-test
  longify \r\nGO write-word
  ( fixme arg0? )
  arg0 literal tail-call-test-1 tailcall1
end

(
def cont-test
  literal write-line
  pause
  cont
end
)

def do
  return-address jump ( start a new frame for the loop )
end

def again
  pop-frame return-address jump ( exit/return w/o ending frame )
end

def leave
  pop-frame end-frame rotdrop2 jump ( fixme needs to know where WHILE is )
end

def while
  end-frame drop ( drop frame )
  swap ( swap return addr & condition )
  literal while-loop ifthenjump
  end-frame rotdrop2 jump
  while-loop: drop return-address jump
end

def seq0
  arg1 arg0 2dup int-sub dallot-seq
  do arg1 write-int arg0 arg1 seq-poke drop3
     write-ok write-crnl
     arg1 int32 10 equals literal again ifthencall
                                  arg1 int32 1 int-add set-arg1
                                  arg2 arg1 > while
  write-ok int32 1146048327 write-word drop
  local2 return1
end

def next-op
  doc( Get the address of the operation after the callsite. )
  return-address cell+ return1
end

def next-op+
  doc( Get the address N cells from the callsite. )
  return-address arg0 cell+n return1
end
