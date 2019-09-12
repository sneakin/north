( An immediate dictionary for compiling words: )

: immediate-lookup
  doc( Find the immediate dictionary entry by name. )
  args( string ++ dict-entry )
  arg0 immediate-dict peek dict-lookup
  return1
;

: immediate-dict-add
  doc( Create and add an immediate dictionary entry. )
  args( name code date ++ dict-entry )
  arg2 arg1 arg0 immediate-dict peek make-dict
  dup immediate-dict poke
  return1
;

: add-immediate-as
  doc( Add a copy of an entry to the immediate dictionary with the given name. )
  args( entry name )
  arg1
  arg0
  swap dict-entry-code
  swap dict-entry-data
  swapdrop immediate-dict-add
  return0
;

: add-immediate
  doc( Add the entry to the immediate dictionary. )
  args( dict-entry )
  arg0 dict-entry-name add-immediate-as
;

: immediate
  doc( Add the last word to the immediate dictionary. )
  dict add-immediate
;

: immediate-only
  doc( Add the latest dictionary entry to the immediate dictionary and remove it from the normal dictionary. )
  args( ++ dict-entry )
  immediate drop-dict
;

( Comments and the like )

: (
  doc( Skip all input until a right parenthesis is found. )
  *tokenizer* peek int32 41 tokenizer-skip-until
; immediate

: doc(
  doc( Capture input into the last word's doc string until a right parenthesis is read. )
  args( : characters... ++ )
  *tokenizer* peek int32 41 tokenizer-read-until intern-seq
  dict set-dict-entry-doc
; immediate

: args(
  doc( Capture input into the last word's args field until a right parenthesis is read. )
  args( : characters... ++ )
  *tokenizer* peek int32 41 tokenizer-read-until intern-seq
  dict set-dict-entry-args
; immediate

( Reverse interning: )

: copyrev
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
;

: internrev
  doc( Copy num-bytes in reverse order into a sequence in the data stack. )
  args( src num-bytes ++ sequence )
  arg0 dallot-seq
  ( copy )
  cell+ arg1 swap arg0 cell* swapdrop copyrev drop3
  ( terminate )
  arg0 terminate-seq drop return1
;

( Stack search: )

: stack-find-loop
  args( start-location needle current! ++ ptr )
  arg0 peek arg1 equals IF arg0 return1 THEN
  arg0 cell+ set-arg0 drop
  RECURSE
;

: stack-find
  doc( Find needle searching up the stack from start-location. Better be found? fixme )
  args( start-location needle ++ ptr )
  arg1 arg0 arg1 stack-find-loop return1
;

( Compiler )

: compile
  doc( Look up a word calling it if it is an immediate. )
  args( tok -- lookup executable? )
  arg0 immediate-lookup dup IF int32 1 return2 THEN
  drop
  interp return2
;

( Colon definitions )

: [
  doc( Enter the compiling state where words, unless immediates, are looked up and pushed to the stack. )
  literal compile *state* poke
  terminator return1
; immediate

: ]
  doc( Exits the compiling state and stores all the words in reverse order on the data stack in a proper sequence leaving a pointer on the stack. )
  args( ... -- sequence )
  int32 0 *state* poke
  args terminator stack-find swapdrop cell- swapdrop
  swap 2dup int-sub cell/ swapdrop int32 1 int-add internrev
  seq-length int32 1 int-add return1-n
; immediate

: docol>
  doc( Sets the last word's code to evaluate a definition and enters compiling mode until endcol or ; is executed. )
  args( ++ open-sequence... )
  literal call-data-seq dict-entry-code swapdrop
  arg0 set-dict-entry-code
  [
  return2
;

: endcol
  doc( Closes a docol> updating the last word's data field. )
  args( ... -- )
  drop-call-frame
  literal return0
  ]
  swap set-dict-entry-data drop2
  literal eval-loop jump-entry-data
;

: ;
  doc( Closes a colon definition updating the last word's data field. )
  endcol
; immediate-only

: eos " EOS" return1 ;

: :
  doc( Start a new definition with the following name. Definition ends with a ";". )
  args( _ : name ++ entry open-seq )
  create docol> return2
;

: ::
  doc( Redefine or create the next word as a colon definition. )
  args( _ : name ++ entry open-seq )
  next-token dup UNLESS eos eos error return0 THEN
  over dict dict-lookup dup UNLESS drop3 intern-seq int32 0 int32 0 add-dict THEN
  docol> return2
;

( Terminatormon stack search and replace: )
  
: patch-terminator/2
    doc( Search up the stack from arg1, replacing the first terwinator with "[ terwinator - arg1 ] + arg0". )
    args( start-offset adjustment ++ )
    arg1 terminator stack-find swapdrop
    2dup swap int-sub arg0 int-add
    swap poke
;

: patch-terminator
    doc( Search up the stack replacing the first terminator with an offset to the TOS. )
    args( start-offset ++ )
    arg0 int32 0 patch-terminator/2
;

( Compiling words: )

: UNLESS
  doc( Jump to the word after UNLESS and evaluate until THEN if the top of stack is zero. )
  literal literal terminator literal ifthenreljump
  int32 3 returnN
; immediate-only

: THEN
  doc( Stop evaluation for an UNLESS or IF. )
  args cell-size negate swapdrop patch-terminator/2
; immediate-only

: POSTPONE
  doc( Read the next token and look it up in immediate and regular dictionaries. )
  next-token UNLESS literal eos eos error return0 THEN
  compile not UNLESS swapdrop return1 THEN
  swapdrop
  literal literal swap
  return2
; immediate

: return-locals
  doc( Causes the caller to return all of its local data shifted over the frame and return pointers. )
  drop-call-frame
  locals here int-sub cell/ swapdrop returnN
;

: ELSE
    doc( Evaluate the calls until THEN when an IF or UNLESS's condition fails. )
    ( Add a new terminator for THEN to patch that ends IF / UNLESS )
    literal literal terminator literal jumprel
    ( find and replace IF or UNLESS's terminator to offset past jumprel )
    args cell-size cell-size int-add patch-terminator/2 drop2
    int32 3 returnN
; immediate-only

: IF
  doc( Jump to the word after IF and evaluate until THEN if the top of stack is not zero. )
  literal not
  POSTPONE UNLESS
  return-locals
; immediate-only

: RECURSE
  doc( Tail call the dictionary definition currently being defined. )
  literal literal
  dict
  literal jump-entry-data
  return-locals
; immediate

( Loops: )

: next-op
  doc( Get the address of the operation after the callsite. )
  return-address cell+ return1
;

: next-op+
  doc( Get the address N cells from the callsite. )
  return-address arg0 cell+n return1
;

: DO
  doc( Starts a new frame with the start and hopefully end of loop pointers as arguments. )
( Loop pointer )
  literal literal int32 6 literal next-op+ literal swapdrop
  ( Abort pointer and return address when looping. )
  literal dup literal literal terminator literal int-add
  literal begin
  return-locals
; immediate-only

: AGAIN
  doc( Start a new loop iteration. )
  literal arg0
  literal jump
  return-locals
; immediate-only

: LEAVE
  doc( Exit a loop. )
  literal exit
  return-locals
; immediate-only

( int32 2 lit frame-size constant drop2 )
( int32 8 lit frame-byte-size constant drop2 )

: UNTIL
  doc( jump back to do )
    ( Use this w/o IF: literal arg0 literal ifthenjump )
    POSTPONE UNLESS
      POSTPONE AGAIN
      POSTPONE THEN
    literal end
    ( Patch the loop's abort increment. )
    here int32 16 int-add patch-terminator drop
  return-locals
; immediate-only

: WHILE
  doc( jump back to do )
    ( Use this w/o IF: literal arg0 literal ifthenjump )
    POSTPONE IF
      POSTPONE AGAIN
      POSTPONE THEN
    literal end
    ( Patch the loop's abort increment. )
    here int32 16 int-add patch-terminator drop
  return-locals
; immediate-only

: DOTIMES[
  args( times )
  doc( Loop an N number of times. The counter is in arg1.)
  literal zero
  POSTPONE DO
  return-locals
; immediate-only

: ]DOTIMES
  doc( Close `DOTIMES[`. )
  literal arg1 literal literal int32 1 literal int-add literal set-arg1
  literal arg1 literal arg2 literal < POSTPONE WHILE
  return-locals
; immediate-only

( Quoting: )

: lit
  doc( Read and intern the next token. )
  next-token dup UNLESS eos return0 THEN
  intern-seq return1
;

: c-lit
  doc( A postponed LIT. )
  literal literal lit return2
; immediate-as lit

: '
  doc( Read the next token and look it up in the dictionary. )
  next-token UNLESS literal eos-sym error return0 THEN
  dict dict-lookup return1
;

: i'
  doc( Read the next token and look it up in the immediate dictionary. )
  next-token UNLESS literal eos-sym error return0 THEN
  immediate-dict peek dict-lookup return1
; immediate

: [']
  doc( Actually emit ' when ' is redefined to emit LITERAL. )
  literal ' return1
; immediate-only

: c-'
  doc( No need to perform a double lookup since compilation does that. )
  literal literal return1
; immediate-as '

: forward-slash?
  arg0 longify \\ equals return1
;

( Strings and tokens with escape sequences: )

: tokenizer-read-digits/4
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
;

: tokenizer-read-hex2-digits
    doc( Read up to 2 words until a non-hex-digit is read. Returns the integer the words represent. )
    arg0 int32 16 int32 2 int32 0 tokenizer-read-digits/4 return1
;

: tokenizer-read-octal-digits
    doc( Read up to 3 words until a non-octal-digit is read. Returns the integer the words represent. )
    arg0 int32 8 int32 3 int32 0 tokenizer-read-digits/4 return1
;

: tokenizer-read-hex8-digits
    doc( Read up to 8 words words until a non-hex-digit is read. Returns the integer the words represent. )
    arg0 int32 16 int32 8 int32 0 tokenizer-read-digits/4 return1
;

: tokenizer-read-escape-word
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
    int32 char-code x over equals IF drop tokenizer-read-hex2-digits return1 THEN
    int32 char-code u over equals IF drop tokenizer-read-hex8-digits return1 THEN
    int32 char-code 0 over equals IF drop tokenizer-read-octal-digits return1 THEN
    return1
;

: tokenizer-next-escaped-word
    arg0 tokenizer-next-word null? UNLESS
        forward-slash? IF
            drop
            tokenizer-read-escape-word
        THEN
    THEN
    
    return1
;
    
: tokenizer-read-escaped-until-loop
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
;

: tokenizer-read-escaped-until
  ( tokenizer needle ++ output-seq length )
  arg1 tokenizer-buffer-reset
  arg0 tokenizer-read-escaped-until-loop return2
;

: tokenizer-next-escaped-token-loop
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
;

: tokenizer-next-escaped-token
  ( tokenizer -> string-past-token token )
  arg0
  tokenizer-eat-spaces
  tokenizer-buffer-reset
  tokenizer-next-escaped-token-loop return2
;

: next-escaped-token
  *tokenizer* peek dup IF tokenizer-next-escaped-token return2 THEN
  int32 0 int32 0 return2
;

( Quoted strings: )

( fixme: need to read strings larger than the tokenizer's buffer )

: "
  doc( Capture input into a sequence until a " is read. )
  args( : characters... ++ sequence )
  *tokenizer* peek int32 34 tokenizer-read-escaped-until intern-seq return1
; immediate

: c-"
  doc( Emit a type specifier and capture input into a sequence until " is read. )
  literal string POSTPONE " return2
; immediate-as "

( Immediates needed to self compile the core words. )

: make-long-msb
  args( lsb lmsb mlsb msb ++ uint32 )
  doc( Construct a 32 bit value from 4 arguments, LSB to MSB. )
  arg0 int32 8 bsl
  arg1 logior
  int32 8 bsl
  arg2 logior
  int32 8 bsl
  arg3 logior
  return1
;

: char-code
  doc( Return the next-token's first character. )
  next-escaped-token UNLESS eos eos error THEN
  cell+ peek return1
;

: [char-code]
      literal literal char-code return2
; immediate-as char-code

: longify-string
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
;

( todo longify needs to unescape the next token. )

: longify
  doc( Turn the next token into a 4 byte "string" or long. )
  next-escaped-token UNLESS eos eos error THEN
  cell+ longify-string
  return1
;

: [longify]
    literal literal longify return2
; immediate-as longify

: longify"
  doc( Read until the next " and convert that to a long. )
  *tokenizer* peek int32 34 tokenizer-read-escaped-until UNLESS eos eos error THEN
  cell+ longify-string
  return1
;

: [longify"]
    literal literal POSTPONE longify" return2
; immediate-as longify"
