bits 64

defop fficall_1_0
	pop rbx
	pop rax
	push rbx
	mov rcx, [rsp+ptrsize]
	add rsp, -ptrsize*4
	call rax
	add rsp, ptrsize*4
	ret

defop fficall_op_0_0
  ;;  windows needs 32 byte to shadow space store register values
  push r9
  push r8
  push rdx
  push rcx
	call [rax+dict_data]
	add rsp, ptrsize*4
	ret

defop fficall_op_1_0
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_op_0_0+dict_code]

defop fficall_op_n_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [rax+dict_data]

defop fficall_op_0_1
  ;;  windows needs 32 byte to shadow space store register values
  push r9
  push r8
  push rdx
  push rcx
	call [rax+dict_data]
  add rsp, ptrsize*4
  pop rbx
	push rax
	push rbx
	ret

defop fficall_op_1_1
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_op_0_1+dict_code]

defop fficall_op_2_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	jmp [fficall_op_0_1+dict_code]

defop fficall_op_3_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	jmp [fficall_op_0_1+dict_code]

defop fficall_op_4_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [rax+dict_data]

defop fficall_op_5_1
  jmp [fficall_op_n_1+dict_code]
  
defop fficall_op_6_1
  jmp [fficall_op_n_1+dict_code]
  
defop fficall_op_7_1
  jmp [fficall_op_n_1+dict_code]
  
defop fficall_op_n_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	pop r11                       ; return address
	call [rax+dict_data]
	push rax
	push r11
	ret

