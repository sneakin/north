defop direct_eval
  pop rbx
  pop rax
  push rbx
  jmp rax
  
defop dodirect ; the pointer in rax
	push eval_ip
	mov eval_ip, [rax+dict_entry_data]
	jmp [d_direct_next+dict_entry_code]

defop direct_next
	mov rax, [eval_ip]
	add eval_ip, ptrsize
	call rax
	jmp [d_direct_next+dict_entry_code]
