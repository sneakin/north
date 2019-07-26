bits 32

defop ffi_sysv_32_op_n_0
	pop ebx ; return address
	pop ebp ; number args, not needed in 32 bit
	call [eax+dict_data]
	push ebp
	push ebx
	ret

defop ffi_sysv_32_n_0
  pop ebx
  pop eax
  push ebx
  jmp [ffi_sysv_32_op_n_0+dict_code]
  
defop ffi_sysv_32_op_n_1
	pop ebx ; return address
	pop ebp ; number args, not needed in 32 bit
	call [eax+dict_data]
	push ebp
	push eax ; returning this
	push ebx
	ret

defop ffi_sysv_32_n_1           ; could be buggy by dropping fn
  pop ebx
  pop eax
  push ebx
  jmp [ffi_sysv_32_op_n_1+dict_code]
  
defop ffiexit_1
	pop ebx
	push eax
	push ebx
	ret

%define num_args 0
%rep 8

defop ffi_sysv_32_%+ num_args %+_0
	pop ebx
	pop eax
	push ebx
	jmp eax

defop ffi_sysv_32_%+ num_args %+_1 ; could be buggy
  pop ebx
  pop eax
  push ebx
  jmp ffi_sysv_32_op_%+ num_args %+_1

defop ffi_sysv_32_op_%+ num_args %+_0
	jmp [eax+dict_data]

defop ffi_sysv_32_eax_%+ num_args %+_1
%rep num_args
	mov ebx, [esp+ptrsize*num_args]
	push ebx
%endrep
	call eax
	add esp, ptrsize*num_args
	jmp [d_ffiexit_1+dict_code]

defop ffi_sysv_32_op_%+ num_args %+_1
	mov eax, [eax+dict_data]
	jmp [d_ffi_sysv_32_eax_%+ num_args %+_1+dict_code]

%assign num_args num_args + 1
%endrep
