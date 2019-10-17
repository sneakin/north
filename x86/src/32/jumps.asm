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

defop ifpositive
	pop ebx
	pop eax
	push ebx
	cmp eax, 0
	jge .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnegative
	pop ebx
	pop eax
	push ebx
	cmp eax, 0
	jl .done
	add eval_ip, ptrsize
.done:
	ret

defop ifthenjump
	pop ebx
  pop ecx
	pop eax
	push ebx
	test eax, eax
	jz .done
	mov eval_ip, ecx
.done:
  ret

defop unlessjump
	pop ebx
  pop ecx
	pop eax
	push ebx
	test eax, eax
	jnz .done
	mov eval_ip, ecx
.done:
	ret

defop ifthenreljump
	pop ebx
  pop ecx
	pop eax
	push ebx
	test eax, eax
	jz .done
	add eval_ip, ecx
.done:
  ret

defop unlessreljump
	pop ebx
  pop ecx
	pop eax
	push ebx
	test eax, eax
	jnz .done
	add eval_ip, ecx
.done:
	ret

defop jumprel
  pop ebx
  pop eax
  add eval_ip, eax
  push ebx
  ret
