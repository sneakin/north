( Common writers )

: program-size
  literal *program-size* return1
;

: set-arg
  current-frame parent-frame frame-size arg0 cell* swapdrop int-add int-add
  arg1 swap poke
  return-2
;

( Data storing: )

: dpush-byte
  arg0 dpush
  dhere literal 3 int-sub dmove
;

: cell-align
  arg0 literal 4 int-div literal 1 int-add literal 4 int-mul return1
;

: copydown
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
  dup literal 0 >= literal copydown-loop ifthenjump
;

( Tokenizer exercisers: )

: each-token
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
;  

: write-tokens
  arg0 literal write-line-ret each-token
;

: write-tokens1
  arg0 tokenize literal write-line-ret map-seq
;

( Constants )

: const
  ( value : name )
  next-param literal call-data-code arg0 constant-capturer
  swapdrop add-dict
;

: args1
  args cell+ return1
;

: local-ref
  ( the-location name => entry )
  arg0
  literal pointer-peeker-code
  args cell+ swapdrop
  add-dict
;

: store-local-ref
  ( value entry )
  arg0 dict-entry-data
  arg1 swap poke
;

: wait-return
  " Press return..." write-string
  flush-read-line
;

( Evaluation )

( fixme a frame not linking to it's parent as the parent's link gets overwritten by data )

: if-test
  arg0 IF write-ok return0 THEN
  write-err return0
;

: pop-to-seq
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
;
  
: pause2
  *debug* peek IF wait-return THEN
;
 
: one
  literal 1 return1
;

: cell-3
  arg0 literal -3 cell+n
  return1
;

: tail-call-test-1
  arg0 literal 0 equals IF arg0 return1 THEN
  literal HELO write-word
  arg0 literal 1 int-sub
  literal tail-call-test-1 tailcall1
;

: tail-call-test
  longify \r\nGO write-word
  ( fixme arg0? )
  arg0 literal tail-call-test-1 tailcall1
;

(
: cont-test
  literal write-line
  pause
  cont
;
)

: do
  return-address jump ( start a new frame for the loop )
;

: again
  end-frame return-address jump ( exit/return w/o ending frame )
;

: leave
  end-frame end rotdrop2 jump ( fixme needs to know where WHILE is )
;

: while
  end drop ( drop frame )
  swap ( swap return addr & condition )
  literal while-loop ifthenjump
  end rotdrop2 jump
  while-loop: drop return-address jump
;

: seq0
  arg1 arg0 2dup int-sub dallot
  do arg1 write-int arg0 arg1 seq-poke drop3
     write-ok write-crnl
     arg1 literal 10 equals literal again ifthencall
                                  arg1 literal 1 int-add set-arg1
                                  arg2 arg1 > while
  write-ok literal 1146048327 write-word drop
  local2 return1
;
