defop not,op_not
  mov rax, [rsp+ptrsize]
  not rax
  mov [rsp+ptrsize], rax
  ret

defop bsl,op_bsl
	pop rbx
  pop rcx
	pop rax
	shl rax, cl
  push rax
	push rbx
	ret

defop bsr,op_bsr
	pop rbx
  pop rcx
	pop rax
	shr rax, cl
  push rax
	push rbx
	ret

defop logior
	pop rbx
	pop rax
	or rax, [rsp]
	mov [rsp], rax
	push rbx
	ret

defop logxor
	pop rbx
	pop rax
	xor rax, [rsp]
	mov [rsp], rax
	push rbx
	ret
