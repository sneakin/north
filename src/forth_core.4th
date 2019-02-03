: boot
  dict-init
  eval-loop
  write-crnl
  bootstrap-loop
;

: next-param-test-inner
  next-param write-word
  next-param write-word
  next-param write-word
  return0
;

: next-param-test
  next-param-test-inner longify BAM longify BOOM longify POW
  literal 123 const x-sym
  return1
;

( TTY Color )

: color-reset
  literal TTY-ESCAPE write-word
  literal TTY-RESET write-word 
;

: color-attr
  literal TTY-ESCAPE
  arg0 literal 24 bsl int-add write-word 
  literal TTY-RESET write-word 
;

: color
  literal TTY-COLOR-FG arg0 literal 24 bsl int-add write-word 
  literal TTY-COLOR-BG2 arg1 literal 16 bsl int-add write-word 
;

: fgcolor
  literal TTY-ESCAPE arg1 literal 24 bsl int-add write-word 
  literal TTY-COLOR-FG2 arg0 literal 16 bsl int-add write-word 
;

: bright
  literal 1 color-attr 
;

: dim
  literal 2 color-attr 
;

: black
  literal 8 literal 0 color 
;

: white
  literal 8 literal 7 color 
;

: red
  literal 8 literal 1 color 
;

: green
  literal 8 literal 2 color 
;

: yellow
  literal 8 literal 3 color 
;

: blue
  literal 8 literal 4 color 
;

( Common writers )

: crnl
  literal CRNL return1
;

: write-crnl
  literal CRNL write-word 
;

: write-helo
  literal HELO write-word 
;

: write-ok
  bright green 
  literal OK1 write-word 
  color-reset 
;

: write-err
  bright red 
  literal ERR1 write-word 
  color-reset 
;

( Prompts )

: prompt
  bright yellow 
  literal PS1 write-word 
  color-reset 
;
  
: prompt0
  bright yellow 
  literal PS0 write-word 
  color-reset 
;

( Barebones evaluation loop. )
: bootstrap-loop
  bootstrap-loop-inner:
  write-status prompt0 
  read-token 
  dict dict-lookup  ( fixme: dict and token are on stack during call, tail call needs to eat caller's frame? )
  swapdrop 
  dup not literal bootstrap-loop-not-found ifthenjump 
  swapdrop 
  exec 
  literal bootstrap-loop-inner jump 
  exit

  bootstrap-loop-not-found: drop
  literal bootstrap-loop-inner jump
;

: boo
  literal longify BOO write-word 
  literal 0 literal boo-done ifthenjump write-err 

  boo-done: write-ok 
  literal $8765 return1
;
  
: make-dict ( name code data link => entry-ptr )
  arg3 dpush ( name ) 
  dhere 
  arg2 dpush ( code ) 
  arg1 dpush ( data )
  arg0 dpush ( link )
  return1    ( dhere )
;

: add-dict
  ( name code data )
  arg2 arg1 arg0 dict make-dict 
  dup set-dict 
  return1
;

: dict-entry-name
  arg0 peek 
  return1
;

: dict-entry-code
  arg0 cell+ peek 
  return1
;

: dict-entry-data
  arg0 cell+2 peek
  return1
;

: set-dict-entry-code
  ( value entry )
  arg1 arg0 cell+ swapdrop poke 
;

: set-dict-entry-data
  ( value entry )
  arg1 arg0 cell+2 swapdrop poke 
;

: dict-entry-next
  arg0 literal dict-entry-next-ok ifthenjump
  literal 0 return1

  dict-entry-next-ok: arg0 cell+3 peek return1
;

: set-dict-entry-next
  arg1 arg0 cell+3 swapdrop poke return0
;
  
: dict-lookup-parent
  arg0

  dict-lookup-parent-loop:
  dict-entry-next
  terminator? literal dict-lookup-parent-fail ifthenjump
  dict-entry-name arg1 string-equal literal dict-lookup-parent-found ifthenjump
  drop2 swapdrop literal dict-lookup-parent-loop jump

  dict-lookup-parent-fail: literal 0 return1
  dict-lookup-parent-found: drop3 return1
;

: dict-lookup
  ( check dict's head )
  arg0 dict-entry-name arg1 string-equal literal dict-lookup-top ifthenjump
  ( search the list )
  arg1 arg0 dict-lookup-parent dict-entry-next return1

  ( is the head )
  dict-lookup-top: arg0 return1
;

: dict-each  
  arg0 

  dict-each-loop:
  local0 terminator? literal dict-each-done ifthenjump 
  drop
  arg1 exec 
  local0 dict-entry-next store-local0 drop
  literal dict-each-loop jump

  dict-each-done: return0
;

: write-dict-entry-name
  arg0 dict-entry-name write-string
;

: write-dict-entry-data
  arg0 dict-entry-data write-unsigned-int 
;

: write-dict-entry-code
  arg0 dict-entry-code write-unsigned-int 
;

: write-dict-entry-kind
  arg0 
  ( functions )
  dict-entry-code
  literal call-data-code 
  equals literal write-dict-entry-kind-func ifthenjump 
  ( also have sequences )
  dict-entry-code 
  literal call-data-seq-code 
  equals literal write-dict-entry-kind-func ifthenjump 
  ( vars )
  dict-entry-code 
  literal variable-peeker-code 
  equals literal write-dict-entry-kind-var ifthenjump 
  ( asm )
  literal longify ASM write-word 
  return0

  write-dict-entry-kind-func:
  literal longify FUN write-word 
  return0

  write-dict-entry-kind-var:
  literal longify VAR write-word 
;

: write-tab
  literal longify \t write-byte 
;

: write-dict-entry
  arg0
  write-dict-entry-kind write-tab 
  write-dict-entry-name write-tab 
  write-dict-entry-code write-tab 
  write-dict-entry-data write-crnl 
;

: dict-list
  literal write-dict-entry dict dict-each 
;

: dict-init
  literal dictionary peek
  set-dict
  mark
;
  
: string-equal
  ( ptr-a ptr-b )
  ( lengths )
  arg0 peek
  arg1 peek
  ( elements )
  equals literal string-equal-cmp ifthenjump
  ( lengths are different )
  literal 0 return1

  string-equal-cmp:
  arg0 arg1

  string-equal-loop:
  literal 4 int-add swap
  literal 4 int-add swap
  ( read elements )
  2dup peek
  swap peek
  ( at the terminators? )
  2dup literal S-TERMINATOR equals
  swap literal S-TERMINATOR equals
  logand literal string-equal-done ifthenjump
  ( elements match? )
  equals literal string-equal-loop ifthenjump
  ( not equal )
  literal 0 return1

  string-equal-done:
  literal 1 return1
;

: write-string
  arg0 literal 4 int-add

  write-string-loop:
    dup peek dup
    literal S-TERMINATOR
    equals literal write-string-done ifthenjump
    write-byte
    literal 4 int-add
    literal write-string-loop jump

  write-string-done:
    drop2 return0
;

: write-string-n
  arg1 literal 4 int-add
  dup
  arg0 cell* swapdrop
  int-add
  swap
  literal write-string-n-loop jump

  write-string-n-loop:
  dup peek
  dup
  literal S-TERMINATOR equals literal write-string-n-done ifthenjump
  write-byte
  literal 4 int-add
  2dup equals literal write-string-n-done ifthenjump
  literal write-string-n-loop jump

  write-string-n-done:
  drop2
;
  
: seq-length
  arg0 peek return1
;

: string-byte-size
  arg0 seq-length literal 4 int-mul
  return1
;

: write-string-rev
  arg0
  dup
  dup string-byte-size int-add
  literal write-string-rev-loop jump

  write-string-rev-loop:
  dup peek write-byte
  literal -4 int-add
  2dup equals literal write-string-rev-done ifthenjump
  literal write-string-rev-loop jump

  write-string-rev-done:
  drop2
;

: space?
  arg0 literal $20 equals
  return1
;

: or
  arg0 literal or-done-0 ifthenjump
  arg1 literal or-done-1 ifthenjump
  literal 0 return1

  or-done-0:
  arg0 return1

  or-done-1:
  arg1 return1
;

: program-size
  literal *program-size* return1
;

: CELL-SIZE
  literal 4 return1
;

: FRAME-SIZE
  CELL-SIZE literal 2 int-mul return1
;

: parent-frame
  arg0 peek return1
;

: set-arg
  current-frame parent-frame FRAME-SIZE arg0 cell* swapdrop int-add int-add
  arg1 swap poke
  return-2
;
  
: set-arg0
  current-frame parent-frame
  FRAME-SIZE int-add
  arg0 swap poke
  return-1
;

: set-arg1
  current-frame parent-frame
  FRAME-SIZE cell+ swapdrop
  int-add
  arg0 swap poke
  return-1
;
  
: set-arg2
  current-frame parent-frame
  FRAME-SIZE cell+2 swapdrop
  int-add
  arg0 swap poke
  return-1
;

: set-arg3
  current-frame parent-frame
  FRAME-SIZE cell+3 swapdrop
  int-add
  arg0 swap poke
  return-1
;

: whitespace?
  arg0 space? swap literal char-code \r equals
  arg0 literal char-code \n equals
  arg0 literal char-code \t equals
  or rotdrop2
  or rotdrop2
  or rotdrop2
  return1
;

: null?
  arg0 literal 0 equals literal null-yes ifthenjump
  arg0 literal S-TERMINATOR equals literal null-yes ifthenjump
  literal 0 return1

  null-yes:
  literal 1 return1
;

: terminator
  literal S-TERMINATOR return1
;

: terminator?
  arg0 literal S-TERMINATOR equals literal terminator-yes ifthenjump
  literal 0 return1

  terminator-yes:
  literal 1 return1
;

: in-range?
  ( Max min value )
  arg0 dup arg1 >= literal range-maybe ifthenjump
  drop literal 0 return1

  range-maybe:
  arg2 <= literal range-yes ifthenjump
  literal 0 return1

  range-yes:
  literal 1 return1
;

: digit?
  literal char-code 9
  literal char-code 0
  arg0 in-range?
  return1
;

: lower-alpha?
  literal char-code z
  literal char-code a
  arg0 in-range?
  return1
;

: upper-alpha?
  literal char-code Z
  literal char-code A
  arg0 in-range?
  return1
;

: alpha?
  arg0 lower-alpha?
  swap upper-alpha?
  swapdrop
  or return1
;

: digit-detected
  literal longify \r\nDI
  write-word
;

: space-detected
  literal longify \r\nSP
  write-word
;

: alpha-detected
  literal longify \r\nAL
  write-word
  return0
;

: start-seq
  literal 0 dpush
  dhere return1
;

: end-seq
  ( seq )
  dhere
  literal S-TERMINATOR dpush
  arg0 int-sub
  literal 4 int-div
  arg0 poke
;

: abort-seq
  arg0 dmove
  ddrop
;

( super basic reader functions )

: eat-spaces
  eat-spaces-loop:
  read-byte
  whitespace? literal eat-spaces-reloop ifthenjump
  return1

  eat-spaces-reloop: drop literal eat-spaces-loop jump
;

: read-token
  start-seq
  eat-spaces
  dpush

  read-token-loop:
  read-byte
  whitespace? literal read-token-done ifthenjump
  dpush
  literal read-token-loop jump

  read-token-done: drop end-seq return1
;

: b-lit
  read-token return1
;

: b'
  b-lit dict dict-lookup return1
;

( tokenizer with state )

: tokenizer-str-offset
  arg0 cell+ peek
  return1
;

: tokenizer-str
  arg0 return1
;

: tokenizer-str-ptr
  arg0 peek
  arg0 cell+ swapdrop peek
  int-add
  cell+ ( skip the seq's length )
  return1
;

: tokenizer-inc-str-offset
  arg0 cell+ ( ptr ptr+ )
  dup peek ( ptr ptr+ offset )
  cell+ swapdrop ( ptr ptr+ offset+ )
  swap
  poke
;

: tokenizer-peek-word
  arg0
  tokenizer-exhausted? literal tokenizer-peek-eos ifthenjump
  arg0 tokenizer-str-ptr peek
  return1

  tokenizer-peek-eos: literal 0 return1
;

: tokenizer-exhausted?
  arg0 peek
  seq-length cell*
  arg0 tokenizer-str-offset swapdrop
  < return1
;
  
: tokenizer-next-word
  arg0
  tokenizer-exhausted? literal tokenizer-next-word-eos ifthenjump
  tokenizer-str-ptr peek
  swap tokenizer-inc-str-offset
  swap return1 ( tokenizer cell )

  tokenizer-next-word-eos: literal 0 return1
;

( todo use a function and refactor eat-spaces )

: tokenizer-skip-until
  ( tokenizer needle )
  arg1

  tokenizer-skip-until-loop: tokenizer-next-word null? literal tokenizer-skip-until-done ifthenjump
  dup arg0 equals literal tokenizer-skip-until-done ifthenjump
  drop
  literal tokenizer-skip-until-loop jump

  tokenizer-skip-until-done: return0
;

: tokenizer-eat-spaces
  arg0

  tokenizer-eat-spaces-loop:
  tokenizer-peek-word
  whitespace? literal tokenizer-eat-spaces-reloop ifthenjump
  return0

  tokenizer-eat-spaces-reloop:
  drop
  tokenizer-inc-str-offset
  literal tokenizer-eat-spaces-loop jump
;

( fixme limit length read to buffer size )

: tokenizer-read-until
  ( tokenizer needle )
  arg1 tokenizer-buffer-reset

  tokenizer-read-until-loop: tokenizer-next-word null? literal tokenizer-read-until-done ifthenjump
  dup arg0 equals literal tokenizer-read-until-done ifthenjump
  tokenizer-push drop
  literal tokenizer-read-until-loop jump
  
  tokenizer-read-until-done: drop tokenizer-finish-output return2
;

( fixme: tokenizer should return start ptrs and lengths, try to eliminate usage of the buffer so "" and such can be unlimited. )

( string -> tokenizer ready string )
( tokenizer structure: str-ptr str-offset token-seq token-seq-ptr )
: make-tokenizer
  literal 32 dallot
  arg0 dpush
  dhere
  literal 0 dpush
  swap dpush
  literal 0 dpush
  return1
;

: tokenizer-buffer
  arg0 cell+2 peek return1
;

: tokenizer-buffer-start
  arg0 cell+2 peek
  cell+ return1
;

: tokenizer-buffer-offset
  arg0 cell+3 peek return1
;

: tokenizer-buffer-ptr
  arg0 cell+2 swapdrop peek
  arg0 cell+3 swapdrop peek
  int-add cell+2 ( skip the seq and fake lengths )
  return1
;

: tokenizer-inc-buffer-offset
  arg0 cell+3 ( ptr ptr+ )
  dup peek ( ptr ptr+ offset )
  cell+ swapdrop ( ptr ptr+ offset+ )
  swap poke
  return0
;

: tokenizer-push
  ( tokenizer token )
  arg1 tokenizer-buffer-ptr
  arg0 swap poke
  tokenizer-inc-buffer-offset
;

: set-tokenizer-buffer-offset
  arg1 cell+3
  arg0
  swap poke
;

: fill
  literal 0

  fill-loop:
  dup arg1 int-add
  literal 0 swap poke
  cell+ swapdrop
  dup arg0 <= literal fill-loop ifthenjump
;

: tokenizer-buffer-reset
  arg0 literal 0 set-tokenizer-buffer-offset swapdrop
  tokenizer-buffer-ptr
  literal 32 cell* swapdrop
  fill
;

: set-tokenizer-buffer-length
  arg0 arg1 poke
;

: next-token
  ( tokenizer -> string-past-token token )
  arg0
  tokenizer-eat-spaces
  tokenizer-buffer-reset

  tokenizer-loop:
  tokenizer-next-word ( tokenizer byte )
  null? literal tokenizer-done ifthenjump
  whitespace? literal tokenizer-done ifthenjump
  tokenizer-push drop ( tokenizer )
  literal tokenizer-loop jump

  tokenizer-done:  ( tokenizer last-byte )
  drop ( tokenizer )

  tokenizer-done-done: tokenizer-finish-output return2 ( next-token length )
;

: tokenizer-finish-output
  arg0 literal S-TERMINATOR tokenizer-push drop
  tokenizer-buffer-start swap
  tokenizer-buffer-offset swapdrop cell/ swapdrop literal 1 int-sub set-tokenizer-buffer-length
  return2
;

: read-line
  start-seq
  literal read-line-loop jump

  read-line-loop: read-byte dup
  literal char-code \n equals literal read-line-done ifthenjump
  dpush
  literal read-line-loop jump

  read-line-done: dpush end-seq return1
;

: head-seq
  arg0 peek return1
;

: tail-seq
  arg0 cell+ return1
;
  
: map-seq
  ( seq entry )
  arg1 cell+ swapdrop

  map-seq-loop:
  ( seq )
  local0 head-seq swapdrop ( head )
  null? literal map-seq-done ifthenjump
  arg0 exec ( head result )
  local0 tail-seq store-local0 ( result seq )
  drop2
  literal map-seq-loop jump

  map-seq-done: return0
;

: copy
  literal 0
  copy-loop:
  ( dest )
  local0 arg1 int-add
  ( src )
  local0 arg2 int-add
  peek
  ( store )
  swap poke
  ( inc )
  local0 cell+ swapdrop store-local0
  ( loop? )
  dup arg0 <= literal copy-loop ifthenjump
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

: copyrev
  ( src dest num-bytes )
  arg0 cell- swapdrop
  zero

  copyrev-loop:
  ( dest )
  local1 arg1 int-add
  ( src )
  local0 arg2 int-add
  peek
  ( store )
  swap poke
  ( dec )
  local0 cell- swapdrop store-local0
  ( inc )
  local1 cell+ swapdrop store-local1
  ( loop? )
  dup arg0 < literal copyrev-loop ifthenjump
;

: terminate-seq
  ( ptr num-cells )
  literal S-TERMINATOR
  arg1
  arg0 literal 1 int-add
  ( set length )
  cell* swapdrop
  int-add
  poke
;

: intern-seq
  ( seq-ptr num-cells )
  ( calc byte size & alloc )
  arg0 dallot
  ( copy )
  cell+ arg1
  cell+ swapdrop swap
  arg0 cell* swapdrop
  copy
  drop3
  ( terminate )
  arg0 terminate-seq
  drop
  return1
;

: intern
  arg0 dallot
  ( copy )
  cell+ arg1 swap arg0 cell* swapdrop copy drop3
  ( terminate )
  arg0 terminate-seq drop return1
;

: internrev
  arg0 dallot
  ( copy )
  cell+ arg1 swap arg0 cell* swapdrop copyrev drop3
  ( terminate )
  arg0 terminate-seq drop return1
;

: tokenize
  literal S-TERMINATOR
  arg0 make-tokenizer swapdrop

  tokenize-loop:
  next-token
  dup ( tokenizer token length length )
  literal 0 equals literal tokenize-done ifthenjump
  intern-seq ( tokenizer token length symbol )
  rotdrop2 ( tokenizer symbol )
  write-line
  swap ( symbol tokenizer )
  literal tokenize-loop jump

  tokenize-done:
  drop ( the length )
  drop ( the null token )
  drop ( the state )
  ( pop the tokens into a list )
  start-seq

  tokenize-pop-loop:
  swap terminator? literal tokenize-pop-loop-done ifthenjump
  dpush
  literal tokenize-pop-loop jump

  tokenize-pop-loop-done:
  drop ( terminator )
  end-seq
  return1
;

: each-token
  ( str fn )
  literal S-TERMINATOR
  arg1 make-tokenizer swapdrop

  each-token-loop: ( tokenizer )
  next-token ( tokenizer next-tokenizer token )
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

: immediate-lookup
  arg0 immediate-dict dict-lookup
  return1
;

: immediate-dict
  literal immediate-dictionary peek
  return1
;

: immediate-dict-add
  arg2 arg1 arg0 immediate-dict make-dict
  literal immediate-dict-sym set-var
  drop return1
;

: add-immediate-as
  ( entry name )
  arg1
  arg0
  swap dict-entry-code
  swap dict-entry-data
  swapdrop immediate-dict-add
  return0
;

: add-immediate
  arg0 dict-entry-name add-immediate-as
;

: write-line
  arg0 write-string write-crnl
;

: write-line-n
  arg1 arg0 write-string-n write-crnl
;

: write-line-ret
  arg0 write-string write-crnl
  literal 0 return1
;

: write-seq
  arg0 literal write-line-ret map-seq
;

: write-tokens
  arg0 literal write-line-ret each-token
;

: write-tokens1
  arg0 tokenize literal write-line-ret map-seq
;

( Constants )

: constant-capturer
  start-seq
  literal literal dpush
  arg0 dpush
  literal return1 dpush
  end-seq
  cell+ return1
;
  
: constant
  ( value name )
  arg0 literal call-data-code arg1 constant-capturer
  swapdrop add-dict
;

: const
  ( value : name )
  next-param literal call-data-code arg0 constant-capturer
  swapdrop add-dict
;

: does-var
  ( entry init-value )
  literal variable-peeker-code arg1 set-dict-entry-code
  arg0 arg1 set-dict-entry-data
;

: [variable]
  ( value name )
  arg0 [create] arg1 does-var
  drop return1
;

: variable
  ( value : name )
  create arg0 does-var
;

: set-var
  ( value name )
  ( return the entry )
  ( lookup if not found then define )
  arg0 dict dict-lookup null? literal set-not-found ifthenjump
  ( found )
  arg1 swap set-dict-entry-data
  ( make sure the code is a variable's )
  literal variable-peeker-code swap set-dict-entry-code
  return1
  ( else set data )
  set-not-found: arg1 arg0 [variable]
  return1
;

: mark
  dict literal the-mark-sym constant
;

: forget
  literal the-mark-sym dict dict-lookup
  dict-entry-data set-dict
;

: drop-dict
  dict dict-entry-next set-dict
;
  
: dict-forget
  ( name dict )
  ( find parent )
  arg1 arg0 dict-lookup-parent
  dup not literal dict-forget-done ifthenjump
  dict-entry-next dict-entry-next ( parent child grandkid )
  ( link parent to child )
  rot set-dict-entry-next
  dict-forget-done: return0
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

( Read and intern the next token. )
: lit
  *tokenizer* next-token dup not literal lit-no-token ifthenjump
  intern-seq return1
  lit-no-token: literal eos-sym error return0
;

( A postponed LIT. )
: c-lit
  literal literal lit return2
; immediate-as lit

( Read the next token and look it up in the dictionary. )
: '
  *tokenizer* next-token not literal '-no-token ifthenjump
  dict dict-lookup return1
  '-no-token: literal eos-sym error return0
;

( Actually emit ' when ' is redefined to emit LITERAL. )
: [']
  literal ' return1
; immediate-only

( No need to perform a double lookup since compilation does that. )
: c-'
  literal literal return1
; immediate-as '

( fixme: need to read strings larger than the tokenizer's buffer )

: "
  *tokenizer* literal 34 tokenizer-read-until intern-seq return1
; immediate

: c-"
  literal literal POSTPONE " return2
; immediate-as "

: wait-return
  literal press-return-sym
  write-string flush-read-line
;

: write-status
  *status* not literal write-status-ok ifthenjump
  write-err literal 0 literal *status*-sym set-var return0
  write-status-ok: write-ok
;
  
: error
  ( error-msg2 error-msg1 )
  bright red arg0 write-line color-reset
  arg1 write-line wait-return
  arg0 literal *status*-sym set-var
  literal 0 literal *state*-sym set-var drop3
  quit ( exit caller )
;

( fixme a frame not linking to it's parent as the parent's link gets overwritten by data )

: if-test
  arg0 IF write-ok return0 THEN
  write-err return0
;

( Look a token up or try converting to a number. )
: interp ( token ++ value executable? )
  arg0 dict dict-lookup dup IF *state* not return2 THEN
  drop2 number IF literal 0 return2 THEN

  drop literal not-found-sym error
  literal 0 literal 0 return2
;

: compile ( tok -- lookup executable? )
  arg0 immediate-lookup dup IF literal 1 return2 THEN
  drop
  interp return2
;

: next-word
  *tokenizer* next-token return2
;

: eval-tokens
  ( ++ str )
  next-word UNLESS drop literal eval-loop jump-entry-data THEN
  ( compile lookup )
  *state* UNLESS interp THEN
  *state* IF compile THEN
  ( exec? )
  IF swapdrop exec RECURSE THEN
  swapdrop RECURSE
  ( literal eval-loop tailcall )
;

: make-the-tokenizer
  arg0 make-tokenizer ( tokenizer )
  literal the-tokenizer-sym set-var drop2
  return1
;

: eval-string
  end drop2 ( not coming back! )
  ( arg0 ) make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;

: stack-depth
  stack-top args uint-sub return1
;

: write-depth
  stack-depth write-unsigned-int
;

: eval-loop
  write-status write-int write-tab dim write-depth
  color-reset prompt
  flush-read-line
  blue write-string color-reset
  make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;

: unset-tokenizer-stop-flag
  literal 0
  literal *stop-tokenizing*-sym
  set-var
  return0
;

: set-tokenizer-stop-flag
  literal 1
  literal *stop-tokenizing*-sym
  set-var
  return0
;

: pop-to-seq
  ( start-ptr )
  start-seq
  arg0
  args cell+2 swapdrop

  pop-to-seq-loop:
  local1 peek
  dpush
  local1 local2 < literal pop-to-seq-done ifthenjump
  local1 cell- store-local1 drop
  literal pop-to-seq-loop jump

  pop-to-seq-done: local0 end-seq return1
;

: stack-find
  ( start-location needle ++ ptr )
  arg1
  stack-find-loop:
  local0 peek arg0 equals literal stack-find-done ifthenjump
  local0 cell+ store-local0 drop
  literal stack-find-loop jump
  stack-find-done: local0 return1
;
  
: [
  literal 1 literal *state*-sym set-var
  terminator return1
; immediate

: ]
  literal 0 literal *state*-sym set-var drop3
  args terminator stack-find swapdrop cell- swapdrop
  swap 2dup int-sub cell/ swapdrop literal 1 int-add internrev
  seq-length literal 1 int-add return1-n
; immediate
  
: [create]
  arg1 arg0 intern-seq
  literal 0 literal 0 add-dict
  return1
;

: create
  *tokenizer* next-token dup not literal create-fail ifthenjump
  [create] return1

  create-fail:
  literal eos-sym error
;

: pause2
  *debug* IF wait-return THEN
;
  
: docol>
  literal call-data-seq-code arg0 set-dict-entry-code
  [
  return2
;

: endcol
  end drop2
  literal return0
  ]
  swap set-dict-entry-data drop2
  literal eval-tokens jump-entry-data
; immediate-as ;

: :
  create docol> return2
;

: flush-read-line
  input-reset read-line input-reset
  return1
;

: zero
  literal 0 return1
;

: false
  literal 0 return1
;

: terminator
  literal S-TERMINATOR return1
;

: one
  literal 1 return1
;
: true
  literal 1 return1
;

: cell-size
  literal 4 return1
;

: cell/
  arg0 cell-size int-div
  return1
;

: cell*
  arg0 cell-size int-mul
  return1
;

: cell+
  cell-size arg0 int-add
  return1
;

: cell+n
  cell-size arg0 int-mul
  arg1 int-add
  return1
;

: cell+2
  arg0 literal 2 cell+n
  return1
;

: cell+3
  arg0 literal 3 cell+n
  return1
;

: cell-
  arg0 cell-size int-sub
  return1
;

: cell-2
  arg0 literal -2 cell+n
  return1
;

: cell-3
  arg0 literal -3 cell+n
  return1
;

: tail-call-test-1
  arg0 literal 0 equals literal tail-call-test-1-done ifthenjump
  literal HELO write-word
  arg0 literal 1 int-sub
  literal tail-call-test-1 tailcall1
  tail-call-test-1-done: arg0 return1
;

: tail-call-test
  literal longify \r\nGO write-word
  ( fixme arg0? )
  arg0 literal tail-call-test-1 tailcall1
;

: cont-test
  literal write-line
  pause
  cont
;

: digit-char
  arg0 literal 48 int-sub return1
;

: char-digit
  arg0 abs-int literal 48 int-add return1
;
  
: unsigned-number
  zero
  arg0 seq-length swap
  cell+ swapdrop
  unsigned-number-loop:
  dup peek
  dup negative-sign equals literal unsigned-number-skip ifthenjump
  whitespace? literal unsigned-number-skip ifthenjump
  terminator? literal unsigned-number-done ifthenjump
  digit? not literal unsigned-number-error ifthenjump
  digit-char swapdrop
  local0 literal 10 int-mul
  int-add store-local0
  unsigned-number-inc:
  cell+ swapdrop
  swap literal 1 int-sub swap
  literal unsigned-number-loop jump
  unsigned-number-skip: drop literal unsigned-number-inc jump
  unsigned-number-error: literal 0 literal 0 return2
  unsigned-number-done: local0 true return2
;

: negate
  literal 0 arg0 int-sub return1
;
  
: number
  arg0 cell+ swapdrop peek negative-sign equals literal number-negative ifthenjump
  arg0 unsigned-number return2
  number-negative: arg0 unsigned-number swap negate swapdrop swap return2
;

: abs-int
  arg0 literal 0 > literal abs-int-done ifthenjump
  abs-int-negate: arg0 negate set-arg0
  abs-int-done: return0
;
  
: unsigned-int-to-string
  arg0
  here
  unsigned-int-to-string-loop:
  local0 base uint-mod char-digit swapdrop
  local0 base uint-div dup store-local0 literal unsigned-int-to-string-loop ifthenjump
  here dup local1 swap uint-sub cell/ swapdrop literal 1 uint-sub intern return1
;

: int-to-string
  arg0
  true
  here cell-2 swapdrop
  arg0 literal 0 < literal int-to-string-neg ifthenjump
  int-to-string-loop:
  local0 base int-mod char-digit swapdrop
  local0 base int-div dup store-local0 literal int-to-string-loop ifthenjump
  local1 literal int-to-string-pos ifthenjump
  negative-sign
  int-to-string-pos:
  here dup local2 swap int-sub cell/ swapdrop literal 1 int-add intern return1
  int-to-string-neg:
  local0 negate store-local0 drop
  false store-local1
  literal int-to-string-loop jump
;

: write-unsigned-int
  arg0 unsigned-int-to-string write-string
;

: write-int
  arg0 int-to-string write-string
;

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

: seq-poke ( v seq n )
  arg2 arg1 arg0 cell+n rotdrop2 cell+ swapdrop
  poke
;

: seq-peek ( [seq n] todo bounds checking )
  arg1 arg0 cell+n cell+ rotdrop2
  peek return1
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

: load
  literal eval-string jump-entry-data
;
