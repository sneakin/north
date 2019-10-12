bits 64

defop index->pointer,index_to_pointer
	mov rax, [rsp+ptrsize]
  and rax, [d_index_mask+dict_entry_data]
  call [d_dict_offset_a+dict_entry_code]
  mov [rsp+ptrsize], rax
	ret
  
defop literal_indexed
	mov rax, [eval_ip]
  and rax, [d_index_mask+dict_entry_data]
  call [d_dict_offset_a+dict_entry_code]
	add eval_ip, [d_index_size+dict_entry_data]
	pop rbx
	push rax
	push rbx
	ret
  
defop eval_index ; the ToS
	pop rbx
	pop rax
	push rbx
	jmp [d_doop_index+dict_entry_code]

defop eval_ptr_index
  pop rbx
  pop rax
  push rbx
  jmp [d_doop_ptr_index+dict_entry_code]
  
defop doop_ptr_index
  push eval_ip
  mov eval_ip, rax
  jmp [d_next_index+dict_entry_code]
  
defop doop_index ; the entry in rax
	push eval_ip
	mov eval_ip, [rax+dict_entry_data]
	jmp [d_next_index+dict_entry_code]

defop next_index
	mov rax, [eval_ip]
  and rax, [d_index_mask+dict_entry_data]
	add eval_ip, [d_index_size+dict_entry_data]
  call [d_dict_offset_a+dict_entry_code]
	call [rax+dict_entry_code]
	jmp [d_next_index+dict_entry_code]

%macro defi 1
create %1, doop_index_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant index_size,4
constant index_mask,0xFFFFFFFF
