defop eval ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [eax+dict_entry_code]

defop doop ; the entry in eax
	push eval_ip
	mov eval_ip, [eax+dict_entry_data]
	jmp [d_next+dict_entry_code]

defop next
	mov eax, [eval_ip]
	add eval_ip, ptrsize
	call [eax+dict_entry_code]
	jmp [d_next+dict_entry_code]
