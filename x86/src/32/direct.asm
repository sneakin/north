defop direct_eval
  pop ebx
  pop eax
  push ebx
  jmp eax
  
defop dodirect ; the pointer in rax
	push eval_ip
	mov eval_ip, [eax+dict_entry_data]
	jmp [d_direct_next+dict_entry_code]

defop direct_next
	mov eax, [eval_ip]
	add eval_ip, ptrsize
	call eax
	jmp [d_direct_next+dict_entry_code]
