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
	div ecx
	push eax
	push ebx
	ret
