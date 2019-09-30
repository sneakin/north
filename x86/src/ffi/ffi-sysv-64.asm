;; _op loads rax+dict_entry_data ino r11
;; _r11 calls or jmps to the function in r11
;; no suffix loads ToS into r11

bits 64

copy_args_1:
	mov rdi, [rsp+ptrsize*2]
	ret

copy_args_2:
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	ret

copy_args_3:
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	ret

copy_args_4:
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	mov rcx, [rsp+ptrsize*5]
	ret

copy_args_5:
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	mov rcx, [rsp+ptrsize*5]
	mov r8, [rsp+ptrsize*6]
	ret

copy_args_6:
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	mov rcx, [rsp+ptrsize*5]
	mov r8, [rsp+ptrsize*6]
	mov r9, [rsp+ptrsize*7]
	ret

defop doffi_sysv_64_r11_1
	call r11
	pop rbx
	push rax
	push rbx
	ret

%define num_args 0
%rep 7

%define op0 d_ffi_sysv_64_r11_%+ num_args %+ _0
%define op1 d_ffi_sysv_64_r11_%+ num_args %+ _1

defop ffi_sysv_64_r11_%+ num_args %+ _0
%if num_args > 0
	call copy_args_%+ num_args
%endif
	jmp r11

defop ffi_sysv_64_%+ num_args %+ _0
	pop rbx
	pop r11
	push rbx
	jmp [op0+dict_entry_code]

defop ffi_sysv_64_op_%+ num_args %+ _0
	mov r11, [rax+dict_entry_data]
	jmp [op0+dict_entry_code]

defop ffi_sysv_64_r11_%+ num_args %+ _1
%if num_args > 0
	call copy_args_%+ num_args
%endif
	jmp [d_doffi_sysv_64_r11_1+dict_entry_code]

defop ffi_sysv_64_%+ num_args %+ _1
	pop rbx
	pop r11
	push rbx
	jmp [op1+dict_entry_code]

defop ffi_sysv_64_op_%+ num_args %+ _1
	mov r11, [rax+dict_entry_data]
	jmp [op1+dict_entry_code]

%assign num_args num_args + 1
%endrep
%undef num_args

ffi_sysv_64_r11_table:
	dq 0
	dq copy_args_1
	dq copy_args_2
	dq copy_args_3
	dq copy_args_4
	dq copy_args_5
	dq copy_args_6

%define counter 0
%rep 2

defop ffi_sysv_64_r11_7_%+ counter ; needs testing
  call copy_args_6
  mov rbx, [rsp+ptrsize*7]
	call r11
%if counter != 0
	push rax
%endif
	ret

defop ffi_sysv_64_7_%+ counter
	pop rbx
	pop r11
	push rbx
	jmp [d_ffi_sysv_64_r11_7_%+ counter +dict_entry_code]

defop ffi_sysv_64_op_7_%+ counter
	mov r11, [rax+dict_entry_data]
	jmp [d_ffi_sysv_64_r11_7_%+ counter +dict_entry_code]

defop ffi_sysv_64_r11_n_%+ counter
	mov r15, rsp
	mov rax, [rsp+ptrsize*1] ; num args
	cmp rax, 6
	jle .predispatch
	;; more than 6 arguments
	pop r14
	call copy_args_6
	push r14
	;; copy rest args to stack
	;; start with the highest argument on stack
	mov rax, [rsp+ptrsize*1]
	mov r14, rax
	add r14, 1
	imul r14, ptrsize
	add r14, rsp
.copyloop:
	cmp rax, 6
	je .exec
	mov r13, [r14]
	push r13
	sub rax, 1
	sub r14, ptrsize
	jmp .copyloop
.predispatch:
  cmp rax, 0
  je .exec
.dispatch:
	pop r13 ; return address
	call [ffi_sysv_64_r11_table + rax * ptrsize]
	push r13
	jmp .exec
.exec:
	mov rax, 0 ; number of vector args
	call r11
	mov rsp, r15
%if counter != 0
	push rax
%endif
	ret

defop ffi_sysv_64_n_%+ counter
  pop rbx
  pop r11
  push rbx
	jmp [d_ffi_sysv_64_r11_n_%+ counter +dict_entry_code]

defop ffi_sysv_64_op_n_%+ counter
	mov r11, [rax+dict_entry_data]
	jmp [d_ffi_sysv_64_r11_n_%+ counter +dict_entry_code]

%assign counter counter + 1
%endrep
