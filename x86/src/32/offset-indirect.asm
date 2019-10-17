bits 32
  
variable indirect_offset,dictionary_start
  
defop set_indirect_offset
  pop ebx
  pop eax
  mov ecx, [d_indirect_offset+dict_entry_data]
  mov [ecx], eax
  push ebx
  ret
  
defop indexed_offset_a
  and eax, [d_offset_indirect_mask+dict_entry_data]
  mov ecx, [d_indirect_offset+dict_entry_data]
	add eax, [ecx]
  ret

defop offset->pointer,offset_to_pointer
	mov eax, [esp+ptrsize]
  call [d_indexed_offset_a+dict_entry_code]
  mov [esp+ptrsize], eax
  ret

defop off32
	mov eax, [eval_ip]
  call [d_indexed_offset_a+dict_entry_code]
	add eval_ip, [d_offset_indirect_size+dict_entry_data]
	pop ebx
	push eax
	push ebx
  ret

defop eval_offset_indirect ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [d_doop_offset_indirect+dict_entry_code]

defop eval_ptr_offset_indirect
  pop ebx
  pop eax
  push ebx
  jmp [d_doop_ptr_offset_indirect+dict_entry_code]
  
defop doop_ptr_offset_indirect
  push eval_ip
  mov eval_ip, eax
  jmp [d_next_offset_indirect+dict_entry_code]

defop doop_offset_indirect ; the entry in eax
	push eval_ip
	mov eval_ip, [eax+dict_entry_data]
	jmp [d_next_offset_indirect+dict_entry_code]

defop next_offset_indirect
	mov eax, [eval_ip]
	add eval_ip, [d_offset_indirect_size+dict_entry_data]
  call [d_indexed_offset_a+dict_entry_code]
	call [eax+dict_entry_code]
	jmp [d_next_offset_indirect+dict_entry_code]

%macro defoi 1
create %1, doop_offset_indirect_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant offset_indirect_size,4
constant offset_indirect_mask,0xFFFFFFFF
