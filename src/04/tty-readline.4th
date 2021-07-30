def dict-lookup-data
    arg0 arg1 dict-lookup
    null? IF arg0 " dict-not-found-error" error THEN
    cell+2 return1 ( fixme use dict-entry-data, but without peek )
end

def clamp-pointer-value-to-max
  doc( Change the value to `max-value` when the value pointed to by `pointer` is greater than `max-value`. )
  args( max-value pointer )
  arg1
  arg0 dup peek > IF
    poke
  THEN
end

( TTY readline like line editor. )

constant TTY-MAX-INPUT 128
constant TTY-READLINE-MAX-HISTORY 32
global-var *TTY-READLINE-DICT*

( Accessors )

def tty-readline-max-input arg0 " *max-input*" dict-lookup-data return1-1 end
def tty-readline-length arg0 " *length*" dict-lookup-data return1-1 end
def tty-readline-cursor arg0 " *cursor*" dict-lookup-data return1-1 end
def tty-readline-buffer arg0 " *buffer*" dict-lookup-data return1-1 end
def tty-readline-mark arg0 " *mark*" dict-lookup-data return1-1 end
def tty-readline-paste-buffer arg0 " *paste-buffer*" dict-lookup-data return1-1 end
def tty-readline-history arg0 " *history*" dict-lookup-data return1-1 end
def tty-readline-history-tip-in arg0 " *history-tip-in*" dict-lookup-data return1-1 end
def tty-readline-history-tip-out arg0 " *history-tip-out*" dict-lookup-data return1-1 end

( Drawing )

def tty-readline-redraw
    tty-cursor-home tty-erase-line
    prompt
    tty-cursor-save
    arg0 tty-readline-buffer @ null? IF return0 THEN
    arg0 tty-readline-length @ write-string-n
    tty-cursor-restore
    arg0 tty-readline-cursor @
    dup int32 1 >= IF tty-cursor-right THEN
end

def tty-readline-redraw-text-from
  arg1
  tty-cursor-save
  arg0 tty-readline-buffer @ seq-data local0 int32 1 int-sub cell+n swapdrop
  arg0 tty-readline-length @ local0 int-sub
  write-string-n
  tty-cursor-restore
end

def tty-readline-redraw-from-cursor
  arg0 tty-readline-cursor @
  arg0 tty-readline-redraw-text-from
end

def tty-readline-redraw-text
  int32 0
  arg0 tty-readline-redraw-text-from
end

( Cursor motion )

def tty-readline-move-cursor
    args( dict position )
    arg0 negative? IF drop int32 0 ELSE
      dup arg1 tty-readline-length @ >= IF arg1 tty-readline-length @ THEN
    THEN
    arg1 tty-readline-cursor !
end

def tty-readline-move-cursor-by
    args( dict amount )
    arg1
    dup tty-readline-cursor @ arg0 int-add
    tty-readline-move-cursor
end

def tty-readline-cursor-home
  ( update tty )
  arg0 tty-readline-cursor @ tty-cursor-left
  ( update state )
  arg0 int32 0 tty-readline-move-cursor
end

def tty-readline-cursor-end
  ( update tty )
  arg0 tty-readline-length @
  arg0 tty-readline-cursor @
  int-sub dup int32 0 equals UNLESS tty-cursor-right THEN
  ( update state )
  arg0 dup tty-readline-length @ tty-readline-move-cursor
end

def tty-readline-clamp-cursor-to
  arg1 arg0 tty-readline-cursor clamp-pointer-value-to-max
end

def tty-readline-clamp-mark-to
  arg1 arg0 tty-readline-mark clamp-pointer-value-to-max
end

def tty-readline-clamp-cursors
  arg0 tty-readline-length @
  arg0 tty-readline-clamp-cursor-to tty-readline-clamp-mark-to
end

def tty-readline-at-beginning?
    arg0 tty-readline-cursor @ int32 0 equals return1-1
end

def tty-readline-back-char
  ( update tty )
  arg0 tty-readline-at-beginning? UNLESS int32 1 tty-cursor-left THEN
  ( update record )
  arg0 int32 -1 tty-readline-move-cursor-by
end

def tty-readline-forward-char
  ( update state )
  arg0 tty-readline-at-end? UNLESS int32 1 tty-cursor-right THEN
  ( update record )
  arg0 int32 1 tty-readline-move-cursor-by
end

def tty-readline-change-length-by
  args( num-chars readline-dict )
  arg0 tty-readline-length
  dup @ arg1 int-add
  ( clamp the size to 0..max-input )
  arg0 tty-readline-max-input @ min-int
  int32 0 max-int
  ( poke )
  swap !
end

( Input shifting )

def tty-readline-shift-buffer-right
  args( readline cursor-pos num-right )
  arg2 tty-readline-buffer @ null? IF " *buffer* unallocated" " tty-readline-error" error THEN
  ( src: pointer to cursor position )
  seq-data arg1 cell+n rotdrop2
  ( dest: src + arg0 )
  arg0 cell+n swapdrop
  ( length: input length - cursor )
  arg2 tty-readline-length @ arg1 int-sub
  ( clamp to max input - [cursor + offset] )
  dup arg1 int-add arg0 int-add
  arg2 tty-readline-max-input @
  int-sub dup int32 0 > IF int-sub ELSE drop THEN
  cell* swapdrop
  ( do it )
  copydown
end

def tty-readline-shift-buffer-left/3
  args( readline cursor-pos count )
  ( buffer pointer )
  arg2 tty-readline-buffer @ null? IF " *buffer* unallocated" " tty-readline-error" error THEN
  arg2 tty-readline-length @ arg1 <= IF return0 THEN
  ( dest: buffer + cursor )
  seq-data arg1 cell+n
  ( src: dest + count )
  arg0 cell+n swapdrop
  arg2 tty-readline-length @
  over <= IF
    drop
    arg2 tty-readline-length @
    cell+n swapdrop
  THEN
  ( dest <-> src )
  swap
  ( chars to copy = length - cursor - count )
  arg2 tty-readline-length @
  arg1 int-sub
  arg0 int-sub
  cell* swapdrop
  ( do it )
  copy
end

def tty-readline-shift-buffer-left
  args( readline cursor-pos )
  arg1 arg0 int32 1 tty-readline-shift-buffer-left/3
end

( Erasing )

def tty-readline-erase-from/3
  args( start-index count dict )
  doc( Erase input text from the start for count characters. )
  ( shift input )
  arg0 arg2 arg1 tty-readline-shift-buffer-left/3
  ( update length )
  arg1 negate arg0 tty-readline-change-length-by
end

def tty-readline-erase-from
  args( dict index )
  doc( Erase input text from the index to the end. )
  arg0
  arg1 tty-readline-length @ arg0 int-sub
  arg1 tty-readline-erase-from/3
  arg1 tty-readline-clamp-cursors
end

def tty-readline-erase
  arg0 int32 0 tty-readline-erase-from tty-readline-move-cursor
  arg0 tty-readline-redraw
end

def tty-readline-erase-char
  arg0 tty-readline-cursor @ int32 0 equals IF " beginning of line" write-line return0 THEN
  ( shift input left )
  arg0
  arg0 tty-readline-cursor @ int32 1 int-sub
  tty-readline-shift-buffer-left
  ( move cursor back )
  arg0 tty-readline-back-char
  ( decrease length )
  int32 -1 arg0 tty-readline-change-length-by
  arg0 tty-readline-redraw
end

def tty-readline-delete-char
  ( shift input left )
  arg0 arg0 tty-readline-cursor @ tty-readline-shift-buffer-left
  ( decrease length )
  int32 -1 arg0 tty-readline-change-length-by
  arg0 tty-readline-redraw
end

( Command completion )

def tty-readline-complete
  " Auto completing... " .S
  arg0 tty-readline-buffer @ ( seq-data ) ( FIXME need to use seq-data everytime elsewhere )
  arg0 tty-readline-cursor @
  write-line-n
  arg0 tty-readline-redraw
end

( Command History: )

def tty-readline-history-allot
  TTY-READLINE-MAX-HISTORY dallot-seq
  TTY-READLINE-MAX-HISTORY DOTIMES[
    TTY-MAX-INPUT dallot-seq
    int32 0 over !
    arg2 arg0 seq-poke
    drop3
  ]DOTIMES
  local0 return1
end

def tty-readline-history-nth
  args( n dict )
  arg0 tty-readline-history @
  arg1 seq-peek return1
end

def tty-readline-history-tip-in-inc!
  arg0 tty-readline-history-tip-in @
  dup TTY-READLINE-MAX-HISTORY >= IF
    drop int32 0
  ELSE
    int32 1 int-add
  THEN
  arg0 tty-readline-history-tip-in !
end

def tty-readline-history-tip-out-dec!
  arg0 tty-readline-history-tip-out @
  dup int32 0 <= IF
    drop TTY-READLINE-MAX-HISTORY
  THEN
  int32 1 int-sub
  arg0 tty-readline-history-tip-out !
end

def tty-readline-history-tip-out-inc!
  arg0 tty-readline-history-tip-out @
  int32 1 int-add
  dup TTY-READLINE-MAX-HISTORY >= IF
    drop int32 0
  THEN
  arg0 tty-readline-history-tip-out !
end

def tty-readline-history-push/3
  args( string-ptr length dict )
  arg0 tty-readline-history-tip-in @
  arg0 tty-readline-history-nth rotdrop2
  ( copy string )
  arg2
  local0 seq-data swapdrop
  arg1 cell* swapdrop
  copy drop3
  ( update seq length )
  arg1 local0 !
  ( adjust history's tips )
  arg0 tty-readline-history-tip-in-inc!
  tty-readline-history-tip-in @
  arg0 tty-readline-history-tip-out !
end

def tty-readline-history-push
  args( dict )
  arg0 tty-readline-buffer @ seq-data swapdrop
  arg0 tty-readline-length @
  arg0 tty-readline-history-push/3
end

def tty-readline-paste-history
  arg0 tty-readline-history-tip-out @
  arg0 tty-readline-history-nth
  arg0 tty-readline-insert-string
end

def tty-readline-use-history
  arg0
  tty-readline-erase
  tty-readline-paste-history
  tty-readline-cursor-end
  tty-readline-redraw-text
  tty-readline-length @ tty-cursor-right
end

def tty-readline-history-prev
  arg0 tty-readline-history-tip-out-dec! tty-readline-use-history
end

def tty-readline-history-next
  arg0 tty-readline-history-tip-out-inc! tty-readline-use-history
end

( Command execution )

def tty-readline-exec
    " Read: " .s
    arg0 tty-readline-length @ write-int write-space
    arg0 tty-readline-buffer @
    swap write-line-n
    swap seq-data swapdrop swap
    arg0 tty-readline-history-push/3
    tty-readline-erase tty-readline-redraw
end

( Predicates )

def tty-readline-full?
    arg0 tty-readline-max-input @
    arg0 tty-readline-length @
    <= return1-1
end

def tty-readline-at-end?
    arg0 tty-readline-length @
    arg0 tty-readline-cursor @
    <= return1-1
end

def tty-readline-at-max?
    arg0 tty-readline-max-input @
    arg0 tty-readline-cursor @
    <= return1-1
end

( Input buffer editing )

def tty-readline-insert-char
    arg0 tty-readline-at-max? IF return0 THEN
    ( write the character to the tty )
    arg1 write-byte
    arg0 tty-readline-redraw-from-cursor
    ( shift input right )
    arg0 tty-readline-at-end? UNLESS
      arg0 arg0 tty-readline-cursor @ int32 1 tty-readline-shift-buffer-right
    THEN
    ( update the buffer )
    arg1
    arg0 tty-readline-buffer @
    null? IF " *buffer* unallocated" " tty-readline-error" error THEN
    arg0 tty-readline-cursor @
    seq-poke
    ( increase length )
    int32 1 arg0 tty-readline-change-length-by
    ( move cursor )
    arg0 int32 1 tty-readline-move-cursor-by
end

def tty-readline-replace
    arg1
    arg0 tty-readline-buffer @
    null? IF " *buffer* unallocated" " tty-readline-error" error THEN
    arg0 tty-readline-cursor @
    seq-poke
    arg0 tty-readline-at-end? IF arg0 tty-readline-length dup @ int32 1 int-add swap ! THEN
    arg0 tty-readline-forward-char
end

( Copy and paste )

def tty-readline-set-mark
  arg0 tty-readline-cursor @
  .\n " mark set: " .s ,i .\n
  arg0 tty-readline-mark !
  arg0 tty-readline-redraw
end

def tty-readline-insert-string-at
  args( string position readline-dict )
  arg2
  seq-length
  ( shift input after cursor by the paste buffer's length )
  arg0 tty-readline-at-end? UNLESS
    arg0 arg1 local1 tty-readline-shift-buffer-right
  THEN
  ( copy the string )
  ( src: )
  local0 seq-data swapdrop
  ( dest: )
  arg0 tty-readline-buffer @ seq-data swapdrop
  arg1 cell+n rotdrop2
  ( length: limited to max )
  arg1 local1 int-add arg0 tty-readline-max-input @ < IF
    local1
  ELSE
    arg0 tty-readline-max-input @ arg1 int-sub
  THEN
  cell* swapdrop
  copy
  ( increase input buffer's length )
  local1 arg0 tty-readline-change-length-by
  ( move the cursor )
  arg0 local1 tty-readline-move-cursor-by
end

def tty-readline-insert-string
  args( string readline-dict )
  arg1
  arg0 tty-readline-cursor @
  arg0 tty-readline-insert-string-at
end

def tty-readline-paste
  arg0 tty-readline-paste-buffer @
  arg0 tty-readline-cursor @
  arg0 tty-readline-insert-string-at
  arg0 tty-readline-redraw
end

def tty-readline-yank-string
  args( pointer num-characters dict )
  ( copy the characters to the paste buffer )
  arg2
  arg0 tty-readline-paste-buffer @ seq-data swapdrop
  arg1 cell* swapdrop
  copy
  ( update seq length )
  arg1 arg0 tty-readline-paste-buffer @ !
end

def tty-readline-yank
  doc( Yank the text between the cursor to the mark. )
  ( yank from cursor or mark? )
  arg0 tty-readline-cursor @
  arg0 tty-readline-mark @
  minmax-int
  ( copy the characters to the paste buffer )
  arg0 tty-readline-buffer @ seq-data swapdrop local0 cell+n rotdrop2
  local1 local0 int-sub
  arg0 tty-readline-yank-string
end

def tty-readline-yank-from-cursor-to-end
  arg0 tty-readline-buffer @ seq-data swapdrop
  arg0 tty-readline-cursor @ cell+n rotdrop2
  arg0 tty-readline-length @ arg0 tty-readline-cursor @ int-sub
  arg0 tty-readline-yank-string
end

def tty-readline-erase-from-cursor
  arg0 tty-readline-yank-from-cursor-to-end
  arg0 dup tty-readline-cursor @ tty-readline-erase-from
  arg0 tty-readline-redraw
end

def tty-readline-erase-marked
  arg0 tty-readline-cursor @
  arg0 tty-readline-mark @
  minmax-int
  2dup int-sub abs-int
  local0 over arg0 tty-readline-erase-from/3
  arg0 tty-readline-clamp-cursors
end

def tty-readline-cut
  doc( Yank and erase the text between the cursor and mark. )
  arg0 tty-readline-yank
  tty-readline-erase-marked
  arg0 tty-readline-redraw
end

( Testing functions )

def tty-readline-insert-nolan
  " nolan" arg0 tty-readline-insert-string
end

def tty-readline-shift-by-five
  .\n " shift by five" .s .\n
  arg0
  arg0 tty-readline-cursor @
  int32 5
  tty-readline-shift-buffer-right
  int32 5 arg0 tty-readline-change-length-by
  arg0 tty-readline-redraw
end

def tty-readline-report
  .\n " tty-readline:" .s .\n
  " buffer: " .s arg0 tty-readline-buffer @ seq-length .i ,sp write-line
  " paste: " .s arg0 tty-readline-paste-buffer @ seq-length .i ,sp write-line
  " length: " .s arg0 tty-readline-length @ .i .\n
  " cursor: " .s arg0 tty-readline-cursor @ .i .\n
  " mark: " .s arg0 tty-readline-mark @ .i .\n
  " history: " .s
  arg0 tty-readline-history-tip-in @ .i ,sp
  arg0 tty-readline-history-tip-out @ .i ,sp
  arg0 tty-readline-history @
  seq-length .i .\n
  TTY-READLINE-MAX-HISTORY DOTIMES[
    arg2 arg0 ,i ,sp
    seq-peek ,h ,sp
    seq-length .i ,sp .s .\n
    drop2
  ]DOTIMES
  .\n arg0 tty-readline-redraw
end

( Readline initialization )

def tty-readline-dict
    terminator
    ( Key bindings )
    " M-\e" aliases> tty-readeval-done!
    " <up>" aliases> tty-readline-history-prev
    " <down>" aliases> tty-readline-history-next
    " <left>" aliases> tty-readline-back-char
    " <right>" aliases> tty-readline-forward-char
    " C-a" aliases> tty-readline-cursor-home
    " C-b" aliases> tty-readline-back-char
    " C-d" aliases> tty-readline-delete-char
    " C-e" aliases> tty-readline-cursor-end
    " C-f" aliases> tty-readline-forward-char
    " C-g" aliases> tty-readline-erase
    " C-h" aliases> tty-readline-erase-char
    " C-i" aliases> tty-readline-complete
    " \t" aliases> tty-readline-complete
    " C-k" aliases> tty-readline-erase-from-cursor
    " C-l" aliases> tty-readline-redraw
    " C-j" aliases> tty-readline-exec
    " \n" aliases> tty-readline-exec
    " C-m" aliases> tty-readline-exec
    " \r" aliases> tty-readline-exec
    " C-n" aliases> tty-readline-history-next
    " C-M-n" aliases> tty-readline-shift-by-five
    " M-n" aliases> tty-readline-insert-nolan
    " C-p" aliases> tty-readline-history-prev
    " C-r" aliases> tty-readline-report
    " C-y" aliases> tty-readline-paste
    " C-w" aliases> tty-readline-cut
    " M-w" aliases> tty-readline-yank
    " C-?" aliases> tty-readline-erase-char
    " C-`" aliases> tty-readline-set-mark
    " C-t" aliases> tty-readline-history-push
    ( Readline state )
    " *max-input*" aliases> TTY-MAX-INPUT
    " *buffer*" ' value-peeker dict-entry-code swapdrop TTY-MAX-INPUT dallot-seq make-dict/4
    " *cursor*" ' value-peeker dict-entry-code swapdrop int32 0 make-dict/4
    " *length*" ' value-peeker dict-entry-code swapdrop int32 0 make-dict/4
    " *mark*" ' value-peeker dict-entry-code swapdrop int32 0 make-dict/4
    " *history*" ' value-peeker dict-entry-code swapdrop tty-readline-history-allot make-dict/4
    " *history-tip-in*" ' value-peeker dict-entry-code swapdrop int32 0 make-dict/4
    " *history-tip-out*" ' value-peeker dict-entry-code swapdrop int32 0 make-dict/4
    " *paste-buffer*" ' value-peeker dict-entry-code swapdrop TTY-MAX-INPUT dallot-seq int32 0 over ! make-dict/4
    ( Command excution )
    " on-char" aliases> tty-readline-insert-char
    ( Readeval words )
    tty-make-readeval-default-dict
    return1
end

def tty-readline-init
  *TTY-READLINE-DICT* @ null? IF
    tty-readline-dict dup *TTY-READLINE-DICT* !
  THEN
  return1
end

( The API's face )

def tty-readline
  tty-readline-init tty-readline-redraw tty-readeval
end
