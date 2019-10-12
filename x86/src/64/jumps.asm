defop ifzero
	pop rbx
	pop rax
	push rbx
	test rax, rax
	jz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnotzero
	pop rbx
	pop rax
	push rbx
	test rax, rax
	jnz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifpositive
	pop rbx
	pop rax
	push rbx
	cmp rax, 0
	jge .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnegative
	pop rbx
	pop rax
	push rbx
	cmp rax, 0
	jl .done
	add eval_ip, ptrsize
.done:
	ret

defop ifthenjump
	pop rbx
  pop rcx
	pop rax
	push rbx
	test rax, rax
	jz .done
	mov eval_ip, rcx
.done:
  ret

defop unlessjump
	pop rbx
  pop rcx
	pop rax
	push rbx
	test rax, rax
	jnz .done
	mov eval_ip, rcx
.done:
	ret

defop ifthenreljump
	pop rbx
  pop rcx
	pop rax
	push rbx
	test rax, rax
	jz .done
	add eval_ip, rcx
.done:
  ret

defop unlessreljump
	pop rbx
  pop rcx
	pop rax
	push rbx
	test rax, rax
	jnz .done
	add eval_ip, rcx
.done:
	ret

defop jumprel
  pop rbx
  pop rax
  add eval_ip, rax
  push rbx
  ret
