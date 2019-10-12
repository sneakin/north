bits 64
  
variable indirect_offset,dictionary_start

defop set_indirect_offset
  pop rbx
  pop rax
  mov rcx, [d_indirect_offset+dict_entry_data]
  mov [rcx], rax
  push rbx
  ret
  
defop indexed_offset_a
  and rax, [d_offset_indirect_mask+dict_entry_data]
  mov rcx, [d_indirect_offset+dict_entry_data]
	add rax, [rcx]
  ret

defop offset->pointer,offset_to_pointer
	mov rax, [rsp+ptrsize]
  call [d_indexed_offset_a+dict_entry_code]
  mov [rsp+ptrsize], rax
  ret

defop off32
	mov rax, [eval_ip]
  call [d_indexed_offset_a+dict_entry_code]
	add eval_ip, [d_offset_indirect_size+dict_entry_data]
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
