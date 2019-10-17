;;;
;;; Signed integer math
;;; 

defop negate
  mov eax, [esp+ptrsize]
  neg eax
  mov [esp+ptrsize], eax
  ret
  
defop int_add
	pop ebx
	pop eax
	add eax, [esp]
	mov [esp], eax
	push ebx
	ret

defop int_sub
	pop ebx
	pop ecx
	pop eax
	sub eax, ecx
	push eax
	push ebx
	ret

defop int_mul
	pop ebx
	pop eax
	imul eax, [esp]
	mov [esp], eax
	push ebx
	ret

defop int_div
	pop ebx
	pop ecx
  pop eax
  mov edx, 0
	idiv ecx
	push eax
	push ebx
	ret

defop int_mod
	pop ebx
	pop ecx
  pop eax
  mov edx, 0
	idiv ecx
	push edx
	push ebx
	ret

defop int_divmod
	pop ebx
	pop ecx
  pop eax
  mov edx, 0
	idiv ecx
	push eax
  push edx
	push ebx
	ret

;;;
;;; Unsigned
;;;

defalias uint_add,int_add
defalias uint_sub,int_sub
  
defop uint_mul
	pop ebx
  pop ecx
	pop eax
	mul ecx
  push eax
	push ebx
	ret

defop uint_div
	pop ebx
	pop ecx
  pop eax
  mov edx, 0
	div ecx
	push eax
	push ebx
	ret

defop uint_mod
	pop ebx
	pop ecx
  pop eax
  mov edx, 0
	div ecx
	push edx
	push ebx
	ret

defop uint_divmod
	pop ebx
	pop ecx
  pop eax
  mov edx, 0
	div ecx
  push eax
	push edx
	push ebx
	ret
