bits 64

defop fficall_0_0
	add rsp, -32
	call [rax+dict_data]
	add rsp, 32
	ret

defop fficall_1_0
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_0_0+dict_code]

;; todo need to allocate a shadow space for varargs

defop fficall_n_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	mov r11, rax
	mov rax, 0 ; number of vector args
	jmp [r11+dict_data]

defop fficall_0_1
	add rsp, -32
	call [rax+dict_data]
	add rsp, 32
	pop rbx
	push rax
	push rbx
	ret

defop fficall_1_1
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_0_1+dict_code]

defop fficall_2_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	jmp [fficall_0_1+dict_code]

defop fficall_3_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	jmp [fficall_0_1+dict_code]

defop fficall_4_1
	mov rcx, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [fficall_0_1+dict_code]

defop fficall_6_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [fficall_0_1+dict_code]

defop fficall_n_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	mov r11, rax
	mov rax, 0 ; number of vector args
	call [r11+dict_data]
	pop rbx
	push rax
	push rbx
	ret

