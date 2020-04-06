: dict-lookup-data
    arg0 arg1 dict-lookup
    null? IF arg0 " dict-not-found-error" error THEN
    cell+2 return1 ( fixme use dict-entry-data, but without peek )
;

( TTY readline like line editor. )

constant TTY-MAX-INPUT 128
constant TTY-READLINE-MAX-HISTORY 32
global-var *TTY-READLINE-DICT*

( Accessors )

: tty-readline-max-input arg0 " *max-input*" dict-lookup-data return1-1 ;
: tty-readline-length arg0 " *length*" dict-lookup-data return1-1 ;
: tty-readline-cursor arg0 " *cursor*" dict-lookup-data return1-1 ;
: tty-readline-buffer arg0 " *buffer*" dict-lookup-data return1-1 ;
: tty-readline-mark arg0 " *mark*" dict-lookup-data return1-1 ;
: tty-readline-paste-buffer arg0 " *paste-buffer*" dict-lookup-data return1-1 ;
: tty-readline-history arg0 " *history*" dict-lookup-data return1-1 ;
: tty-readline-history-tip-in arg0 " *history-tip-in*" dict-lookup-data return1-1 ;
: tty-readline-history-tip-out arg0 " *history-tip-out*" dict-lookup-data return1-1 ;

( Drawing )

: tty-readline-redraw
    tty-cursor-home tty-erase-line
    prompt
    tty-cursor-save
    arg0 tty-readline-buffer @ null? IF return0 THEN
    arg0 tty-readline-length @ write-string-n
    tty-cursor-restore
    arg0 tty-readline-cursor @
    dup int32 1 >= IF tty-cursor-right THEN
;

: tty-readline-redraw-text-from
  arg1
  tty-cursor-save
  arg0 tty-readline-buffer @ seq-data local0 int32 1 int-sub cell+n swapdrop
  arg0 tty-readline-length @ local0 int-sub
  write-string-n
  tty-cursor-restore
;

: tty-readline-redraw-from-cursor
  arg0 tty-readline-cursor @
  arg0 tty-readline-redraw-text-from
;

: tty-readline-redraw-text
  int32 0
  arg0 tty-readline-redraw-text-from
;

( Cursor motion )

: tty-readline-move-cursor
    args( dict position )
    arg0 negative? IF drop int32 0 ELSE
      dup arg1 tty-readline-length @ >= IF arg1 tty-readline-length @ THEN
    THEN
    arg1 tty-readline-cursor !
;

: tty-readline-move-cursor-by
    args( dict amount )
    arg1
    dup tty-readline-cursor @ arg0 int-add
    tty-readline-move-cursor
;

: tty-readline-cursor-home
  ( update tty )
  arg0 tty-readline-cursor @ tty-cursor-left
  ( update state )
  arg0 int32 0 tty-readline-move-cursor
;

: tty-readline-cursor-end
  ( update tty )
  arg0 tty-readline-length @
  arg0 tty-readline-cursor @
  int-sub dup int32 0 equals UNLESS tty-cursor-right THEN
  ( update state )
  arg0 dup tty-readline-length @ tty-readline-move-cursor
;

: tty-readline-at-beginning?
    arg0 tty-readline-cursor @ int32 0 equals return1-1
;

: tty-readline-back-char
  ( update tty )
  arg0 tty-readline-at-beginning? UNLESS int32 1 tty-cursor-left THEN
  ( update record )
  arg0 int32 -1 tty-readline-move-cursor-by
;

: tty-readline-forward-char
  ( update state )
  arg0 tty-readline-at-end? UNLESS int32 1 tty-cursor-right THEN
  ( update record )
  arg0 int32 1 tty-readline-move-cursor-by
;

: tty-readline-change-length-by
  args( num-chars readline-dict )
  arg0 tty-readline-length
  dup @ arg1 int-add
  ( clamp the size to 0..max-input )
  arg0 tty-readline-max-input @ min-int
  int32 0 max-int
  ( poke )
  swap !
;

( Erasing )

( todo copy to paste buffer )
: tty-readline-erase-from
    args( dict index )
    arg1 tty-readline-buffer @
    null? IF " *buffer* unallocated" " tty-readline-error" error THEN
    seq-data arg0 cell+n rotdrop2
    arg1 tty-readline-max-input @ arg0 cell-n rotdrop2
    fill
    ( update length )
    arg0 arg1 tty-readline-length !
    ( update cursor )
    arg0 arg1 tty-readline-cursor @ < IF
      arg0 arg1 tty-readline-cursor !
    THEN
    ( update mark )
    arg0 arg1 tty-readline-mark @ < IF
      arg0 arg1 tty-readline-mark !
    THEN
;

: tty-readline-erase
    arg0 int32 0 tty-readline-erase-from tty-readline-move-cursor
    arg0 tty-readline-redraw
;

: tty-readline-erase-from-cursor
    arg0 dup tty-readline-cursor @ tty-readline-erase-from
    arg0 tty-readline-redraw
;

: tty-readline-erase-char
  arg0 tty-readline-cursor @ int32 0 equals IF " beginning of line" write-line return0 THEN
  ( shift input left )
  arg0 arg0 tty-readline-cursor @ tty-readline-shift-buffer-left
  ( move cursor back )
  arg0 tty-readline-back-char
  ( decrease length )
  int32 -1 arg0 tty-readline-change-length-by
  arg0 tty-readline-redraw
;

: tty-readline-delete-char
  ( shift input left )
  arg0 arg0 tty-readline-cursor @ tty-readline-shift-buffer-left
  ( decrease length )
  int32 -1 arg0 tty-readline-change-length-by
  arg0 tty-readline-redraw
;

( Command completion )

: tty-readline-complete
  " Auto completing... " .S
  arg0 tty-readline-buffer @ ( seq-data ) ( FIXME need to use seq-data everytime elsewhere )
  arg0 tty-readline-cursor @
  write-line-n
  arg0 tty-readline-redraw
;

( Command History: )

: tty-readline-history-allot
  TTY-READLINE-MAX-HISTORY dallot-seq
  TTY-READLINE-MAX-HISTORY DOTIMES[
    TTY-MAX-INPUT dallot-seq
    int32 0 over !
    arg2 arg0 seq-poke
    drop3
  ]DOTIMES
  local0 return1
;

: tty-readline-history-nth
  args( n dict )
  arg0 tty-readline-history @
  arg1 seq-peek return1
;

: tty-readline-history-tip-in-inc!
  arg0 tty-readline-history-tip-in @
  dup TTY-READLINE-MAX-HISTORY >= IF
    drop int32 0
  ELSE
    int32 1 int-add
  THEN
  arg0 tty-readline-history-tip-in !
;

: tty-readline-history-tip-out-dec!
  arg0 tty-readline-history-tip-out @
  dup int32 0 <= IF
    drop TTY-READLINE-MAX-HISTORY
  THEN
  int32 1 int-sub
  arg0 tty-readline-history-tip-out !
;

: tty-readline-history-tip-out-inc!
  arg0 tty-readline-history-tip-out @
  int32 1 int-add
  dup TTY-READLINE-MAX-HISTORY >= IF
    drop int32 0
  THEN
  arg0 tty-readline-history-tip-out !
;

: tty-readline-history-push/3
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
;

: tty-readline-history-push
  args( dict )
  arg0 tty-readline-buffer @ seq-data swapdrop
  arg0 tty-readline-length @
  arg0 tty-readline-history-push/3
;

: tty-readline-paste-history
  arg0 tty-readline-history-tip-out @
  arg0 tty-readline-history-nth
  arg0 tty-readline-insert-string
;

: tty-readline-use-history
  arg0
  tty-readline-erase
  tty-readline-paste-history
  tty-readline-cursor-end
  tty-readline-redraw-text
  tty-readline-length @ tty-cursor-right
;

: tty-readline-history-prev
  arg0 tty-readline-history-tip-out-dec! tty-readline-use-history
;

: tty-readline-history-next
  arg0 tty-readline-history-tip-out-inc! tty-readline-use-history
;

( Command execution )

: tty-readline-exec
    " Read: " .s
    arg0 tty-readline-length @ write-int write-space
    arg0 tty-readline-buffer @
    swap write-line-n
    swap seq-data swapdrop swap
    arg0 tty-readline-history-push/3
    tty-readline-erase tty-readline-redraw
;

( Predicates )

: tty-readline-full?
    arg0 tty-readline-max-input @
    arg0 tty-readline-length @
    <= return1-1
;

: tty-readline-at-end?
    arg0 tty-readline-length @
    arg0 tty-readline-cursor @
    <= return1-1
;

: tty-readline-at-max?
    arg0 tty-readline-max-input @
    arg0 tty-readline-cursor @
    <= return1-1
;

( Input buffer editing )

: tty-readline-shift-buffer-right
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
;

: tty-readline-insert-char
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
;

: tty-readline-shift-buffer-left
  args( readline cursor-pos )
  ( buffer position )
  arg1 tty-readline-buffer @ null? IF " *buffer* unallocated" " tty-readline-error" error THEN
  seq-data
  arg0 cell+n
  ( src dest )
  cell+ swap
  ( length )
  arg1 tty-readline-length @
  arg0 int-sub
  int32 1 int-sub
  cell* swapdrop
  ( do it )
  copy
;

: tty-readline-replace
    arg1
    arg0 tty-readline-buffer @
    null? IF " *buffer* unallocated" " tty-readline-error" error THEN
    arg0 tty-readline-cursor @
    seq-poke
    arg0 tty-readline-at-end? IF arg0 tty-readline-length dup @ int32 1 int-add swap ! THEN
    arg0 tty-readline-forward-char
;

( Copy and paste )

: tty-readline-set-mark
  arg0 tty-readline-cursor @
  .\n " mark set: " .s ,i .\n
  arg0 tty-readline-mark !
  arg0 tty-readline-redraw
;

: tty-readline-yank
  ( yank from cursor or mark? )
  arg0 tty-readline-cursor @
  arg0 tty-readline-mark @
  minmax-int
  ( number of characters to yank )
  local1 local0 int-sub ( int32 1 int-add )
  ( copy the characters to the paste buffer )
  arg0 tty-readline-buffer @ seq-data swapdrop local0 cell+n rotdrop2
  arg0 tty-readline-paste-buffer @ seq-data swapdrop
  local2 cell* swapdrop
  copy
  ( update seq length )
  local2 arg0 tty-readline-paste-buffer @ !
;

: tty-readline-insert-string-at
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
;

: tty-readline-insert-string
  args( string readline-dict )
  arg1
  arg0 tty-readline-cursor @
  arg0 tty-readline-insert-string-at
;

: tty-readline-paste
  arg0 tty-readline-paste-buffer @
  arg0 tty-readline-cursor @
  arg0 tty-readline-insert-string-at
  arg0 tty-readline-redraw
;

( Testing functions )

: tty-readline-insert-nolan
  " nolan" arg0 tty-readline-insert-string
;

: tty-readline-shift-by-five
  .\n " shift by five" .s .\n
  arg0
  arg0 tty-readline-cursor @
  int32 5
  tty-readline-shift-buffer-right
  int32 5 arg0 tty-readline-change-length-by
  arg0 tty-readline-redraw
;

: tty-readline-report
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
;

( Readline initialization )

: tty-readline-dict
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
;

: tty-readline-init
  *TTY-READLINE-DICT* @ null? IF
    tty-readline-dict dup *TTY-READLINE-DICT* !
  THEN
  return1
;

( The API's face )

: tty-readline
  tty-readline-init tty-readline-redraw tty-readeval
;
