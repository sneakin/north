( todo btree-find needs a predicate overload: sort-fn and key-fn )

def identity
    arg0 return1
end

(
structure btree-branch
field value
field left
field right
)

def btree-branch end

def btree-branch-type arg0 return1-1 end
def btree-branch-value arg0 cell+ return1-1 end
def btree-branch-left arg0 cell+2 return1-1 end
def btree-branch-right arg0 int32 3 cell+n return1-1 end

def btree-branch?
    arg0 null? IF false return1 THEN
    pointer? UNLESS false return1 THEN
    btree-branch-type @
    ' btree-branch equals
    return1
end

def make-btree-branch
    ( .\n " make btree branch" .S )
    int32 4 cell* dallot
    ' btree-branch over btree-branch-type !
    arg0 over btree-branch-value !
    arg1 over btree-branch-right !
    arg2 over btree-branch-left !
    return1
end

def btree-branch-shift
    args( branch ++ least-value ok? )
    arg0 btree-branch? IF
        ( shift from the left )
        btree-branch-left @ btree-branch-shift IF
            true return2
        THEN
        ( left is empty so shift right's least & return the branch's value )
        arg0 btree-branch-right @ btree-branch-shift IF
            arg0 btree-branch-value @
            swap arg0 btree-branch-value !
            true return2
        THEN
    THEN
    terminator? UNLESS
        ordered-seq-shift return2
    THEN
    int32 -1 false return2
end

def btree-branch-pop
    args( branch ++ greatest-value ok? )
    arg0 btree-branch? IF
        ( pop from the right )
        btree-branch-right @ btree-branch-pop IF
            true return2
        THEN
        ( rightis empty so pop left's greatest & return the branch's value )
        arg0 btree-branch-left @ btree-branch-pop IF
            arg0 btree-branch-value @
            swap arg0 btree-branch-value !
            true return2
        THEN
    THEN
    terminator? UNLESS
        ordered-seq-pop return2
    THEN
    int32 -1 false return2
end

def btree-branch-shift-left
    args( branch sort-fn key-fn ++ ok? )
    ( " shift-left" .S )
    arg2 btree-branch-value @
    arg2 btree-branch-left @
    arg1
    arg0
    btree-branch-add-inner UNLESS
        dup int32 4 overn equals UNLESS
            " btree-branch-shift-left rejected a lesser value"
            " btree-error"
            error
        THEN
        false return1
    THEN
    arg2 btree-branch-right @ btree-branch-shift IF
        ( " shifted" .S ,i )
        arg2 btree-branch-value !
        true return1
    ELSE
        false return1
    THEN
end

def btree-branch-full?
    args( branch ++ yes? )
    arg0 btree-branch? IF
        arg0 btree-branch-left @ btree-branch-full? swapdrop
        arg0 btree-branch-right @ btree-branch-full? swapdrop
        logand return1
    THEN
    terminator? IF false return1 THEN
    ordered-seq-full? return1
end

def btree-branch-add-inner
    args( item branch sort-fn key-fn ++ reject no-reject? )
    ( .\n " branch-add-inner: " .S arg3 .i arg2 .h )
    arg2 btree-branch? IF
        ( left of center? )
        arg3 arg2 btree-branch-value @ arg1 arg0 slot-cmp int32 0 < IF
            ( going left )
            ( " left" .S )
            arg3 arg2 btree-branch-left @ arg1 arg0 btree-branch-add-inner IF
                int32 -1 true return2
            ELSE
                ( left had a reject )
                ( " left-rejected" .S ,i )
                ( set branch value to the left's reject )
                arg2 btree-branch-value @
                swap arg2 btree-branch-value !
                ( try placing the branch value right )
                arg2 btree-branch-right @ arg1 arg0 btree-branch-add-inner return2
            THEN
        ELSE
            ( going right )
            arg3 arg2 btree-branch-right @ arg1 arg0 btree-branch-add-inner IF
                ( " added" .S )
                int32 -1 true return2
            ELSE
                ( right had a reject )
                ( " right rej" .S )
                arg2 btree-branch-left @ btree-branch-full? UNLESS
                    ( " lefting" .S )
                    ( pivot the branch left )
                    arg2 arg1 arg0 btree-branch-shift-left UNLESS
                        ( " shift failed" .S )
                        int32 4 dropn
                        false return2
                    ELSE
                        ( " trying again" .S )
                        ( try adding the reject )
                        int32 4 dropn
                        set-arg3
                        drop-locals RECURSE
                    THEN
                ELSE
                    ( " left full" .S )
                    drop false return2
                THEN
            THEN
        THEN
    THEN
    terminator? IF
        ( todo make a leaf branch )
        ( " terminator" .S )
        arg3 false return2
    THEN
    ( " leaves" .S )
    arg3 arg2 arg1 arg0 ordered-seq-add return2
end

def btree-move-leaves
    args( src dest sort-fn key-fn n )
    ( .\n " move-leaves" .S arg0 .i )
    arg0 int32 1 > IF
        arg0 int32 1 int-sub set-arg0
        arg4 ordered-seq-pop IF
            arg3 arg2 arg1 ordered-seq-add IF
                drop-locals RECURSE
            THEN
        THEN
        false return2
    ELSE
        arg4 ordered-seq-pop return2
    THEN
end

def btree-split-leaves
    args( ordered-seq sort-fn key-fn ++ new-branch )
    ( .\n " split" .S )
    ( make a new ordered seq for the right )
    arg2 ordered-seq-max-count swapdrop make-ordered-seq swapdrop
    ( line up some args )
    arg2 over arg1 arg0
    ( dividing the seq in half )
    arg2 ordered-seq-count @ int32 2 int-div
    btree-move-leaves UNLESS
        " failed to split branch" " btree-error" error
    THEN
    ( make the branch with a new left leaf )
    arg2 local0 shift make-btree-branch
    return1
end

def make-empty-btree-branch
    args( median span ++ branch )
    arg0 make-ordered-seq swapdrop
    arg0 make-ordered-seq swapdrop
    arg1
    make-btree-branch
    return1
end

def btree-branch-promote
    arg1 btree-branch-shift IF
        swap
        arg0 make-ordered-seq swapdrop
        shift
        make-btree-branch return1
    THEN
    arg1 return1
end

def btree-branch-recursive-split
    args( branch span sort-fn key-fn ++ new-branch)
    arg3 btree-branch-left @ arg2 arg1 arg0 btree-split rotdrop2 rotdrop2
    arg3 btree-branch-right @ arg2 arg1 arg0 btree-split rotdrop2 rotdrop2
    arg3 btree-branch-value @
    make-btree-branch return1
end

def btree-split
    args( branch span sort-fn key-fn ++ new-branch)
    arg3
    btree-branch? IF arg2 arg1 arg0 btree-branch-recursive-split return1 THEN
    terminator? IF arg3 return1 THEN
    arg1 arg0 btree-split-leaves return1
end

def btree-branch-add
    args( item branch span sort-fn key-fn ++ new-branch )
    ( " branch-add: " .S arg4 .i )
    arg4 arg3 arg1 arg0 btree-branch-add-inner UNLESS
        ( " rejected" .S ,i )
        arg3 arg2 arg1 arg0 btree-split rotdrop2 rotdrop2
        arg1 arg0 btree-branch-add-inner UNLESS
            " unable to add item" " btree-error" error
        THEN
        drop3 return1
    THEN
    arg3 return1
end

def btree-branch-find-parent
    args( key branch sort-fn key-fn ++ btree-branch found? )
    .\n " find-parent" .S arg2 .h
    arg2 btree-branch? IF
        arg3 over btree-branch-value @ arg1 arg0 key-slot-cmp
        dup int32 0 equals IF
            arg2 true return2
        THEN
        int32 0 < IF
            arg2 btree-branch-left @
        ELSE
            arg2 btree-branch-right @
        THEN set-arg2
        drop-locals RECURSE
    THEN
    terminator? UNLESS
        arg3 arg2 arg1 arg0 ordered-seq-index IF
            arg2 true return2
        THEN
    THEN
    int32 0 false return2
end

def btree-branch-find
    args( key branch sort-fn key-fn ++ item found? )
    .\n " find" .S arg3 .h arg2 .h
    arg2 btree-branch? IF
        " branch" .S
        arg3 over btree-branch-value @ arg1 arg0 key-slot-cmp ,i
        dup int32 0 equals IF
            arg2 btree-branch-value @ true return2
        THEN
        int32 0 < IF
            arg2 btree-branch-left @
        ELSE
            arg2 btree-branch-right @
        THEN set-arg2
        drop-locals RECURSE
    THEN
    terminator? UNLESS
        " leaves" .S
        arg3 arg2 arg1 arg0 ordered-seq-find IF
            true return2
        THEN
    THEN
    " done" .S
    int32 0 false return2
end

def btree-branch-reduce
    args( branch fn accumulator ++ result )
    arg2 btree-branch? IF
        arg2 btree-branch-left @ arg1 arg0 btree-branch-reduce
        arg2 btree-branch-value @ swap arg1 exec-core-word
        arg2 btree-branch-right @ arg1 shift btree-branch-reduce
        return1
    THEN
    terminator? UNLESS
        arg1 arg0 reduce-ordered-seq return1
    THEN
    arg0 return1
end

def btree-branch-map
    args( branch fn )
    arg1 btree-branch? IF
        dup btree-branch-left @ arg0 btree-branch-map drop2
        dup btree-branch-value @ arg0 exec-core-word drop
        dup btree-branch-right @ arg0 btree-branch-map drop2
        drop
        return0
    THEN
    terminator? UNLESS
        arg0 map-ordered-seq
    THEN
end

def indent-loop
    args( count string )
    arg1 int32 0 > UNLESS return0 THEN
    arg1 int32 1 int-sub set-arg1
    arg0 write-string
    RECURSE
end

def indent
    args( count string )
    arg1 arg0 indent-loop
end


def btree-branch-dump
    arg0 btree-branch? IF
        " (" .s arg0 btree-branch-value @ .i
        arg0 btree-branch-full? IF " full" ELSE " vacancy" THEN dim .S color-reset drop
        arg1 int32 1 int-add
        .\n "  " indent drop
        arg0 btree-branch-left @ btree-branch-dump drop
        .\n "  " indent drop
        arg0 btree-branch-right @ btree-branch-dump
        " )" .S
        return0
    THEN
    terminator? IF
        " terminator" .S
        return0
    THEN
    " [" .S
    ' ,i map-ordered-seq
    " ]" .S
end

(
structure btree
field sort-fn
field key-fn
field tip
field span
)

def btree-sort-fn arg0 return1-1 end
def btree-key-fn arg0 cell+ return1-1 end
def btree-tip arg0 cell+2 return1-1 end
def btree-span arg0 cell+3 return1-1 end

def dallot-btree
    int32 4 cell* dallot return1
end

def make-btree
    args( span sort-fn key-fn ++ btree-ptr )
    dallot-btree
    arg0 local0 btree-key-fn !
    arg1 local0 btree-sort-fn !
    arg2 local0 btree-span !
    arg2 make-ordered-seq local0 btree-tip !
    local0 return1
end

def btree-add
    args( item btree )
    arg1
    arg0 btree-tip @
    arg0 btree-span @
    arg0 btree-sort-fn @
    arg0 btree-key-fn @
    btree-branch-add arg0 btree-tip !
end

def btree-find
    arg1
    arg0 btree-tip @
    arg0 btree-sort-fn @
    arg0 btree-key-fn @
    btree-branch-find
    return2
end

def btree-find-parent
    args( item btree ++ btree-branch found? | ordered-seq found? )
    arg1
    arg0 btree-tip @
    arg0 btree-sort-fn @
    arg0 btree-key-fn @
    btree-branch-find-parent
    return2
end

def btree-reduce
    args( btree fn initial ++ result )
    arg2 btree-tip @
    arg1
    arg0
    btree-branch-reduce
    return1
end

def btree-map
    args( btree fn )
    arg1 btree-tip @
    arg0
    btree-branch-map
end

def btree-dump
    int32 1 arg0 btree-tip @ btree-branch-dump
end

( Test cases: )

def test-btree-add-loop
    arg0 int32 0 > UNLESS return0 THEN
    arg0 int32 1 int-sub set-arg0
    arg0 arg1 exec-core-word arg2 btree-add
    .\n " btree-map: " .S arg2 ' ,i btree-map drop2
    .\n " btree dump: " .S int32 2 overn .i
    .\n arg2 btree-dump
    RECURSE
end

def test-btree
    zero
    dhere
    int32 2 ' <=> ' identity make-btree store-local0
    local1 cell-size int-add local0 " last thing on the data stack" assert-equal drop3
    local1 int32 13 cell+n rotdrop2
    dhere " alloted 2+11 cells" assert-equal

    int32 10 local0 btree-add
    int32 1 local0 btree-tip @ ordered-seq-count @ " increased tip's count" assert-equal
    int32 10 local0 btree-find-parent
    true " found the item 10" assert-equal int32 3 dropn
    local0 btree-tip @ " in the tip" assert-equal

    int32 20 local0 btree-add
    int32 20 local0 btree-find-parent
    true " found the item 20" assert-equal int32 3 dropn
    local0 btree-tip @ " in the tip" assert-equal

    int32 30 local0 btree-add
    int32 30 local0 btree-find-parent
    true " found the item 30" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-right @
    " in the right branch" assert-equal

    int32 40 local0 btree-add
    int32 40 local0 btree-find-parent
    true " found the item 40" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-right @
    " in the right branch" assert-equal

    int32 15 local0 btree-add
    int32 15 local0 btree-find-parent
    true " found the item 15" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-left @
    " in the left branch" assert-equal

    " btree-map: " .S local0 ' ,i btree-map .\n

    int32 50 local0 btree-add
    int32 50 local0 btree-find-parent
    true " found the item 50" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-right @ btree-branch-right @
    " in the right branch's right branch" assert-equal

    " btree-map: " .S local0 ' ,i btree-map .\n

    int32 0 local0 btree-add
    int32 0 local0 btree-find-parent
    true " found the item 0" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-left @ btree-branch-left @
    " in the left branch's left branch" assert-equal

    int32 5 local0 btree-add
    int32 5 local0 btree-find-parent
    true " found the item 5" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-left @ btree-branch-left @
    " in the left branch's left branch" assert-equal

    " btree-map: " .S local0 ' ,i btree-map .\n

    int32 60 local0 btree-add
    int32 60 local0 btree-find-parent
    true " found the item 60" assert-equal int32 3 dropn
    local0 btree-tip @ btree-branch-right @ btree-branch-right @
    " in the right branch's right branch" assert-equal

    " btree-map: " .S local0 ' ,i btree-map .\n
    local0 ' int-add int32 0 btree-reduce " Reduced: " .S ,d .\n
    int32 230 " summed up the values" assert-equal

    local0 return1
end

def test-btree-add/2
    zero
    arg0 ' <=> ' identity make-btree store-local0
    local0 ' identity arg1 test-btree-add-loop
    local0 return1
end

def test-btree-add
    int32 64 int32 3 test-btree-add/2 return1
end

def random-1k
    int32 1000 rand-n return1
end

def test-btree-add-rand/2
    zero
    arg0 ' <=> ' identity make-btree store-local0
    local0 ' random-1k arg1 test-btree-add-loop
    local0 return1
end

def test-btree-add-rand
    int32 1234567 rand-seed !
    int32 64 int32 3 test-btree-add-rand/2 return1
end

def test-btree-add-neg/2
    zero
    arg0 ' <=> ' identity make-btree store-local0
    local0 ' negate arg1 test-btree-add-loop
    local0 return1
end

def test-btree-add-neg
    int32 64 int32 3 test-btree-add-neg/2 return1
end
