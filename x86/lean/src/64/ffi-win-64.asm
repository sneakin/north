bits 64

defop fficall_rax_0_0
  ;;  windows needs 32 byte to shadow space store register values
  push r9
  push r8
  push rdx
  push rcx
	call rax
	add rsp, ptrsize*4
	ret

defop fficall_rax_1_0
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_rax_0_0+dict_code]

defop fficall_rax_2_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	jmp [fficall_rax_0_0+dict_code]

defop fficall_rax_3_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	jmp [fficall_rax_0_0+dict_code]

defop fficall_rax_4_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [fficall_rax_0_0+dict_code]

defop fficall_rax_any_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [fficall_rax_0_0+dict_code]

defop fficall_rax_n_0
  pop r13
  pop r14
  call [fficall_rax_any_0+dict_code]
  push r14
  push r13
  ret

defop fficall_rax_0_1
  ;;  windows needs 32 byte to shadow space store register values
  push r9
  push r8
  push rdx
  push rcx
	call rax
  add rsp, ptrsize*4
  pop rbx
	push rax
	push rbx
	ret

defop fficall_rax_1_1
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_rax_0_1+dict_code]

defop fficall_rax_2_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	jmp [fficall_rax_0_1+dict_code]

defop fficall_rax_3_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	jmp [fficall_rax_0_1+dict_code]

defop fficall_rax_4_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [fficall_rax_0_1+dict_code]


defop fficall_rax_n_1
	pop r13                       ; return address
  pop r14                       ; num args
	call [fficall_rax_any_0+dict_code]
	push r14
	push rax
  push r13
	ret

;;; 
;;; User facing wrappers: fficall_N_R and fficall_op_N_R
;;;
  
%define num_args 0
%rep 9

%define num_returns 0
%rep 2
  
defop fficall_%+ num_args %+ _%+ num_returns
  pop rbx
  pop rax
  push rbx
%if num_args >= 4
  jmp [fficall_rax_4_0+dict_code]
%else
  jmp [fficall_rax_%+ num_args %+_%+ num_returns +dict_code]
%endif
  
defop fficall_op_%+ num_args %+ _%+ num_returns
  mov rax, [rax+dict_data]
%if num_args >= 4
  jmp [fficall_rax_4_0+dict_code]
%else
  jmp [fficall_rax_%+ num_args %+_%+ num_returns +dict_code]
%endif

%assign num_returns num_returns + 1
%endrep
  
%assign num_args num_args + 1
%endrep

defop fficall_op_n_0
  mov rax, [rax+dict_data]
  jmp [fficall_rax_n_0+dict_code]
  
defop fficall_n_0
  pop rbx
  pop rax
  push rbx
  jmp [fficall_rax_n_0+dict_code]
  
defop fficall_op_n_1
  mov rax, [rax+dict_data]
  jmp [fficall_rax_n_1+dict_code]

defop fficall_n_1
  pop rbx
  pop rax
  push rbx
  jmp [fficall_rax_n_1+dict_code]
