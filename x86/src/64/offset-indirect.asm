bits 64
  
constant indirect_offset,dictionary_start

defop offset->pointer,offset_to_pointer
  pop rbx
  pop rax
  add rax, [d_indirect_offset+dict_entry_data]
  push rax
  push rbx
  ret
  
defop indexed_offset_a
	add rax, [d_indirect_offset+dict_entry_data]
  ret

defop index
	mov rax, [eval_ip]
  add rax, [d_indirect_offset+dict_entry_data]
	add eval_ip, ptrsize
	pop rbx
	push rax
	push rbx
  ret

defop eval_offset_indirect ; the ToS
	pop rbx
	pop rax
	push rbx
	jmp [d_doop_offset_indirect+dict_entry_code]

defop eval_ptr_offset_indirect
  pop rbx
  pop rax
  push rbx
  jmp [d_doop_ptr_offset_indirect+dict_entry_code]
  
defop doop_ptr_offset_indirect
  push eval_ip
  mov eval_ip, rax
  jmp [d_next_offset_indirect+dict_entry_code]
  
defop doop_offset_indirect ; the entry in rax
	push eval_ip
	mov eval_ip, [rax+dict_entry_data]
	jmp [d_next_offset_indirect+dict_entry_code]

defop next_offset_indirect
	mov rax, [eval_ip]
  and rax, [d_offset_indirect_mask+dict_entry_data]
	add eval_ip, [d_offset_indirect_size+dict_entry_data]
  call [d_indexed_offset_a+dict_entry_code]
	call [rax+dict_entry_code]
	jmp [d_next_offset_indirect+dict_entry_code]

%macro defoi 1
create %1, doop_offset_indirect_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant offset_indirect_size,4
constant offset_indirect_mask,0xFFFFFFFF
