bits 32
  
defop eval_index ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [eval_op_index+dict_code]

defop eval_ptr_index
  pop ebx
  pop eax
  push ebx
  jmp [eval_op_ptr_index+dict_code]
  
defop eval_op_ptr_index
  push eval_ip
  mov eval_ip, eax
  jmp [next_index+dict_code]

defop eval_op_index ; the entry in eax
	push eval_ip
	mov eval_ip, [eax+dict_data]
	jmp [next_index+dict_code]

defop next_index
	mov eax, [eval_ip]
	add eval_ip, [index_size+dict_data]
  call [dict_offset_a+dict_code]
	call [eax+dict_code]
	jmp [next_index+dict_code]

%macro defi 1
create %1, eval_op_index_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant index_size,4
