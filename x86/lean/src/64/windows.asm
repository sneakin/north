extern printf
  
defop hello
	mov rcx, .msg
	add rsp, -32
	call printf
	add rsp, 32
	ret
.msg db "Hello",0xA,0
.len equ $ - .msg

extern _exit

defop sysexit
  jmp _exit
