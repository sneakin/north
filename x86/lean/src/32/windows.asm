;;;  todo more of the libc implementation than windows
  
extern _printf
extern _fflush
  
defop hello
	mov eax, .msg
  push eax
	call _printf
  add esp, ptrsize
  mov eax, 1
	ret
.msg db "Hello",0xA,0
  ;; .len equ $ - .msg

extern _exit

defop osexit
  jmp _exit
