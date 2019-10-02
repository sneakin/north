defop eval ; the ToS
  pop rbx
  pop rax
  push rbx
  jmp [rax+dict_entry_code]
  
defop doop ; the pointer in rax
	push eval_ip
	mov eval_ip, [rax+dict_entry_data]
	jmp [d_next+dict_entry_code]

defop next
	mov rax, [eval_ip]
	add eval_ip, ptrsize
	call [rax+dict_entry_code]
	jmp [d_next+dict_entry_code]
