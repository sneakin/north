constant termios-byte-size 60 ( 4 byte align: 4 ints, 1+32 bytes, 2 ints )
constant ICANON 2

global-var *termios*

import> libc.so.6 tcgetattr 2 1
import> libc.so.6 tcsetattr 3 1

: allot-termios
    termios-byte-size dallot return1
;

: clone-termios
  arg0 allot-termios termios-byte-size copy
  drop return1
;

: tty-termios
  *termios* @ null? UNLESS return1 THEN
  allot-termios dup *termios* !
  return1
;

: termios-lflag
    arg0 int32 3 cell+n return1-1
;

: termios-clear-lflag
    arg0 termios-lflag @
    arg1 lognot logand
    arg0 termios-lflag !
;

: termios-set-lflag
    arg0 termios-lflag @
    arg1 logior
    arg0 termios-lflag !
;

: tty-enter-raw-mode/1
    doc( exit icanon mode )
    tty-termios arg0 tcgetattr
    int32 0 < IF " failed to get attr" " input-dev-error" error THEN
    ICANON local0 termios-clear-lflag
    int32 0 arg0 tcsetattr
    int32 0 < IF " failed to set attr" " input-dev-error" error THEN
;

: tty-exit-raw-mode/1
    doc( enter icanon mode )
    tty-termios arg0 tcgetattr
    int32 0 < IF " failed to get attr" " input-dev-error" error THEN
    ICANON local0 termios-set-lflag
    int32 0 arg0 tcsetattr
    int32 0 < IF " failed to set attr" " input-dev-error" error THEN
;

:: tty-enter-raw-mode int32 0 tty-enter-raw-mode/1 int32 0 return1 ;
:: tty-exit-raw-mode int32 0 tty-exit-raw-mode/1 ;