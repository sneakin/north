bits 64

defop asmcall_1_0
	pop rbx
	pop rax
	push rbx
	mov rcx, [rsp+ptrsize]
	add rsp, -ptrsize*4
	call rax
	add rsp, ptrsize*4
	ret

defop fficall_0_0
  ;;  windows needs 32 byte to shadow space store register values
  push r9
  push r8
  push rdx
  push rcx
	call [rax+dict_data]
	add rsp, ptrsize*4
	ret

defop fficall_1_0
	mov rcx, [rsp+ptrsize*1]
	jmp [fficall_0_0+dict_code]

defop fficall_n_0
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [rax+dict_data]

defop fficall_0_1
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
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
	jmp [rax+dict_data]

defop fficall_5_1
  jmp [fficall_n_1+dict_code]
  
defop fficall_6_1
  jmp [fficall_n_1+dict_code]
  
defop fficall_7_1
  jmp [fficall_n_1+dict_code]
  
defop fficall_n_1
	mov rcx, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov r8, [rsp+ptrsize*3]
	mov r9, [rsp+ptrsize*4]
  pop r11                       ; return address
	call [rax+dict_data]
	push rax
	push r11
	ret

