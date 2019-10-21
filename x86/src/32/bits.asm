defop not,op_not
  mov eax, [esp+ptrsize]
  cmp eax, 0
  jz .false
  mov dword [esp+ptrsize], 0
  ret
  .false:
  mov dword [esp+ptrsize], 1
  ret

defop lognot
  mov eax, [esp+ptrsize]
  not eax
  mov [esp+ptrsize], eax
	ret

defop bsl,op_bsl
	pop ebx
  pop ecx
	pop eax
	shl eax, cl
  push eax
	push ebx
	ret

defop bsr,op_bsr
	pop ebx
  pop ecx
	pop eax
	shr eax, cl
  push eax
	push ebx
	ret

defop bslc
	pop ebx
  pop ecx
	pop eax
	rol eax, cl
  push eax
	push ebx
	ret
  ret

defop bsrc
	pop ebx
  pop ecx
	pop eax
	rol eax, cl
  push eax
	push ebx
	ret

defop logior
	pop ebx
	pop eax
	or eax, [esp]
	mov [esp], eax
	push ebx
	ret

defop logxor
	pop ebx
	pop eax
	xor eax, [esp]
	mov [esp], eax
	push ebx
	ret

defop logand
	pop ebx
	pop eax
	and eax, [esp]
	mov [esp], eax
	push ebx
	ret

