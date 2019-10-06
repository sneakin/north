(
The loader picks a random location and leaves that address on the stack.
May need cell size and op size too.
Ops are indexes into a dictionary array at first.
Later ops are offset from the load location and point to an op sized dictionary entry.
Pointers in the op stream will be offsets.

Problem is with op sized entries instead of cell sized. Offset calls expect full entries with pointers to code words.

next needs to know where to call. quotes need to return an entry. lookup and create need a dictionary.

The op sized dictionary needs to be processed into entries with a pointer placed at the offset. Double indirection for op to entry to code words.
)

( iterate the dictionary filling in builtin words )
( set indirect_offset to the load address )
( switch to offset mode )

op-offset32 builtin-dictionary
op-offset->pointer op-int32 2 op-int32 4 op-int-mul op-int-add op-peek-byte op-osexit

op-offset32 builtin-dictionary op-set-dict
int32 -1 osexit

