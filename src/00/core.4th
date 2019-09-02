( Functions for a token evaluator using the primitive ops. )

( Sequences )

: terminator
  int32 $504f5453 return1
;

: terminator?
  arg0 terminator equals IF int32 1 return1 THEN
  int32 0 return1
;

: start-seq
  int32 0 dpush
  dhere return1
;

: end-seq ( seq-ptr )
  dhere
  terminator dpush
  ( calc length )
  arg0 int-sub
  int32 4 int-div
  ( set length )
  arg0 poke
;

: abort-seq ( seq-ptr )
  arg0 dmove
  ddrop
;

: seq-data
    arg0 cell+
    return1
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
  int32 4 return1
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
  arg0 int32 2 cell+n
  return1
;

: cell+3
  arg0 int32 3 cell+n
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
  arg0 int32 -2 cell+n
  return1
;

( Strings )

( Compares to values returning -1 if the first is less, 0 if equal, and 1 if greater. )
: <=> ( a b ++ result )
  arg1 arg0 < IF int32 -1 return1 THEN
  arg1 arg0 > IF int32 1 return1 THEN
  int32 0 return1
;

: string-cmp-n/4 ( seq-a seq-b max counter! ++ result )
  arg3 arg0 seq-peek rotdrop2
  arg2 arg0 seq-peek rotdrop2
  <=> rotdrop2 dup UNLESS
    drop
    arg0 int32 1 int-add
    dup set-arg0
    arg1 < IF RECURSE THEN
    int32 0 return1
  THEN

  return1
;

: string-cmp-n ( seq-a seq-b length ++ result )
  arg2 arg1 arg0 int32 0 string-cmp-n/4 return1
;

: string-cmp ( seq-a seq-b ++ result )
  arg1 arg0 seq-length int32 0 string-cmp-n/4 return1
;

: string-equal-n ( seq-a seq-b length ++ equal? )
  arg2 arg1 arg0 string-cmp-n UNLESS int32 1 return1 THEN
  int32 0 return1
;

: string-equal ( seq-a seq-b ++ equal? )
  ( lengths )
  arg0 seq-length swapdrop
  arg1 seq-length swapdrop
  equals UNLESS
    ( lengths are different )
    int32 0 return1
  THEN

  arg1 arg0 seq-length string-equal-n return1
;

( Call frames: )

: frame-size
  int32 2 cell* return1
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
  arg2 arg1 arg0 int32 0 copy-n
;

( Sequence storage )

: terminate-seq ( ptr num-cells )
  terminator
  ( calc length )
  arg0 int32 1 int-add
  cell* swapdrop
  arg1 int-add
  ( store terminator )
  poke
;

: intern-seq
  ( seq-ptr num-cells )
  ( calc byte size & alloc )
  arg0 dallot-seq
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
  arg0 dallot-seq
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
  literal 0 dpush ( doc )
  literal 0 dpush ( args )
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

: dict-entry-doc
  arg0 UNLESS int32 0 return1 THEN
  arg0 literal 3 cell+n peek return1
;

: set-dict-entry-doc
  arg1 arg0 literal 3 cell+n rotdrop2 poke return0
;
  
: dict-entry-args
  arg0 UNLESS int32 0 return1 THEN
  arg0 literal 4 cell+n peek return1
;

: set-dict-entry-args
  arg1 arg0 literal 4 cell+n rotdrop2 poke return0
;

: dict-entry-next
  arg0 UNLESS int32 0 return1 THEN
  arg0 literal 5 cell+n peek return1
;

: set-dict-entry-next
    arg1 arg0 literal 5 cell+n
    rotdrop2 poke return0
;
  
: dict-lookup-parent
  arg0 dict-entry-next
  terminator? IF int32 0 return1 THEN
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
(  arg0 int32 *status*-sym set-var
  int32 0 int32 *state*-sym set-var drop3
  quit ( exit caller )
( ;
)

( Dictionary helpers )

: [create]
  arg1 arg0 intern-seq
  int32 0 int32 0 add-dict
  return1
;

: create
  next-token dup UNLESS " End of stream" error THEN
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
  doc( Add an entry to the dictionary for a new variable that stores its value at `dhere`. The entry stores a pointer. `peek` gets the value and `poke` will set it. )
  args( value : name ++ )
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
  int32 0 return1
;

: true
  int32 1 return1
;

: zero
  int32 0 return1
;

( Character classifiers )

: space?
  arg0 int32 $20 equals
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
  arg0 int32 0 equals
  arg0 terminator equals
  or return1
;

: in-range?
  ( Max min value )
  arg0 dup arg1 >= IF
    arg2 <= IF int32 1 return1 THEN
    int32 0 return1
  THEN
  
  drop int32 0 return1
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

: tokenizer-exhausted?
  arg0 peek
  seq-length cell*
  arg0 tokenizer-str-offset swapdrop
  < return1
;
  
: tokenizer-peek-word
  arg0
  tokenizer-exhausted? IF int32 0 return1 THEN
  tokenizer-str-ptr peek
  return1
;

: tokenizer-next-word
  arg0 tokenizer-peek-word dup UNLESS return1 THEN
  swap tokenizer-inc-str-offset
  drop return1 ( tokenizer cell )
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

: token-max-cell-size int32 128 return1 ;
: token-max-byte-size token-max-cell-size cell* return1 ;

( token-buffer string ++ tokenizer )
( tokenizer structure: str-ptr str-offset token-seq token-seq-offset )
: make-tokenizer
  arg0 dpush
  dhere
  int32 0 dpush
  arg1 dpush
  int32 0 dpush
  return1
;

: make-the-tokenizer
  *tokenizer* peek dup IF tokenizer-buffer THEN
  dup UNLESS token-max-cell-size dallot-seq THEN
  arg0 make-tokenizer ( tokenizer )
  *tokenizer* poke
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
  ( tokenizer character )
  arg1 tokenizer-buffer-ptr
  arg0 swap poke
  tokenizer-inc-buffer-offset
;

: set-tokenizer-buffer-offset
  arg1 cell+3
  arg0
  swap poke
;

: fill-loop ( ptr number-bytes counter )
  arg0 dup arg2 int-add
  int32 0 swap poke
  cell+ swapdrop
  dup set-arg0
  arg1 <= IF RECURSE THEN
;

: fill ( ptr number-bytes )
  arg1 arg0 int32 0 fill-loop
;

: tokenizer-buffer-reset
  arg0 int32 0 set-tokenizer-buffer-offset drop
  tokenizer-buffer-ptr
  token-max-byte-size int32 2 cell* swapdrop int-sub
  fill
;

: set-tokenizer-buffer-length
  arg0 arg1 poke
;

: tokenizer-next-token-loop
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

: tokenizer-next-token
  ( tokenizer -> string-past-token token )
  arg0
  tokenizer-eat-spaces
  tokenizer-buffer-reset
  tokenizer-next-token-loop return2
;

: tokenizer-finish-output
  arg0 terminator tokenizer-push drop
  tokenizer-buffer-start swap
  tokenizer-buffer-offset swapdrop cell/ swapdrop int32 1 int-sub set-tokenizer-buffer-length
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

: call-frame-size
    cell-size int32 2 int-mul return1
;

: argn
    arg0 cell* call-frame-size int-add
    current-frame parent-frame swapdrop int-add
    peek set-arg0
;

( Some signed math: )

: abs-int
  arg0 int32 0 > UNLESS
    arg0 negate set-arg0
  THEN
;
  
: negate
  int32 0 arg0 int-sub return1
;

( String to number conversion. )

( Convert an ASCII character to a digit. )
: digit-char
  arg0 upper-alpha? IF
    int32 65 int-sub
    int32 10 int-add
    return1
  THEN
  arg0 lower-alpha? IF
    int32 97 int-sub
    int32 10 int-add
    base peek int32 36 >= IF int32 26 int-add THEN
    return1
  THEN
  arg0 digit? IF
    int32 48 int-sub return1
  THEN
  int32 -1 return1
;

( Convert a single digit to an ASCII digit or letter. )
: char-digit
  arg0 abs-int
  local0 int32 10 >= IF
    local0 int32 10 int-sub
    dup int32 26 >= IF
      int32 26 int-sub
      int32 97 int-add
      return1
    THEN
    int32 65 int-add return1
  THEN
  local0 int32 48 int-add return1
;

: negative-sign
  int32 45 return1
;

: negative-sign?
  arg0 negative-sign equals return1
;

( Does not handle base prefixes. )
: unsigned-number
  int32 0
  arg0 seq-length swap
  cell+ swapdrop
  unsigned-number-loop:
  dup peek
  negative-sign? UNLESS
    whitespace? UNLESS
      terminator? IF local0 int32 1 return2 THEN
      digit? UNLESS int32 0 int32 0 return2 THEN
      digit-char swapdrop
      local0 base peek int-mul
      int-add store-local0
      unsigned-number-inc:

      cell+ swapdrop
      swap int32 1 int-sub swap
      literal unsigned-number-loop jump
    THEN
  THEN
  drop literal unsigned-number-inc jump

  cell+ swapdrop
  swap int32 1 int-sub swap
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
  drop2 number IF int32 0 return2 THEN

  drop " Not Found" error
  int32 0 int32 0 return2
;

: next-token
  *tokenizer* peek dup IF tokenizer-next-token return2 THEN
  int32 0 int32 0 return2
;

: eval-loop
  ( ++ str )
  next-token UNLESS drop eval-read-line eval-string THEN ( todo change the tokenizer's string instead )
  ( compile lookup )
  *state* peek UNLESS interp THEN
  *state* peek IF *state* peek exec THEN
  ( exec? )
  IF swapdrop exec RECURSE THEN
  swapdrop RECURSE
  ( literal eval-loop tailcall )
;

: eval-string
  drop-call-frame ( not coming back! ) ( todo needs to return to the caller )
  ( arg0 ) make-the-tokenizer drop
  literal eval-loop jump-entry-data
;

: load
  literal eval-string jump-entry-data
;
