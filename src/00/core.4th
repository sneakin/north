( Functions for a token evaluator using the primitive ops. )

( Cells )

def cell*
  arg0 cell-size int-mul
  return1
end

def cell/
  arg0 cell-size int-div
  return1
end

def cell+n
  arg0 cell*
  arg1 int-add
  return1
end

def cell+
  cell-size arg0 int-add
  return1
end

def cell+2
  arg0 int32 2 cell+n
  return1
end

def cell+3
  arg0 int32 3 cell+n
  return1
end

def cell-n
  arg0 cell*
  arg1 swap int-sub
  return1
end

def cell-
  arg0 cell-size int-sub
  return1
end

def cell-2
  arg0 cell-size dup int-add int-sub
  return1
end

( Call frames: )

def parent-frame
    ( first element, so nop )
end

def set-arg0
  current-frame parent-frame peek
  frame-size int-add
  arg0 swap poke
  return-1
end

def return-locals
  doc( Causes the caller to return all of its local data shifted over the frame and return pointers. )
  drop-call-frame
  locals here int-sub cell/ swapdrop returnN
end

( Sequences )

def terminator
  int32 $504f5453 return1
end

def terminator?
  arg0 terminator equals IF int32 1 return1 THEN
  int32 0 return1
end

def start-seq
  int32 0 dpush
  dhere return1
end

def end-seq ( seq-ptr )
  dhere
  terminator dpush
  ( calc length )
  arg0 int-sub cell/
  ( set length )
  arg0 poke
end

def abort-seq ( seq-ptr )
  arg0 dmove
  ddrop
end

def seq-data
    arg0 cell+
    return1
end

def seq-length
  arg0 peek return1
end

def seq-byte-size
  arg0 seq-length cell*
  return1
end

def seq-poke ( v seq n )
  arg2 arg1 arg0 cell+n rotdrop2 cell+ swapdrop
  poke
end

def seq-peek ( [seq n] todo bounds checking )
  arg1 arg0 cell+n cell+
  peek return1
end

( Strings )

( Compares to values returning -1 if the first is less, 0 if equal, and 1 if greater. )
def <=> ( a b ++ result )
  arg1 arg0 < IF int32 -1 return1 THEN
  arg1 arg0 > IF int32 1 return1 THEN
  int32 0 return1
end

def string-cmp-n/4 ( seq-a seq-b max counter! ++ result )
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
end

def string-cmp-n ( seq-a seq-b length ++ result )
  arg2 arg1 arg0 int32 0 string-cmp-n/4 return1
end

def string-cmp ( seq-a seq-b ++ result )
  arg1 arg0 seq-length int32 0 string-cmp-n/4 return1
end

def string-equal-n ( seq-a seq-b length ++ equal? )
  arg2 arg1 arg0 string-cmp-n UNLESS int32 1 return1 THEN
  int32 0 return1
end

def string-equal ( seq-a seq-b ++ equal? )
  ( lengths )
  arg0 seq-length swapdrop
  arg1 seq-length swapdrop
  equals UNLESS
    ( lengths are different )
    int32 0 return1
  THEN

  arg1 arg0 seq-length string-equal-n return1
end

( Sequence copying )

def copy-n ( src dest number counter )
  ( src )
  arg0 arg3 int-add peek
  ( dest )
  arg0 arg2 int-add poke
  ( inc )
  arg0 cell+ swapdrop set-arg0
  ( loop? )
  arg0 arg1 < IF RECURSE THEN
end

( TODO handle non-cell aligned sequences )
def copy ( src dest number )
  arg2 arg1 arg0 int32 0 copy-n
end

def copydown-loop ( src dest counter )
  ( dec )
  arg0 cell- swapdrop set-arg0
  ( src value )
  arg0 arg2 int-add peek
  ( dest )
  arg0 arg1 int-add
  ( store )
  poke
  ( loop? )
  arg0 int32 0 > IF RECURSE THEN
end

def copydown ( src dest number )
  arg2 arg1 arg0 copydown-loop
end

( Sequence storage )

def terminate-seq ( ptr num-cells )
  terminator
  ( calc length )
  arg0 int32 1 int-add
  cell* swapdrop
  arg1 int-add
  ( store terminator )
  poke
end

def intern-seq
    doc( Copy a number of cells from the head of a sequence into a new sequence on the data stack. )
    args( seq-ptr num-cells )
  ( calc byte size & alloc )
  arg0 dallot-seq
  ( copy )
  cell+
  arg1 cell+ swapdrop swap
  arg0 cell* swapdrop
  copy
  drop3
  ( terminate )
  arg0 terminate-seq
  drop
  return1
end

def intern
    doc( Copies a number of cells into a sequence on the data stack. )
    args( src number-cells ++ sequence )
  arg0 dallot-seq
  ( copy )
  cell+ arg1 swap arg0 cell* swapdrop copy drop3
  ( terminate )
  arg0 terminate-seq drop return1
end

( Lists: )

def dcons arg0 dpush dhere arg1 dpush return1 end
def tail arg0 cell+ peek return1 end
def head arg0 peek return1 end

( Dictionary )

def make-dict/4
    args( link name code data => entry-ptr )
  arg2 dpush ( name ) 
  dhere 
  arg1 dpush ( code ) 
  arg0 dpush ( data )
  int32 0 dpush ( doc )
  int32 0 dpush ( args )
  arg3 dpush ( link )
  return1    ( dhere )
end

def add-dict
  ( name code data )
  dict arg2 arg1 arg0 make-dict/4
  dup set-dict 
  return1
end

def dict-entry-name
  arg0 peek 
  return1
end

def dict-entry-code
  arg0 cell+ peek 
  return1
end

def dict-entry-data
  arg0 cell+2 peek
  return1
end

def set-dict-entry-code
  ( value entry )
  arg1 arg0 cell+ swapdrop poke 
end

def set-dict-entry-data
  ( value entry )
  arg1 arg0 cell+2 swapdrop poke 
end

def dict-entry-doc
  arg0 UNLESS int32 0 return1 THEN
  arg0 int32 3 cell+n peek return1
end

def set-dict-entry-doc
  arg1 arg0 int32 3 cell+n rotdrop2 poke return0
end
  
def dict-entry-args
  arg0 UNLESS int32 0 return1 THEN
  arg0 int32 4 cell+n peek return1
end

def set-dict-entry-args
  arg1 arg0 int32 4 cell+n rotdrop2 poke return0
end

def dict-entry-next
  arg0 UNLESS int32 0 return1 THEN
  arg0 int32 5 cell+n peek return1
end

def set-dict-entry-next
    arg1 arg0 int32 5 cell+n
    rotdrop2 poke return0
end
  
def dict-lookup-parent
  args( name dict ++ entry )
  arg0 dict-entry-next
  terminator? IF int32 0 return1 THEN
  dict-entry-name arg1 string-equal IF drop3 return1 THEN
  drop2 swapdrop set-arg0
  RECURSE
end

def dict-lookup
  args( name dict ++ entry )
  ( check dict's head )
  arg0 dict-entry-name arg1 string-equal IF arg0 return1 THEN
  ( search the list )
  arg1 arg0 dict-lookup-parent dup IF dict-entry-next THEN return1
end

( Basic error quiting )

def return-from-frame
    arg0 set-current-frame
    current-frame move
end

def top-frame
    arg0 peek
    dup stack-top uint< IF
      set-arg0 RECURSE
    THEN
end

def quit
    doc( Return to the function started with outer-start-thread, but not the outer-start-thread's caller. )
    current-frame top-frame return-from-frame
end

global-var *state* doc( Holds a function pointer that determines how words are interpreted. See `compile`. )

global-var *status* doc( The last error value. )

def error
  arg0 *status* poke
  int32 0 *state* poke
  quit
end

( Input )

def newline?
    arg0 int32 char-code \n equals return1
end

def read-line-inner
  read-byte
  newline? IF dpush return0 THEN
  dpush RECURSE
end

def read-line
  start-seq
  read-line-inner
  end-seq return1
end

def flush-read-line
  input-reset read-line input-reset
  return1
end

( Logic )

def or
  arg0 IF arg0 return1 THEN
  arg1 return1
end

def false
  int32 0 return1
end

def true
  int32 1 return1
end

def zero
  int32 0 return1
end

( Character classifiers )

def space?
  arg0 int32 $20 equals
  return1
end

def whitespace?
  arg0 space? swap int32 char-code \r equals
  arg0 int32 char-code \n equals
  arg0 int32 char-code \t equals
  arg0 int32 char-code \v equals
  arg0 int32 char-code \f equals
  or rotdrop2
  or rotdrop2
  or rotdrop2
  or rotdrop2
  or rotdrop2
  return1
end

def null?
  arg0 int32 0 equals
  arg0 terminator equals
  or return1
end

def in-range?
    doc( Inclusively test if VALUE is between MAX and MIN. )
    args( Max min value ++ result )
  arg0 dup arg1 >= IF
    arg2 <= IF int32 1 return1 THEN
    int32 0 return1
  THEN
  
  drop int32 0 return1
end

def digit?
  int32 char-code 9
  int32 char-code 0
  arg0 in-range?
  return1
end

def lower-alpha?
  int32 char-code z
  int32 char-code a
  arg0 in-range?
  return1
end

def upper-alpha?
  int32 char-code Z
  int32 char-code A
  arg0 in-range?
  return1
end

def alpha?
  arg0 lower-alpha?
  swap upper-alpha?
  swapdrop
  or return1
end

( Tokenizing with state )

constant token-max-cell-size 512

def token-max-byte-size token-max-cell-size cell* return1 end

def tokenizer-str-offset
  arg0 cell+
  return1
end

def tokenizer-str
  arg0 return1
end

def tokenizer-str-ptr
  arg0 peek
  arg0 cell+ swapdrop peek
  int-add
  cell+ ( skip the seq's length )
  return1
end

def set-tokenizer-str
    arg1 arg0 tokenizer-str swapdrop !
    int32 0 arg0 tokenizer-str-offset swapdrop !
end

def tokenizer-inc-str-offset
    arg0 tokenizer-str-offset
    dup peek cell+ swapdrop
    swap poke
end

def tokenizer-exhausted?
  arg0 tokenizer-str peek dup UNLESS int32 1 return1 THEN
  seq-length cell*
  arg0 tokenizer-str-offset peek swapdrop
  <= return1
end
  
def tokenizer-reader
    arg0 int32 4 cell+n return1-1
end

def tokenizer-reader-state
    arg0 int32 5 cell+n return1-1
end

def tokenizer-read-more
    arg0 tokenizer-reader @ dup IF
        arg0 tokenizer-reader-state @
        swap exec-core-word
        dup IF arg0 set-tokenizer-str int32 1 return1 THEN
    THEN
    int32 0 return1
end
    
def tokenizer-peek-word
    arg0
    tokenizer-exhausted? IF
        tokenizer-read-more UNLESS int32 0 return1 THEN
    THEN
    tokenizer-str-ptr peek
    return1
end

def tokenizer-next-word
    arg0 tokenizer-peek-word dup UNLESS return1 THEN
    swap tokenizer-inc-str-offset
    drop return1 ( tokenizer cell )
end

( todo use a function to test characters and refactor eat-spaces )

def tokenizer-skip-until
  args( tokenizer needle )
  arg1 tokenizer-next-word null? IF return0 THEN
  dup arg0 equals IF return0 THEN
  drop RECURSE
end

def tokenizer-eat-spaces
  arg0 tokenizer-peek-word
  whitespace? UNLESS return0 THEN
  drop
  tokenizer-inc-str-offset
  drop RECURSE
end

def tokenizer-buffer
  arg0 cell+2 peek return1
end

def tokenizer-buffer-offset
  arg0 cell+3 peek return1
end

def set-tokenizer-buffer-offset
  arg1 cell+3
  arg0
  swap poke
end

def tokenizer-inc-buffer-offset
  arg0 cell+3 ( ptr ptr+ )
  dup peek ( ptr ptr+ offset )
  cell+ swapdrop ( ptr ptr+ offset+ )
  swap poke
  return0
end

def tokenizer-buffer-ptr
  arg0 cell+2 swapdrop peek
  arg0 cell+3 swapdrop peek
  int-add cell+2 ( skip the seq and fake lengths )
  return1
end

def tokenizer-buffer-start
  arg0 cell+2 peek
  cell+ return1
end

def set-tokenizer-buffer-length
  arg0 arg1 poke
end

def tokenizer-push
  args( tokenizer character )
  arg1 tokenizer-buffer-ptr
  arg0 swap poke
  tokenizer-inc-buffer-offset
end

def tokenizer-finish-output
  arg0 terminator tokenizer-push drop
  tokenizer-buffer-start swap
  tokenizer-buffer-offset swapdrop cell/ swapdrop int32 1 int-sub set-tokenizer-buffer-length
  return2
end

def fill-loop args( ptr number-bytes counter )
  arg0 dup arg2 int-add
  int32 0 swap poke
  cell+ swapdrop
  dup set-arg0
  arg1 <= IF RECURSE THEN
end

def fill args( ptr number-bytes )
  arg1 arg0 int32 0 fill-loop
end

def tokenizer-buffer-reset
  arg0 int32 0 set-tokenizer-buffer-offset drop
  tokenizer-buffer-ptr
  token-max-byte-size int32 2 cell* swapdrop int-sub
  fill
end

( fixme limit length read to buffer size )

def tokenizer-read-until-loop
  args( tokenizer needle ++ output-seq length )
  arg1 tokenizer-next-word null? UNLESS
    dup arg0 equals UNLESS
      tokenizer-push drop2
      RECURSE
    THEN
  THEN

  drop tokenizer-finish-output return2
end

def tokenizer-read-until
  args( tokenizer needle ++ output-seq length )
  arg1 tokenizer-buffer-reset
  arg0 tokenizer-read-until-loop return2
end

def make-tokenizer
  args( reader-fn token-buffer string ++ tokenizer )
  doc( Creates a new tokenizer on the data stack. Tokenizers have the structure:
    str-ptr
    str-offset
    token-seq
    token-seq-offset
    reader-fn
    reader-state )
  arg0 dpush
  dhere
  int32 0 dpush
  arg1 dpush
    int32 0 dpush
    arg2 dpush
    arg3 dpush
  return1
end

global-var *tokenizer-stack* doc( Tokenizers are pushed here when evaluating strings. )
global-var *tokenizer* doc( The interpreter's tokenizer. )

def pop-tokenizer
    *tokenizer-stack* @ null? IF int32 0 return1 THEN
    tail *tokenizer-stack* !
    head return1
end

def pop-tokenizer!
    pop-tokenizer dup IF *tokenizer* ! return0 THEN
    " no tokenizer" " tokenizer-error" error
end

def push-tokenizer
    *tokenizer-stack* @ arg0 dcons
    *tokenizer-stack* !
end

def make-the-tokenizer
    *tokenizer* peek
    push-tokenizer
    dup IF tokenizer-buffer THEN
  dup UNLESS token-max-cell-size dallot-seq THEN
  arg0 arg2 roll arg1 roll make-tokenizer ( tokenizer )
  *tokenizer* poke
end

def tokenizer-next-token-loop
  arg0 tokenizer-next-word ( tokenizer byte )
  null? UNLESS
    whitespace? UNLESS
      tokenizer-push drop2
      RECURSE
    THEN
  THEN

  drop ( tokenizer )
  tokenizer-finish-output
  return2 ( next-token length )
end

def tokenizer-next-token
  ( tokenizer -> string-past-token token )
  arg0
  tokenizer-eat-spaces
  tokenizer-buffer-reset
  tokenizer-next-token-loop return2
end

( Call frames continued: )

def return1-1
    doc( Returns from a frame by replacing an argment with the return value. )
    drop-call-frame set-arg0
end

def set-arg1
  current-frame parent-frame peek
  frame-size cell+ swapdrop
  int-add
  arg0 swap poke
  return-1
end
  
def set-arg2
  current-frame parent-frame peek
  frame-size cell+2 swapdrop
  int-add
  arg0 swap poke
  return-1
end

def set-arg3
  current-frame parent-frame peek
  frame-size cell+3 swapdrop
  int-add
  arg0 swap poke
  return-1
end

def argn
    arg0 cell* call-frame-size int-add
    current-frame parent-frame peek int-add
    peek set-arg0
end

def set-argn
    arg0 cell* call-frame-size int-add
    current-frame parent-frame peek int-add
    arg1 swap poke
end

def frame-args
    arg0 call-frame-size int-add return1-1
end

def frame-argn
    doc( Return the Nth argument of a frame. )
    args( n frame ++ value )
    arg0 frame-args arg1 cell+n peek return1
end

def frame-locals
    arg0 cell- return1-1
end

def frame-byte-size
    arg0 dup peek swap int-sub return1-1
end

def frame-arg-byte-size
    arg0 parent-frame peek
    arg0 frame-args
    int-sub return1-1
end

def frame-num-args
    arg0 frame-arg-byte-size cell/ return1-1
end

def frame-return-addr
    arg0 cell+ return1-1
end

def locals-byte-size
    current-frame parent-frame peek
    args int-sub return1
end

def locals-size
    current-frame parent-frame peek
    args int-sub cell/ return1
end

def dropn-args
    doc( Drop N arguments from the calling frame keeping any locals. )
    ( calc size of locals + call frame )
    current-frame parent-frame peek
    ( copy from here to nth arg - the size )
    ( src )
    here
    ( dest )
    dup arg0 cell+n rotdrop2
    ( number bytes )
    local0
    call-frame-size int-add
    int32 2 overn int-sub
    ( update pointers first )
    local0 arg0 cell+n rotdrop2 current-frame parent-frame poke
    current-frame arg0 cell+n rotdrop2 set-current-frame
    ( now )
    copydown
    return-1
end

( Some signed math: )

def negative?
    arg0 int32 0 < IF true ELSE false THEN return1
end

def negate
  int32 0 arg0 int-sub return1
end

def abs-int
  arg0 int32 0 > UNLESS
    arg0 negate set-arg0
  THEN
end

( String to number conversion. )

global-var base doc( The input and output number conversion base. )

def digit-char
  doc( Convert an ASCII character to a digit. )
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
end

def char-digit
  doc( Convert a single digit to an ASCII digit or letter. )
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
end

def negative-sign
  int32 45 return1
end

def negative-sign?
  arg0 negative-sign equals return1
end

def unsigned-number-loop
  doc( Does not handle base prefixes or decimals. )
  args( value num-chars ptr ++ value valid? )
  arg0 dup peek
  negative-sign? UNLESS
    whitespace? UNLESS
      terminator? IF arg2 int32 1 return2 THEN
      digit? UNLESS int32 0 int32 0 return2 THEN
      digit-char swapdrop
      arg2 base peek int-mul
      int-add set-arg2
    ELSE
      drop
    THEN
  ELSE
    drop
  THEN
  cell+ swapdrop set-arg0
  arg1 int32 1 int-sub set-arg1
  RECURSE
end

def unsigned-number
  doc( Convert a sequence into an unsigned number in base `base`. )
  int32 0
  arg0 seq-length swap
  cell+ swapdrop
  unsigned-number-loop return2
end

def number
  doc( Convert a sequence into an integer. )
  arg0 cell+ swapdrop peek negative-sign equals UNLESS
    arg0 unsigned-number return2
  THEN
  arg0 unsigned-number swap negate swapdrop swap return2
end

( Evaluation )

global-var eval-tos

def interp
  args( token ++ value executable? )
  doc( Look a token up or try converting to a number. )
  arg0 number IF int32 0 return2 THEN
  drop dict dict-lookup dup IF *state* peek not return2 THEN

  drop2 " Not Found" error
  int32 0 int32 0 return2
end

def next-token
  *tokenizer* peek dup IF tokenizer-next-token return2 THEN
  int32 0 int32 0 return2
end

def eos " EOS" return1 end

def next-word
    next-token UNLESS eos error THEN
    seq-length intern-seq return1
end

def next-lookup
    next-token UNLESS eos error THEN
    interp drop dup UNLESS " lookup-error" error THEN
    return1
end

def next-int
    next-token UNLESS " End of stream" error THEN
    number drop
    ( POSTPONE int32 swap return2 )
    return1
end

def eval-read-line
   read-line return1
end

def eval-loop
  ( ++ results... )
  here eval-tos !
  next-token UNLESS drop return-locals THEN
  ( compile lookup )
  *state* peek UNLESS interp THEN
  *state* peek IF *state* peek exec-core-word THEN
  ( exec? )
  IF swapdrop exec-core-word RECURSE THEN
  swapdrop RECURSE
end

def eval-input
    int32 0 ' eval-read-line int32 0 make-the-tokenizer drop3
    eval-loop
    pop-tokenizer!
    return-locals
end

def eval-start
    input-reset
    ' eval-input jump-entry-data
end

def eval-string
    int32 0 int32 0 arg0 make-the-tokenizer drop3
    eval-loop
    pop-tokenizer!
    return-locals
end

def load
  literal eval-string jump-entry-data
end

( Dictionary helpers )

def [create]
  arg1 arg0 intern-seq
  int32 0 int32 0 add-dict
  return1
end

def create
  next-token dup UNLESS " End of stream" error THEN
  [create] return1
end

( Constants )

def constant-capturer
  doc( Returns a colon sequence that returns the argument. )
  start-seq
  ' literal dpush
  arg0 dpush
  ' return1 dpush
  end-seq
  cell+ return1
end
  
def does-constant
  args( entry init-value )
  ' value-peeker dict-entry-code swapdrop
  arg1 set-dict-entry-code
  arg0 arg1 set-dict-entry-data
end

def [constant]
  args( value name )
  arg0 seq-length [create] arg1 does-constant
  drop return1
end

def constant'
  args( value : name )
  arg0 next-param [constant]
end

def constant
  args( : name integer )
  create next-int does-constant
end

( Variables )

def does-var
  args( entry init-value )
  ' variable-peeker dict-entry-code swapdrop
  arg1 set-dict-entry-code
  arg0 dpush dhere arg1 set-dict-entry-data
end

def [variable]
  args( value name )
  arg0 [create] arg1 does-var
  drop return1
end

def variable
  doc( Add an entry to the dictionary for a new variable that stores its value at `dhere`. The entry stores a pointer. `peek` gets the value and `poke` will set it. )
  args( value : name ++ )
  create arg0 does-var
end

def global-var
    create int32 0 does-var
end

( Entry type testing: )

def in-range-unsigned?
    doc( Inclusively test if VALUE is between MAX and MIN. )
    args( Max min value ++ result )
  arg0 dup arg1 uint>= IF
    arg2 uint<= IF int32 1 return1 THEN
    int32 0 return1
  THEN
  
  drop int32 0 return1
end

global-var binary-size

def pointer?
    stack-top here arg0 in-range-unsigned? IF true return1 THEN
    dhere data-segment arg0 in-range-unsigned? IF true return1 THEN
    code-segment binary-size @ int-add code-segment arg0 in-range-unsigned? IF true return1 THEN
    false return1
end

def dict-entry?
    arg0 pointer? UNLESS int32 0 return1 THEN
    ( name a valid string? )
    dict-entry-name pointer? UNLESS int32 0 return1 THEN
    seq-length cell* swapdrop
    int-add cell+ peek
    terminator? return1
end

( Word aliases: )

def copy-dict-entry
    args( dest src )
    arg0 dict-entry-code arg1 set-dict-entry-code
    arg0 dict-entry-data arg1 set-dict-entry-data
    arg0 dict-entry-doc arg1 set-dict-entry-doc
    arg0 dict-entry-args arg1 set-dict-entry-args
end

def alias
    args( : new-word src-word )
    create next-lookup dict-entry? IF
      copy-dict-entry
    ELSE
      " not a dictionary entry" " alias-error" error
    THEN
end

( Dictionary initialization )

global-var immediate-dict

def mark
  dict lit *mark* [constant]
end

def forget
  lit *mark* dict dict-lookup
  dict-entry-data set-dict
end

def drop-dict
  dict dict-entry-next set-dict
end

def immediate-dict-init
  pointer immediate-dictionary
  immediate-dict poke
end

def dict-init
  pointer builtin-dictionary
  set-dict
  immediate-dict-init
  mark
end
