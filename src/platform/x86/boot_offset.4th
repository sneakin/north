(
The loader picks a random location and jumps to that address.
Ops are indexes into a dictionary array at first.
Later ops are offset from the load location and point to a new set of entries.
May need cell size and op size too.

Problem is with op sized entries instead of cell sized. Offset calls expect full entries with pointers to code words.

Pointers in the op stream will be offsets.
next needs to know where to call. quotes need to return an entry. lookup and create need a dictionary.

For when the dictionary is not cell sized, it can be processed into entries with a pointer placed at the offset. Double indirection for op to entry to code words.
)

( todo move vars to data stack? )
( todo immediates )

namespace: op

( initialize offset eval )
eip index-size int-sub set-indirect-offset

( allocate space for initial variables )
int32 ::builtin-data-size stack-allot

( resolve dictionary code fields and convert fields to pointers )
int32 0
off32 ::builtin-dictionary
break
boot-loop:
( done if the entry is terminated )
dup uint32 $504f5453 eq UNLESS
  ( name )
  dup dup peek offset->pointer swap poke
  ( code & data )
  dup int32 1 cell-size int-mul int-add
  dup peek
  ( ops = -1 with op in the data )
  dup uint32 $FFFFFFFF eq IF
    drop
    ( op code stored in data )
    over int32 2 cell-size int-mul int-add
    dup peek index->pointer
    dup cell-size int32 2 int-mul int-add peek
    ( store code )
    swap cell-size int32 1 int-mul int-add peek
    int32 3 overn poke
    ( copy op's data )
    swap poke
    drop
    off32 boot-loop-code-done jump
  THEN
  ( call-data-seq = -2 )
  dup uint32 $FFFFFFFE eq IF
    drop
    literal-indexed call-data-seq cell-size int-add peek
    swap poke
    ( offset the call's data )
    dup int32 2 cell-size int-mul int-add
    dup peek offset->pointer over poke
    drop
    off32 boot-loop-code-done jump
  THEN
  ( does-constant = -3 )
  dup uint32 $FFFFFFFD eq IF
    drop
    literal-indexed value-peeker cell-size int-add peek
    swap poke
    off32 boot-loop-code-done jump
  THEN
  ( does-constant, but to offset data = -4 )
  dup uint32 $FFFFFFFC eq IF
    drop
    ( set code )
    literal-indexed value-peeker cell-size int-add peek
    over poke
    ( offset data )
    cell-size int-add dup peek offset->pointer
    swap poke
    off32 boot-loop-code-done jump
  THEN
  ( does-var = -5 )
  dup uint32 $FFFFFFFB eq IF
    drop
    literal-indexed variable-peeker cell-size int-add peek
    swap poke
    ( offset the data from the alloted space )
    dup int32 2 cell-size int-mul int-add
    dup peek
    int32 4 overn int-add
    ( zero alloted space )
    int32 0 over poke
    swap poke
    off32 boot-loop-code-done jump
  THEN
  ( else leave alone )
  boot-loop-code-done:
  ( doc )
  dup int32 3 cell-size int-mul int-add
  dup peek offset->pointer swap poke
  ( args )
  dup int32 4 cell-size int-mul int-add
  dup peek offset->pointer swap poke
  ( link )
  dup int32 5 cell-size int-mul int-add
  dup peek
  ( leave the terminator alone )
  dup int32 $504f5453 eq IF
    drop2
  ELSE
    offset->pointer swap poke
  THEN
  ( follow link )
  int32 5 cell-size int-mul int-add peek
  ( inc counter )
  swap int32 1 int-add swap
  ( loop )
  off32 boot-loop jump
THEN

( start the binary )
uint32 $504f5453 set-dict
data-init
off32 ::write-ok exec-core-word
off32 ::boot
break exec-core-word
( drop osexit )

end-namespace