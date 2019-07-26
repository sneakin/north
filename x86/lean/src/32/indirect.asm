defop eval ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [eax+dict_code]

defop doop ; the entry in eax
	push eval_ip
	mov eval_ip, [eax+dict_data]
	jmp [d_next+dict_code]

defop next
	mov eax, [eval_ip]
	add eval_ip, ptrsize
	call [eax+dict_code]
	jmp [d_next+dict_code]
