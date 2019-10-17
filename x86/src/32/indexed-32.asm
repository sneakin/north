bits 32
  
defop index->pointer,index_to_pointer
	mov eax, [esp+ptrsize]
  and eax, [d_index_mask+dict_entry_data]
  call [d_dict_offset_a+dict_entry_code]
  mov [esp+ptrsize], eax
	ret
  
defop literal_indexed
	mov eax, [eval_ip]
  and eax, [d_index_mask+dict_entry_data]
  call [d_dict_offset_a+dict_entry_code]
	add eval_ip, [d_index_size+dict_entry_data]
	pop ebx
	push eax
	push ebx
	ret

defop eval_index ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [d_doop_index+dict_entry_code]

defop eval_ptr_index
  pop ebx
  pop eax
  push ebx
  jmp [d_doop_ptr_index+dict_entry_code]
  
defop doop_ptr_index
  push eval_ip
  mov eval_ip, eax
  jmp [d_next_index+dict_entry_code]

defop doop_index ; the entry in eax
	push eval_ip
	mov eval_ip, [eax+dict_entry_data]
	jmp [d_next_index+dict_entry_code]

defop next_index
	mov eax, [eval_ip]
  and eax, [d_index_mask+dict_entry_data]
	add eval_ip, [d_index_size+dict_entry_data]
  call [d_dict_offset_a+dict_entry_code]
	call [eax+dict_entry_code]
	jmp [d_next_index+dict_entry_code]

%macro defi 1
create %1, doop_index_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant index_size,4
constant index_mask,0xFFFFFFFF
