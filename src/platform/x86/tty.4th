constant termios-byte-size 60 ( 4 byte align: 4 ints, 1+32 bytes, 2 ints )
constant ISIG 1
constant ICANON 2
constant ECHO 8

global-var *termios*

import> libc.so.6 tcgetattr 2 1
import> libc.so.6 tcsetattr 3 1

def allot-termios
    termios-byte-size dallot return1
end

def clone-termios
  arg0 allot-termios termios-byte-size copy
  drop return1
end

def tty-termios
  *termios* @ null? UNLESS return1 THEN
  allot-termios dup *termios* !
  return1
end

def termios-lflag
    arg0 int32 3 cell+n return1-1
end

def termios-clear-lflag
    arg0 termios-lflag @
    arg1 lognot logand
    arg0 termios-lflag !
end

def termios-set-lflag
    arg0 termios-lflag @
    arg1 logior
    arg0 termios-lflag !
end

def termios-clear-lflags/2
  doc( Clear the terminal's lflags. )
    tty-termios arg1 tcgetattr
    int32 0 < IF " failed to get attr" " input-dev-error" error THEN
    arg0 local0 termios-clear-lflag
    int32 0 arg1 tcsetattr
    int32 0 < IF " failed to set attr" " input-dev-error" error THEN
end

def termios-set-lflags/2
    doc( Set the terminal's lflags. )
    tty-termios arg1 tcgetattr
    int32 0 < IF " failed to get attr" " input-dev-error" error THEN
    arg0 local0 termios-set-lflag
    int32 0 arg1 tcsetattr
    int32 0 < IF " failed to set attr" " input-dev-error" error THEN
end

def tty-enter-raw-mode/1
  doc( exit icanon|echo mode )
  arg0 ICANON ECHO logior termios-clear-lflags/2
end

def tty-exit-raw-mode/1
  doc( enter icanon|echo mode )
  arg0 ICANON ECHO logior termios-set-lflags/2
end

redef tty-enter-raw-mode int32 0 tty-enter-raw-mode/1 int32 0 return1 end
redef tty-exit-raw-mode int32 0 tty-exit-raw-mode/1 end

def tty-exit-echo-mode/1
  doc( exit echo mode )
  arg0 ECHO termios-clear-lflags/2
end

def tty-enter-echo-mode/1
  doc( enter echo mode )
  arg0 ECHO termios-set-lflags/2
end

redef tty-enter-echo-mode int32 0 tty-enter-echo-mode/1 int32 0 return1 end
redef tty-exit-echo-mode int32 0 tty-exit-echo-mode/1 end
