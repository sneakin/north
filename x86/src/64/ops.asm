defop fexit
	add rsp, ptrsize
	pop eval_ip
	ret

defop break
	ret

defop literal
	mov rax, [eval_ip]
	add eval_ip, ptrsize
	pop rbx
	push rax
	push rbx
	ret

defop int32
	mov eax, dword [eval_ip]
	add eval_ip, 4
	pop rbx
	push rax
	push rbx
	ret

defop int64
	mov rax, [eval_ip]
	add eval_ip, 8
	pop rbx
	push rax
	push rbx
	ret

defop offset32
	mov eax, dword [eval_ip]
  add rax, eval_ip
	add eval_ip, 4
	pop rbx
	push rax
	push rbx
	ret

defop offset64
	mov rax, [eval_ip]
  add rax, eval_ip
	add eval_ip, 8
	pop rbx
	push rax
	push rbx
	ret
  
defop pointer
	mov rax, [eval_ip]
	add eval_ip, 8
	pop rbx
	push rax
	push rbx
	ret

defalias string,pointer
defalias uint32,int32
  
defop peek
	mov rax, [rsp+ptrsize]
	mov rax, [rax]
	mov [rsp+ptrsize], rax
	ret

defop poke
  pop rax
  pop rbx                       ; addr
  pop rcx                       ; value
	mov [rbx], rcx
  push rax
	ret

defop dup
	pop rbx
	mov rax, [rsp]
	push rax
	push rbx
	ret

defop over
	pop rbx
	mov rax, [rsp+ptrsize]
	push rax
	push rbx
	ret

defop overn
	pop rbx
	pop rax
	imul rax, ptrsize
	add rax, rsp
	mov rax, [rax]
	push rax
	push rbx
	ret

defop drop
	pop rbx
	pop rax
	push rbx
	ret

defop dropn
	pop rax
	pop rbx
	imul rbx, ptrsize
	add rsp, rbx
	push rax
	ret

defop swap
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*2]
	mov [rsp+ptrsize*2], rax
	mov [rsp+ptrsize], rbx
	ret

defop rot ; ( a b c -- c b a )
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*3]
	mov [rsp+ptrsize], rbx
	mov [rsp+ptrsize*3], rax
	ret

defop roll ; ( a b c -- c a b )
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*2]
	mov rcx, [rsp+ptrsize*3]
	mov [rsp+ptrsize], rbx
	mov [rsp+ptrsize*2], rcx
	mov [rsp+ptrsize*3], rax
	ret

defop eq
	pop rcx
	pop rbx
	pop rax
	cmp rax, rbx
	je .equal
	push 0
	push rcx
	ret
.equal:
	push 1
	push rcx
	ret

defop here
	pop rbx
	push rsp
	push rbx
	ret

defop stack_allot
  pop rbx
  pop rax
  sub rsp, rax
  push rsp
  push rbx
  ret
  
defop dict_offset_a
  imul rax, dict_entry_size
  add rax, ptrsize
	add rax, [d_dictionary+dict_entry_data]
  ret

defop dict_entry_index
  pop rbx
  pop rax
  sub rax, ptrsize
  sub rax, [d_dictionary+dict_entry_data]
  mov rcx, dict_entry_size
  mov rdx, 0
  div rcx
  push rax
  push rbx
  ret
  
defop doconstant
	pop rbx
	mov rax, [rax+dict_entry_data]
	push rax
	push rbx
	ret

defop dovar
	pop rbx
	mov rax, [rax+dict_entry_data]
	push rax
	push rbx
	ret
