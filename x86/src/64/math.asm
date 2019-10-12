;;;
;;; Signed integer math
;;; 

defop negate
  mov rax, [rsp+ptrsize]
  neg rax
  mov [rsp+ptrsize], rax
  ret
  
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
	idiv rcx
	push rax
	push rbx
	ret

defop int_mod
	pop rbx
	pop rcx
  pop rax
  mov rdx, 0
	idiv rcx
	push rdx
	push rbx
	ret

defop int_divmod
	pop rbx
	pop rcx
  pop rax
  mov rdx, 0
	idiv rcx
  push rax
	push rdx
	push rbx
	ret

;;;
;;; Unsigned
;;;

defalias uint_add,int_add
defalias uint_sub,int_sub
  
defop uint_mul
	pop rbx
  pop rcx
	pop rax
	mul rcx
  push rax
	push rbx
	ret

defop uint_div
	pop rbx
	pop rcx
  pop rax
  mov rdx, 0
	div rcx
	push rax
	push rbx
	ret

defop uint_mod
	pop rbx
	pop rcx
  pop rax
  mov rdx, 0
	div rcx
	push rdx
	push rbx
	ret

defop uint_divmod
	pop rbx
	pop rcx
  pop rax
  mov rdx, 0
	div rcx
  push rax
	push rdx
	push rbx
	ret
