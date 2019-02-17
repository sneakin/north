( Functions for a token evaluator using the primitive ops. )

( Sequences )

: terminator
  literal $504f5453 return1
;

: terminator?
  arg0 terminator equals IF literal 1 return1 THEN
  literal 0 return1
;

: start-seq
  literal 0 dpush
  dhere return1
;

: end-seq ( seq-ptr )
  dhere
  terminator dpush
  ( calc length )
  arg0 int-sub
  literal 4 int-div
  ( set length )
  arg0 poke
;

: abort-seq ( seq-ptr )
  arg0 dmove
  ddrop
;

: seq-length
  arg0 peek return1
;

: seq-byte-size
  arg0 seq-length cell*
  return1
;

: seq-poke ( v seq n )
  arg2 arg1 arg0 cell+n rotdrop2 cell+ swapdrop
  poke
;

: seq-peek ( [seq n] todo bounds checking )
  arg1 arg0 cell+n cell+
  peek return1
;

( Cells )

: cell-size
  literal 4 return1
;

: cell*
  arg0 cell-size int-mul
  return1
;

: cell/
  arg0 cell-size int-div
  return1
;

: cell+n
  arg0 cell*
  arg1 int-add
  return1
;

: cell+
  cell-size arg0 int-add
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

: cell-n
  arg0 cell*
  arg1 int-sub
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

( Strings )

( Compares to values returning -1 if the first is less, 0 if equal, and 1 if greater. )
: <=> ( a b ++ result )
  arg1 arg0 < IF literal -1 return1 THEN
  arg1 arg0 > IF literal 1 return1 THEN
  literal 0 return1
;

: string-cmp-n/4 ( seq-a seq-b max counter! ++ result )
  arg3 arg0 seq-peek rotdrop2
  arg2 arg0 seq-peek rotdrop2
  <=> rotdrop2 dup UNLESS
    drop
    arg0 literal 1 int-add
    dup set-arg0
    arg1 < IF RECURSE THEN
    literal 0 return1
  THEN

  return1
;

: string-cmp-n ( seq-a seq-b length ++ result )
  arg2 arg1 arg0 literal 0 string-cmp-n/4 return1
;

: string-cmp ( seq-a seq-b ++ result )
  arg1 arg0 seq-length literal 0 string-cmp-n/4 return1
;

: string-equal-n ( seq-a seq-b length ++ equal? )
  arg2 arg1 arg0 string-cmp-n UNLESS literal 1 return1 THEN
  literal 0 return1
;

: string-equal ( seq-a seq-b ++ equal? )
  ( lengths )
  arg0 seq-length swapdrop
  arg1 seq-length swapdrop
  equals UNLESS
    ( lengths are different )
    literal 0 return1
  THEN

  arg1 arg0 seq-length string-equal-n return1
;

( Call frames: )

: frame-size
  literal 2 cell* return1
;

: parent-frame
  arg0 peek return1
;

: set-arg0
  current-frame parent-frame
  frame-size int-add
  arg0 swap poke
  return-1
;

( Sequence copying )

: copy-n ( src dest number counter )
  ( dest )
  arg0 arg2 int-add
  ( src )
  arg0 arg3 int-add
  peek
  ( store )
  swap poke
  ( inc )
  arg0 cell+ swapdrop set-arg0
  ( loop? )
  arg0 arg1 <= IF RECURSE THEN
;

: copy ( src dest number )
  arg2 arg1 arg0 literal 0 copy-n
;

( Sequence storage )

: terminate-seq ( ptr num-cells )
  terminator
  ( calc length )
  arg0 literal 1 int-add
  cell* swapdrop
  arg1 int-add
  ( store terminator )
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

( Dictionary )

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
  arg0 UNLESS literal 0 return1 THEN
  arg0 cell+3 peek return1
;

: set-dict-entry-next
  arg1 arg0 cell+3 swapdrop poke return0
;
  
: dict-lookup-parent
  arg0 dict-entry-next
  terminator? IF literal 0 return1 THEN
  dict-entry-name arg1 string-equal IF drop3 return1 THEN
  drop2 swapdrop set-arg0
  RECURSE
;

: dict-lookup
  ( check dict's head )
  arg0 dict-entry-name arg1 string-equal IF arg0 return1 THEN
  ( search the list )
  arg1 arg0 dict-lookup-parent dict-entry-next return1
;

( Basic error quiting )

(
: error
  ( error-msg2 error-msg1 )
(  arg0 literal *status*-sym set-var
  literal 0 literal *state*-sym set-var drop3
  quit ( exit caller )
( ;
)

( Dictionary helpers )

: [create]
  arg1 arg0 intern-seq
  literal 0 literal 0 add-dict
  return1
;

: create
  next-word dup UNLESS " End of stream" error THEN
  [create] return1
;

( Constants )

( Returns a colon sequence that returns the argument. )
: constant-capturer
  start-seq
  literal literal dpush
  arg0 dpush
  literal return1 dpush
  end-seq
  cell+ return1
;
  
: does-constant
  ( entry init-value )
  literal value-peeker dict-entry-code swapdrop
  arg1 set-dict-entry-code
  arg0 arg1 set-dict-entry-data
;

: [constant]
  ( value name )
  arg0 seq-length [create] arg1 does-constant
  drop return1
;

: constant'
  ( value : name )
  arg0 next-param [constant]
;

: constant
  ( value : name )
  create arg0 does-constant
;

( Variables )

: does-var
  ( entry init-value )
  literal variable-peeker dict-entry-code swapdrop
  arg1 set-dict-entry-code
  arg0 dpush dhere arg1 set-dict-entry-data
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

( Dictionary initialization )

: mark
  dict lit *mark* [constant]
;

: forget
  lit *mark* dict dict-lookup
  dict-entry-data set-dict
;

: drop-dict
  dict dict-entry-next set-dict
;

: immediate-dict-init
  literal immediate-dictionary peek
  immediate-dict poke
;

: dict-init
  literal dictionary peek
  set-dict
  immediate-dict-init
  mark
;

( Input )

: read-line-inner
  read-byte dup
  literal char-code \n equals IF dpush return0 THEN
  dpush
  RECURSE
;

: read-line
  start-seq
  read-line-inner
  end-seq return1
;

: flush-read-line
  input-reset read-line input-reset
  return1
;

( Logic )

: or
  arg0 IF arg0 return1 THEN
  arg1 return1
;

: false
  literal 0 return1
;

: true
  literal 1 return1
;

: zero
  literal 0 return1
;

( Character classifiers )

: space?
  arg0 literal $20 equals
  return1
;

: whitespace?
  arg0 space? swap literal char-code \r equals
  arg0 literal char-code \n equals
  arg0 literal char-code \t equals
  arg0 literal char-code \v equals
  arg0 literal char-code \f equals
  or rotdrop2
  or rotdrop2
  or rotdrop2
  or rotdrop2
  or rotdrop2
  return1
;

: null?
  arg0 literal 0 equals
  arg0 terminator equals
  or return1
;

: in-range?
  ( Max min value )
  arg0 dup arg1 >= IF
    arg2 <= IF literal 1 return1 THEN
    literal 0 return1
  THEN
  
  drop literal 0 return1
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

( Tokenizing with state )

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
  tokenizer-exhausted? IF literal 0 return1 THEN
  arg0 tokenizer-str-ptr peek
  return1
;

: tokenizer-exhausted?
  arg0 peek
  seq-length cell*
  arg0 tokenizer-str-offset swapdrop
  < return1
;
  
: tokenizer-next-word
  arg0
  tokenizer-exhausted? IF literal 0 return1 THEN
  tokenizer-str-ptr peek
  swap tokenizer-inc-str-offset
  swap return1 ( tokenizer cell )
;

( todo use a function and refactor eat-spaces )

: tokenizer-skip-until
  ( tokenizer needle )
  arg1 tokenizer-next-word null? IF return0 THEN
  dup arg0 equals IF return0 THEN
  drop RECURSE
;

: tokenizer-eat-spaces
  arg0 tokenizer-peek-word
  whitespace? UNLESS return0 THEN
  drop
  tokenizer-inc-str-offset
  drop RECURSE
;

( fixme limit length read to buffer size )

: tokenizer-read-until-loop
  ( tokenizer needle ++ output-seq length )
  arg1 tokenizer-next-word null? UNLESS
    dup arg0 equals UNLESS
      tokenizer-push drop2
      RECURSE
    THEN
  THEN

  drop tokenizer-finish-output return2
;

: tokenizer-read-until
  ( tokenizer needle ++ output-seq length )
  arg1 tokenizer-buffer-reset
  arg0 tokenizer-read-until-loop return2
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

: make-the-tokenizer
  arg0 make-tokenizer ( tokenizer )
  *tokenizer* poke
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

: fill-loop ( ptr number-cells counter )
  arg0 dup arg2 int-add
  literal 0 swap poke
  cell+ swapdrop
  dup set-arg0
  dup arg1 <= IF RECURSE THEN
;

: fill
  arg1 arg0 literal 0 fill-loop
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

: next-token-loop
  arg0 tokenizer-next-word ( tokenizer byte )
  null? UNLESS
    whitespace? UNLESS
      tokenizer-push drop2
      RECURSE
    THEN
  THEN

  drop ( tokenizer )
  tokenizer-finish-output return2 ( next-token length )
;

: next-token
  ( tokenizer -> string-past-token token )
  arg0
  tokenizer-eat-spaces
  tokenizer-buffer-reset
  next-token-loop return2
;

: tokenizer-finish-output
  arg0 terminator tokenizer-push drop
  tokenizer-buffer-start swap
  tokenizer-buffer-offset swapdrop cell/ swapdrop literal 1 int-sub set-tokenizer-buffer-length
  return2
;

( Call frames continued: )

: set-arg1
  current-frame parent-frame
  frame-size cell+ swapdrop
  int-add
  arg0 swap poke
  return-1
;
  
: set-arg2
  current-frame parent-frame
  frame-size cell+2 swapdrop
  int-add
  arg0 swap poke
  return-1
;

: set-arg3
  current-frame parent-frame
  frame-size cell+3 swapdrop
  int-add
  arg0 swap poke
  return-1
;

: argn
  arg0 cell* cell+2 current-frame parent-frame swapdrop int-add peek set-arg0
;

( Some signed math: )

: abs-int
  arg0 literal 0 > UNLESS
    arg0 negate set-arg0
  THEN
;
  
: negate
  literal 0 arg0 int-sub return1
;

( String to number conversion. )

( Convert an ASCII character to a digit. )
: digit-char
  arg0 upper-alpha? IF
    literal 65 int-sub
    literal 10 int-add
    return1
  THEN
  arg0 lower-alpha? IF
    literal 97 int-sub
    literal 10 int-add
    base peek literal 36 >= IF literal 26 int-add THEN
    return1
  THEN
  arg0 digit? IF
    literal 48 int-sub return1
  THEN
  literal 0 return1
;

( Convert a single digit to an ASCII digit or letter. )
: char-digit
  arg0 abs-int
  local0 literal 10 >= IF
    local0 literal 10 int-sub
    dup literal 26 >= IF
      literal 26 int-sub
      literal 97 int-add
      return1
    THEN
    literal 65 int-add return1
  THEN
  local0 literal 48 int-add return1
;

: negative-sign
  literal 45 return1
;

: negative-sign?
  arg0 negative-sign equals return1
;

( Does not handle base prefixes. )
: unsigned-number
  literal 0
  arg0 seq-length swap
  cell+ swapdrop
  unsigned-number-loop:
  dup peek
  negative-sign? UNLESS
    whitespace? UNLESS
      terminator? IF local0 literal 1 return2 THEN
      digit? UNLESS literal 0 literal 0 return2 THEN
      digit-char swapdrop
      local0 base peek int-mul
      int-add store-local0
      unsigned-number-inc:

      cell+ swapdrop
      swap literal 1 int-sub swap
      literal unsigned-number-loop jump
    THEN
  THEN
  drop literal unsigned-number-inc jump

  cell+ swapdrop
  swap literal 1 int-sub swap
  literal unsigned-number-loop jump
;

: number
  arg0 cell+ swapdrop peek negative-sign equals UNLESS
    arg0 unsigned-number return2
  THEN
  arg0 unsigned-number swap negate swapdrop swap return2
;

( Evaluation )

( Look a token up or try converting to a number. )
: interp ( token ++ value executable? )
  arg0 dict dict-lookup dup IF *state* peek not return2 THEN
  drop2 number IF literal 0 return2 THEN

  drop " Not Found" error
  literal 0 literal 0 return2
;

: next-word
  *tokenizer* peek next-token return2
;

: eval-tokens
  ( ++ str )
  POSTPONE next-word UNLESS drop literal eval-loop jump-entry-data THEN
  ( compile lookup )
  *state* peek UNLESS interp THEN
  *state* peek IF *state* peek exec THEN
  ( exec? )
  IF swapdrop exec RECURSE THEN
  swapdrop RECURSE
  ( literal eval-loop tailcall )
;

: eval-string
  end drop2 ( not coming back! )
  ( arg0 ) make-the-tokenizer drop2
  literal eval-tokens jump-entry-data
;

: load
  literal eval-string jump-entry-data
;
