bits 64
  
defop eval_index ; the ToS
	pop rbx
	pop rax
	push rbx
	jmp [d_doop_index+dict_code]

defop eval_ptr_index
  pop rbx
  pop rax
  push rbx
  jmp [d_doop_ptr_index+dict_code]
  
defop doop_ptr_index
  push eval_ip
  mov eval_ip, rax
  jmp [d_next_index+dict_code]
  
defop doop_index ; the entry in rax
	push eval_ip
	mov eval_ip, [rax+dict_data]
	jmp [d_next_index+dict_code]

defop next_index
	mov rax, [eval_ip]
  and rax, [d_index_mask+dict_data]
	add eval_ip, [d_index_size+dict_data]
  call [d_dict_offset_a+dict_code]
	call [rax+dict_code]
	jmp [d_next_index+dict_code]

%macro defi 1
create %1, doop_index_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant index_size,4
constant index_mask,0xFFFFFFFF
