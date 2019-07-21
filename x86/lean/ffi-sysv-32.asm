bits 32
  
defop asmcall_1_0
	pop ebx
	pop eax
	push ebx
	jmp eax

defop fficall_n_0
	jmp [eax+dict_data]

defop ffiexit_1
	pop ebx
	push eax
	push ebx
	ret

%define num_args 0
%rep 8

defop fficall_%+ num_args %+_0
	jmp [eax+dict_data]

defop fficall_%+ num_args %+_1
%rep num_args
	mov ebx, [esp+ptrsize*num_args]
	push ebx
%endrep
	call [eax+dict_data]
	add esp, ptrsize*num_args
	jmp [ffiexit_1+dict_code]

%assign num_args num_args + 1
%endrep

