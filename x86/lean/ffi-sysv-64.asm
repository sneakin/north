bits 64

defop asmcall_1
	pop rbx
	pop rax
	push rbx
	mov rdi, [rsp+ptrsize]
	jmp rax

defop fficall_0_0
	jmp [rax+dict_data]

defop fficall_1_0
	mov rdi, [rsp+ptrsize*1]
	jmp [rax+dict_data]

defop fficall_n_0
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	mov r9, [rsp+ptrsize*6]
	mov r11, rax
	mov rax, 0 ; number of vector args
	jmp [r11+dict_data]

defop fficall_0_1
	call [rax+dict_data]
	pop rbx
	push rax
	push rbx
	ret

defop fficall_1_1
	mov rdi, [rsp+ptrsize*1]
	jmp [fficall_0_1+dict_code]

defop fficall_2_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	jmp [fficall_0_1+dict_code]

defop fficall_3_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	jmp [fficall_0_1+dict_code]

defop fficall_4_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	jmp [fficall_0_1+dict_code]

defop fficall_5_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	jmp [fficall_0_1+dict_code]

defop fficall_6_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	mov r9, [rsp+ptrsize*6]
	jmp [fficall_0_1+dict_code]

defop fficall_n_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	mov r9, [rsp+ptrsize*6]
  pop r12
	mov r11, rax
	mov rax, 0 ; number of vector args
	call [r11+dict_data]
	push rax
	push r12
	ret

