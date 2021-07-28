( An immediate dictionary for compiling words: )

def immediate-lookup
  doc( Find the immediate dictionary entry by name. )
  args( string ++ dict-entry )
  arg0 immediate-dict peek dict-lookup
  return1
end

def immediate-dict-add
  doc( Create and add an immediate dictionary entry. )
  args( name code date ++ dict-entry )
  immediate-dict peek arg2 arg1 arg0 make-dict/4
  dup immediate-dict poke
  return1
end

def add-immediate-as
  doc( Add a copy of an entry to the immediate dictionary with the given name. )
  args( entry name )
  arg1
  arg0
  swap dict-entry-code
  swap dict-entry-data
  swapdrop immediate-dict-add
  return0
end

def add-immediate
  doc( Add the entry to the immediate dictionary. )
  args( dict-entry )
  arg0 dict-entry-name add-immediate-as
end

def immediate
  doc( Add the last word to the immediate dictionary. )
  dict add-immediate
end

def immediate-only
  doc( Add the latest dictionary entry to the immediate dictionary and remove it from the normal dictionary. )
  args( ++ dict-entry )
  immediate drop-dict
end

( Comments and the like )

def (
  doc( Skip all input until a right parenthesis is found. )
  *tokenizer* peek int32 41 tokenizer-skip-until
end immediate

def doc(
  doc( Capture input into the last word's doc string until a right parenthesis is read. )
  args( : characters... ++ )
  *tokenizer* peek int32 41 tokenizer-read-until intern-seq
  dict set-dict-entry-doc
end immediate

def args(
  doc( Capture input into the last word's args field until a right parenthesis is read. )
  args( : characters... ++ )
  *tokenizer* peek int32 41 tokenizer-read-until intern-seq
  dict set-dict-entry-args
end immediate

( Reverse interning: )

def copyrev
  doc( Copy num-bytes from src to dest backwards. )
  args( src dest num-bytes )
  arg0 cell- swapdrop
  int32 0

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
end

def internrev
  doc( Copy num-cells in reverse order into a sequence in the data stack. )
  args( src num-cells ++ sequence )
  arg0 dallot-seq
  ( copy )
  cell+ arg1 swap arg0 cell* swapdrop copyrev drop3
  ( terminate )
  arg0 terminate-seq drop return1
end

( Stack search: )

def stack-find-loop
  args( start-location needle current! ++ ptr )
  arg0 peek arg1 equals IF arg0 return1 THEN
  arg0 cell+ set-arg0 drop
  RECURSE
end

def stack-find
  doc( Find needle searching up the stack from start-location. Better be found? fixme )
  args( start-location needle ++ ptr )
  arg1 arg0 arg1 stack-find-loop return1
end

def internrev-to-terminator
    arg0 terminator stack-find swapdrop 
    swap 2dup int-sub cell/ swapdrop internrev
    return1
end

def internrev-current-seq
    ( arg0 terminator stack-find yellow ,h drop3 )
    *current-seq* peek
    ( green ,h dup peek .h color-reset )
    arg0
    2dup int-sub cell/ swapdrop internrev
    return1
end

( Compiler )

def compile
  doc( Look up a word calling it if it is an immediate. )
  args( tok -- lookup executable? )
  arg0 immediate-lookup dup IF int32 1 return2 THEN
  drop
  interp return2
end

( Colon definitions )

global-var *current-seq*

def [/1
    doc( Enter the compiling state where words, unless immediates, are looked up and pushed to the stack. )
    ( save state )
    *current-seq* peek
    *state* peek
    ( end of the new sequence )
    terminator
    ( update state )
    arg0 int32 3 cell-n rotdrop2
    ( fixme this and again need to be portable. frame in the way? )
    ( magenta ,h dup peek .h white )
    *current-seq* poke
    literal compile *state* poke
    ( let's compile )
    return-locals
end

def [
    args [/1 int32 3 returnN
end

def '[/1
    arg0 cell- swapdrop [/1
    ' pointer store-local0
    return-locals
end

def '[
    doc( Enter the compiling state in the compiling state, quoting the sequence's address. )
    args '[/1 int32 4 returnN
end immediate-as [

def exit-compiler
    doc( Exits the compiling state and stores all the words in reverse order on the data stack in a proper sequence leaving a pointer on the stack. )
  args( stack-ptr ++ sequence cells-to-drop )
  arg0 internrev-current-seq
  ( restore global vars )
  seq-length int32 1 int-add
  arg0 over cell+n rotdrop2
  dup peek *state* poke
  cell+ swapdrop peek *current-seq* poke
  ( clear the storage space too )
  int32 2 int-add
  return2
end

def ]
    doc( Exits the compiling state and stores local words in reverse order on the data stack in a proper sequence leaving a pointer on the stack . )
    args( ... -- sequence )
    args exit-compiler
    return1-n
end immediate-as ]

def ']
    doc( Exits the compiler using the caller's arguments. Returns the sequenge and how many items from the stack that need dropping. )
    args( stack-pointer ++ seq num-cells-to-drop )
    current-frame parent-frame peek frame-args
    exit-compiler
    return2
end

def docol>
  doc( Sets the last word's code to evaluate a definition and enters compiling mode until endcol or ; is executed. )
  args( ++ open-sequence... )
  literal call-data-seq dict-entry-code swapdrop
  arg0 set-dict-entry-code
  current-frame parent-frame peek frame-args
  int32 4 cell-n rotdrop2 [/1
  return-locals
end

def endcol
  doc( Closes a docol> updating the last word's data field. )
    args( ... -- )
    ( end the frame to add a return to the definition)
    POSTPONE end-frame drop
    literal return0
    ( swap the return address and last word before making a new frame)
    unshift-call-frame begin
    ( now exit the compiler )
    args exit-compiler
    ( update last dict ent, left on stack )
    2dup
    args swap int32 1 int-add cell+n rotdrop2 peek
    set-dict-entry-data
    drop2
    ( clean the stack )
    int32 4 int-add return0-n
end immediate-as end

def def
  doc( Start a new definition with the following name. Definition ends with a ";". )
  args( _ : name ++ entry old-state open-seq )
  create docol> return-locals
end

def next-lookup-or-create
    next-token dup UNLESS eos eos error return0 THEN
    over dict dict-lookup
    dup UNLESS drop3 intern-seq int32 0 int32 0 add-dict THEN
    return1
end

def redef
    doc( Redefine or create the next word as a colon definition. )
    args( _ : name ++ entry open-seq )
    next-lookup-or-create docol> return-locals
end

( Terminator on stack search and replace: )

def bytes-to-value
    args( start-offset value -- distance )
    arg1 arg0 stack-find
    arg1 int-sub int32 2 return1-n
end

def bytes-to-terminator
    args( start-offset -- distance )
    arg0 terminator bytes-to-value return1-1
end

def patch-terminator/2
    doc( Search up the stack from arg1, replacing the first terminator with "[ terminator - arg1 ] + arg0". )
    args( start-offset adjustment ++ )
    arg1 terminator stack-find swapdrop
    2dup swap int-sub arg0 int-add
    swap poke
end

def patch-terminator
    doc( Search up the stack replacing the first terminator with an offset to the TOS. )
    args( start-offset ++ )
    arg0 int32 0 patch-terminator/2
end

( Compiling words: )

def UNLESS
  doc( Jump to the word after UNLESS and evaluate until THEN if the top of stack is zero. )
  ' literal terminator literal ifthenreljump
  int32 3 returnN
end immediate-only

def THEN
  doc( Stop evaluation for an UNLESS or IF. )
  args cell-size negate swapdrop patch-terminator/2
end immediate-only

def POSTPONE
  doc( Read the next token and look it up in immediate and regular dictionaries. )
  next-token UNLESS literal eos eos error return0 THEN
  compile not UNLESS swapdrop return1 THEN
  swapdrop
  ' literal swap
  return2
end immediate

def ELSE
    doc( Evaluate the calls until THEN when an IF or UNLESS's condition fails. )
    ( Add a new terminator for THEN to patch that ends IF / UNLESS )
    ' literal terminator literal jumprel
    ( find and replace IF or UNLESS's terminator to offset past jumprel )
    args cell-size cell-size int-add patch-terminator/2 drop2
    int32 3 returnN
end immediate-only

def IF
  doc( Jump to the word after IF and evaluate until THEN if the top of stack is not zero. )
    ( literal not POSTPONE UNLESS return-locals )
  ' literal terminator literal unlessreljump
  int32 3 returnN
end immediate-only

def RECURSE
  doc( Tail call the dictionary definition currently being defined. )
  ' literal
  dict
  literal jump-entry-data
  return-locals
end immediate

( Loops: )

def DO
    doc( Calls the sequence defined by word until `done`. )
    args '[/1
    literal begin
    locals-size int32 1 int-sub returnN
end immediate-only

def DONE
    doc( Closes a sequence started by `do` and returns the words to call it. )
    ( add an exit to the sequence )
    POSTPONE end-frame drop
    literal exit unshift-call-frame begin
    ( close it )
    '] dropn-args
    ( call it )
    literal call-seq
    return-locals
end immediate-only

def AGAIN/1
    doc( Jump back to the *current-seq*'s beginning. )
    doc( Expected address on the stack of the current-seq's last cell. )
    literal int32
    ( calc jump offset )
    *current-seq* peek
    arg0 cell-2 swapdrop
    int-sub
    negate swapdrop
    literal jumprel
    ( clean stack )
    int32 1 dropn-args
    int32 3 returnN
end

def AGAIN
    doc( Jump back to the *current-seq*'s beginning. )
    args AGAIN/1 int32 3 returnN
end immediate-as AGAIN

def LEAVE
    doc( Helper for do...done loops that exits the sequence. )
    literal exit
    return1
end immediate-only

def UNTIL
  doc( Close a DO and do another iteration only if the ToS is zero. )
    ( Use this w/o IF: literal arg0 literal ifthenjump )
    POSTPONE UNLESS
    locals-byte-size args swap int-sub AGAIN/1
    POSTPONE THEN
    return-locals
end immediate-only

def WHILE
  doc( Close a DO and do another iteration only if the ToS is not zero. )
    ( Use this w/o IF: literal arg0 literal ifthenjump )
    POSTPONE IF
    locals-byte-size args swap int-sub AGAIN/1
    POSTPONE THEN
    return-locals
end immediate-only

def DOTIMES[
  args( times )
  doc( Loop an N number of times. The counter is in arg0, max in arg1, and anything on the stack starts with arg2. Returns exit the loop. )
  literal zero ( counter )
  ( patched to the offset to end of loop )
  literal int32 terminator
  ( loop return address )
  literal cell/ literal swapdrop
  literal next-code-pointer
  literal begin ( loop in a frame )
  literal arg0 literal arg1 literal < ( check the counter )
  POSTPONE UNLESS literal return-locals POSTPONE THEN
  return-locals
end immediate-only

def ]DOTIMES
    doc( Close `DOTIMES[`. )
    ( inc the counter )
    literal arg0 ' literal int32 1 literal int-add literal set-arg0
    ( calculate jump offset )
    literal int32
    call-frame-size int32 3 cell+n rotdrop2
    here bytes-to-terminator int-sub
    ( loop )
    literal jumprel
    ( patch the terminator to here less call frame )
    here
    call-frame-size int32 3 cell+n rotdrop2 negate swapdrop
    patch-terminator/2 drop2
    return-locals
end immediate-only

( Quoting: )

def POSTPONE'
    doc( Pastpone the following word and return it with literal before it. )
    literal POSTPONE literal
    literal POSTPONE literal
    POSTPONE POSTPONE
    return-locals
end immediate

def lit
  doc( Read and intern the next token. )
  next-token dup UNLESS eos return0 THEN
  intern-seq return1
end

def 'lit
  doc( A postponed LIT. )
  POSTPONE' lit return2
end immediate-as lit

def '
  doc( Read the next token and look it up in the dictionary. )
  next-token UNLESS literal eos-sym error return0 THEN
  dict dict-lookup return1
end

def i'
  doc( Read the next token and look it up in the immediate dictionary. )
  next-token UNLESS literal eos-sym error return0 THEN
  immediate-dict peek dict-lookup return1
end immediate

def ''
  doc( Actually emit ' to be called later. )
  POSTPONE' ' return-locals ( a piece of magic )
end immediate-only

def [']
  doc( No need to perform a double lookup since compilation does that. )
  ' literal return1
end immediate-as '

def forward-slash?
  arg0 longify \\ equals return1
end

( Strings and tokens with escape sequences: )

def tokenizer-read-digits/4
    doc( Read up to max-digits words until a non-digit in base is read. Returns the integer the words represent in base. )
    args( tokenizer base max-digits number ++ number )
    arg3 tokenizer-next-word
    digit-char
    dup int32 0 >= IF
        dup arg2 < IF
            arg0 arg2 int-mul
            int-add set-arg0
            arg1 int32 1 int-sub set-arg1
            arg1 IF RECURSE THEN
        THEN
    THEN
    arg0 return1
end

def tokenizer-read-hex2-digits
    doc( Read up to 2 words until a non-hex-digit is read. Returns the integer the words represent. )
    arg0 int32 16 int32 2 int32 0 tokenizer-read-digits/4 return1
end

def tokenizer-read-octal-digits
    doc( Read up to 3 words until a non-octal-digit is read. Returns the integer the words represent. )
    arg0 int32 8 int32 3 int32 0 tokenizer-read-digits/4 return1
end

def tokenizer-read-hex8-digits
    doc( Read up to 8 words words until a non-hex-digit is read. Returns the integer the words represent. )
    arg0 int32 16 int32 8 int32 0 tokenizer-read-digits/4 return1
end

def tokenizer-read-escape-word
    arg0 tokenizer-next-word
    int32 char-code a over equals IF int32 7 return1 THEN
    int32 char-code b over equals IF int32 char-code \b ( 8 ) return1 THEN
    int32 char-code f over equals IF int32 char-code \f ( $c ) return1 THEN
    int32 char-code e over equals IF int32 char-code \e ( $1b )return1 THEN
    int32 char-code v over equals IF int32 char-code \v ( $b ) return1 THEN
    int32 char-code n over equals IF int32 char-code \n ( $A ) return1 THEN
    int32 char-code r over equals IF int32 char-code \r ( $D ) return1 THEN
    int32 char-code t over equals IF int32 char-code \t ( 9 ) return1 THEN
    int32 char-code \\ over equals IF int32 char-code \\ ( $5c ) return1 THEN
    int32 char-code \" over equals IF int32 char-code \" ( $22 ) return1 THEN
    int32 char-code x over equals IF drop tokenizer-read-hex2-digits return1 THEN
    int32 char-code u over equals IF drop tokenizer-read-hex8-digits return1 THEN
    int32 char-code 0 over equals IF drop tokenizer-read-octal-digits return1 THEN
    return1
end

def tokenizer-next-escaped-word
    arg0 tokenizer-next-word null? UNLESS
        forward-slash? IF
            drop
            tokenizer-read-escape-word
        THEN
    THEN
    
    return1
end
    
def tokenizer-read-escaped-until-loop
  ( tokenizer needle ++ output-seq length )
    arg1 tokenizer-next-word null? UNLESS
        dup arg0 equals UNLESS
            forward-slash? IF
                drop
                tokenizer-read-escape-word
            THEN
            
            tokenizer-push drop2
            RECURSE
        THEN
    THEN

    drop tokenizer-finish-output return2
end

def tokenizer-read-escaped-until
  ( tokenizer needle ++ output-seq length )
  arg1 tokenizer-buffer-reset
  arg0 tokenizer-read-escaped-until-loop return2
end

def tokenizer-next-escaped-token-loop
    arg0 tokenizer-next-word ( tokenizer byte )
    null? UNLESS
        whitespace? UNLESS
            forward-slash? IF
                drop
                tokenizer-read-escape-word
            THEN

            tokenizer-push drop2
            RECURSE
        THEN
    THEN

    drop ( tokenizer )
    tokenizer-finish-output return2 ( next-token length )
end

def tokenizer-next-escaped-token
  ( tokenizer -> string-past-token token )
  arg0
  tokenizer-eat-spaces
  tokenizer-buffer-reset
  tokenizer-next-escaped-token-loop return2
end

def next-escaped-token
  *tokenizer* peek dup IF tokenizer-next-escaped-token return2 THEN
  int32 0 int32 0 return2
end

( Quoted strings: )

( fixme: need to read strings larger than the tokenizer's buffer )

def "
  doc( Capture input into a sequence until a " is read. )
  args( : characters... ++ sequence )
  *tokenizer* peek int32 34 tokenizer-read-escaped-until intern-seq return1
end

def '"
  doc( Emit a type specifier and capture input into a sequence until " is read. )
  ' string POSTPONE " return2
end immediate-as "

( Immediates needed to self compile the core words. )

def char-code
  doc( Return the next-token's first character. )
  next-escaped-token UNLESS eos eos error THEN
  cell+ peek return1
end

def 'char-code
      POSTPONE' char-code return2
end immediate-as char-code

def make-long-msb
  args( lsb lmsb mlsb msb ++ uint32 )
  doc( Construct a 32 bit value from 4 arguments, LSB to MSB. )
  arg0 int32 8 bsl
  arg1 logior
  int32 8 bsl
  arg2 logior
  int32 8 bsl
  arg3 logior
  return1
end

def longify-string
  doc( Turn the ToS string into a 4 byte "string" or long. )
  arg0 peek terminator? IF int32 0 return1 THEN
  arg0 cell+ swapdrop peek terminator? IF
    drop int32 0 int32 0 int32 0 make-long-msb return1
  THEN
  arg0 cell+2 swapdrop peek terminator? IF
    drop int32 0 int32 0 make-long-msb return1
  THEN
  arg0 cell+3 swapdrop peek terminator? IF
    drop int32 0 make-long-msb return1
  THEN
  make-long-msb return1
end

( todo longify needs to unescape the next token. )

def longify
  doc( Turn the next token into a 4 byte "string" or long. )
  next-escaped-token UNLESS eos eos error THEN
  cell+ longify-string
  return1
end

def 'longify
    ' uint32 POSTPONE longify return2
end immediate-as longify

def longify"
  doc( Read until the next " and convert that to a long. )
  *tokenizer* peek int32 34 tokenizer-read-escaped-until UNLESS eos eos error THEN
  cell+ longify-string
  return1
end

def 'longify"
    ' uint32 POSTPONE longify" return2
end immediate-as longify"
