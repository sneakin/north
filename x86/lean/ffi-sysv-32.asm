bits 32
  
defop fficall_op_n_0
	pop ebx ; return address
	pop ebp ; number args, not needed in 32 bit
	call [eax+dict_data]
	push ebp
	push ebx
	ret

defop fficall_op_n_1
	pop ebx ; return address
	pop ebp ; number args, not needed in 32 bit
	call [eax+dict_data]
	push ebp
	push eax ; returning this
	push ebx
	ret

defop ffiexit_1
	pop ebx
	push eax
	push ebx
	ret

%define num_args 0
%rep 8

defop fficall_%+ num_args %+_0
	pop ebx
	pop eax
	push ebx
	jmp eax

defop fficall_op_%+ num_args %+_0
	jmp [eax+dict_data]

defop fficall_eax_%+ num_args %+_1
%rep num_args
	mov ebx, [esp+ptrsize*num_args]
	push ebx
%endrep
	call eax
	add esp, ptrsize*num_args
	jmp [ffiexit_1+dict_code]

defop fficall_op_%+ num_args %+_1
	mov eax, [eax+dict_data]
	jmp [fficall_eax_%+ num_args %+_1+dict_code]

%assign num_args num_args + 1
%endrep
