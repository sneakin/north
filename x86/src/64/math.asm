defop int_add
	pop rbx
	pop rax
	add rax, [rsp]
	mov [rsp], rax
	push rbx
	ret

defop int_sub
	pop rbx
	pop rcx
	pop rax
	sub rax, rcx
	push rax
	push rbx
	ret

defop int_mul
	pop rbx
	pop rax
	imul rax, [rsp]
	mov [rsp], rax
	push rbx
	ret

defop int_div
	pop rbx
	pop rcx
  pop rax
  mov rdx, 0
	div rcx
	push rax
	push rbx
	ret
