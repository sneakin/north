%macro syscall_macro 4
	push eval_ip
	mov edx,%4
	mov ecx,%3
	mov ebx,%2
	mov eax,%1
	int	0x80
	pop eval_ip
%endmacro

defop syscallop
	mov eax, [esp+ptrsize*2]
	mov ebx, [esp+ptrsize*3]
	mov ecx, [esp+ptrsize*4]
	mov edx, [esp+ptrsize*5]
	int 0x80
	ret

defop hello
	syscall_macro 4, 1, .msg, .len
	ret
.msg db "Hello",0xA,0
.len equ $ - .msg

defop osexit
  pop eax
  pop eax
  push 0
  push 0
  push eax
  push 1
	call syscallop_asm

