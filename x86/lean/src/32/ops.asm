defop fexit
	add esp, ptrsize
	pop eval_ip
	ret

defop break
	ret

defop literal
	mov eax, dword [eval_ip]
	add eval_ip, ptrsize
	pop ebx
	push eax
	push ebx
	ret

defop int32
	mov eax, dword [eval_ip]
	add eval_ip, 4
	pop ebx
	push eax
	push ebx
	ret

defop int64
	mov eax, dword [eval_ip]
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop offset32
	mov eax, dword [eval_ip]
  add eax, eval_ip
	add eval_ip, 4
	pop ebx
	push eax
	push ebx
	ret

defop offset64
	mov eax, dword [eval_ip]
  add eax, eval_ip
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop pointer
	mov eax, dword [eval_ip]
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop peek
	mov eax, [esp+ptrsize]
	mov eax, [eax]
	mov [esp+ptrsize], eax
	ret

defop dup
	pop ebx
	mov eax, [esp]
	push eax
	push ebx
	ret

defop over
	pop ebx
	mov eax, [esp+ptrsize]
	push eax
	push ebx
	ret

defop overn
	pop ebx
	pop eax
	imul eax, ptrsize
	; add eax, ptrsize
	add eax, esp
	mov eax, [eax]
	push eax
	push ebx
	ret

defop drop
	pop ebx
	pop eax
	push ebx
	ret

defop dropn
	pop eax
	pop ebx
	imul ebx, ptrsize
	add esp, ebx
	push eax
	ret

defop swap
	mov eax, [esp+ptrsize]
	mov ebx, [esp+ptrsize*2]
	mov [esp+ptrsize*2], eax
	mov [esp+ptrsize], ebx
	ret

defop rot ; ( a b c -- c b a )
	mov eax, [esp+ptrsize*1]
	mov ebx, [esp+ptrsize*3]
	mov [esp+ptrsize*1], ebx
	mov [esp+ptrsize*3], eax
	ret

defop roll ; ( a b c -- c a b )
	mov eax, [esp+ptrsize*1]
	mov ebx, [esp+ptrsize*2]
	mov ecx, [esp+ptrsize*3]
	mov [esp+ptrsize*1], ebx
	mov [esp+ptrsize*2], ecx
	mov [esp+ptrsize*3], eax
	ret

defop ifzero
	pop ebx
	pop eax
	push ebx
	test eax, eax
	jz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnotzero
	pop ebx
	pop eax
	push ebx
	test eax, eax
	jnz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnegative
	pop ebx
	pop eax
	push ebx
	test eax, eax
	js .done
	add eval_ip, ptrsize
.done:
	ret

defop eq
	pop ecx
	pop ebx
	pop eax
	cmp eax, ebx
	je .equal
	push 0
	push ecx
	ret
.equal:
	push 1
	push ecx
	ret

defop here
	pop ebx
	push esp
	push ebx
	ret

defop stack_allot
  pop ebx
  pop eax
  sub esp, eax
  push esp
  push ebx
  ret
  
defop dict_offset_a
  imul eax, dict_entry_size
  add eax, ptrsize
	add eax, [d_dictionary+dict_data]
  ret

defop dict_entry_index
  pop ebx
  pop eax
  sub eax, ptrsize
  sub eax, [d_dictionary+dict_data]
  mov ecx, dict_entry_size
  mov edx, 0
  div ecx
  push eax
  push ebx
  ret
  
defop doconstant
	pop ebx
	mov eax, [eax+dict_data]
	push eax
	push ebx
	ret

defop dovar
	pop ebx
	mov eax, [eax+dict_data]
	mov eax, [eax]
	push eax
	push ebx
	ret
