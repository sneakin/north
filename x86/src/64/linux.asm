%macro syscall_macro 4
	push eval_ip
	mov     rdx,%4
	mov     rsi,%3
	mov     rdi,%2
	mov     rax,%1
	syscall
	pop eval_ip
%endmacro

defop syscallop
	mov rax, [rsp+ptrsize*1]
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	syscall
	ret

defop hello
	syscall_macro 1, 1, .msg, .len
	ret
.msg db "Hello",0xA,0
.len equ $ - .msg

defop osexit
	syscall_macro 60, 0, 0, 0
	ret
