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
  2dup terminator equals
  swap terminator equals
  logand literal string-equal-done ifthenjump
  ( elements match? )
  equals literal string-equal-loop ifthenjump
  ( not equal )
  literal 0 return1

  string-equal-done:
  literal 1 return1
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
  arg0

  dict-lookup-parent-loop:
  dict-entry-next
  terminator? IF literal 0 return1 THEN
  dict-entry-name arg1 string-equal IF drop3 return1 THEN
  drop2 swapdrop literal dict-lookup-parent-loop jump
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
  *tokenizer* next-token dup UNLESS " End of stream" error THEN
  [create] return1
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
  
: [constant]
  ( value name )
  arg0 literal call-data-code arg1 constant-capturer
  swapdrop add-dict
;

: constant
  ( value : name )
  next-word [constant]
;

( Variables )

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
  
: dict-init
  literal dictionary peek
  set-dict
  mark
;

( Input )

: read-line
  start-seq
  literal read-line-loop jump

  read-line-loop: read-byte dup
  literal char-code \n equals literal read-line-done ifthenjump
  dpush
  literal read-line-loop jump

  read-line-done: dpush end-seq return1
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
  ( tokenizer needle ++ output-seq length )
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

: make-the-tokenizer
  arg0 make-tokenizer ( tokenizer )
  lit *tokenizer* set-var drop2
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
  arg0 literal 0 > literal abs-int-done ifthenjump
  abs-int-negate: arg0 negate set-arg0
  abs-int-done: return0
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
    base literal 36 >= IF literal 26 int-add THEN
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
  negative-sign? literal unsigned-number-skip ifthenjump
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
  unsigned-number-done: local0 literal 1 return2
;

: number
  arg0 cell+ swapdrop peek negative-sign equals literal number-negative ifthenjump
  arg0 unsigned-number return2
  number-negative: arg0 unsigned-number swap negate swapdrop swap return2
;

( Evaluation )

( Look a token up or try converting to a number. )
: interp ( token ++ value executable? )
  arg0 dict dict-lookup dup IF *state* not return2 THEN
  drop2 number IF literal 0 return2 THEN

  drop " Not Found" error
  literal 0 literal 0 return2
;

: next-word
  *tokenizer* next-token return2
;

: eval-tokens
  ( ++ str )
  next-word UNLESS drop literal eval-loop jump-entry-data THEN
  ( compile lookup )
  *state* UNLESS interp THEN
  *state* IF *state* exec THEN
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
