bits 64
  
constant indirect_offset,dictionary_start
  
defop indexed_offset_a
	add rax, [d_indirect_offset+dict_data]
  ret

defop eval_offset_indirect ; the ToS
	pop rbx
	pop rax
	push rbx
	jmp [d_doop_offset_indirect+dict_code]

defop eval_ptr_offset_indirect
  pop rbx
  pop rax
  push rbx
  jmp [d_doop_ptr_offset_indirect+dict_code]
  
defop doop_ptr_offset_indirect
  push eval_ip
  mov eval_ip, rax
  jmp [d_next_offset_indirect+dict_code]
  
defop doop_offset_indirect ; the entry in rax
	push eval_ip
	mov eval_ip, [rax+dict_data]
	jmp [d_next_offset_indirect+dict_code]

defop next_offset_indirect
	mov rax, [eval_ip]
  and rax, [d_offset_indirect_mask+dict_data]
	add eval_ip, [d_offset_indirect_size+dict_data]
  call [d_indexed_offset_a+dict_code]
	call [rax+dict_code]
	jmp [d_next_offset_indirect+dict_code]

%macro defoi 1
create %1, doop_offset_indirect_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

constant offset_indirect_size,4
constant offset_indirect_mask,0xFFFFFFFF
