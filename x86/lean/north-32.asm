;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 32

section .text

global main
global outer_eval

ptrsize equ 4
dict_code equ 0
dict_data equ ptrsize
dict_name equ ptrsize*2
dict_entry_size equ ptrsize*3

%define eval_ip edi
%define fp ebp

main:
	mov eax, [esp+ptrsize*2]
	push eax ; argv
	mov eax, [esp+ptrsize*2]
	push eax ; argc
	mov eax, init
	call outer_eval
	pop eax ; return value
	add esp, ptrsize*2
	ret

outer_eval:
	jmp [eax+dict_code]

%macro syscall_macro 4
	push eval_ip
	mov edx,%4
	mov ecx,%3
	mov ebx,%2
	mov eax,%1
	int	0x80
	pop eval_ip
%endmacro

section .text_dict

%define m_dictionary_size 1

dictionary_start:
	dd m_dictionary_size

%macro create 3
section .text_dict
%1:
%1_code: dd %2
%1_data: dd %3
%1_name: dd %1_name_str
%assign m_dictionary_size m_dictionary_size + 1
%define %1_i (%1-dictionary_start+ptrsize)/dict_entry_size

section .rdata
%defstr %1_name_str_str %1
%strlen %1_name_str_len %1_name_str_str
%1_name_str:
	dd %1_name_str_len
	db %1_name_str_str,0

section .text
%endmacro

%macro defop 1
create %1, %1_asm, 0
section .text
%1_asm:
%endmacro

section .text

defop eval ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [eval_op+dict_code]

defop eval_op ; the entry in eax
	push eval_ip
	mov eval_ip, [eax+dict_data]
	jmp [next+dict_code]

defop next
	mov eax, [eval_ip]
	add eval_ip, ptrsize
	call [eax+dict_code]
	jmp [next+dict_code]

defop fexit
	add esp, ptrsize
	pop eval_ip
	ret

defop break
	ret

defop literal
	mov eax, dword [eval_ip]
	add eval_ip, ptrsize
	pop ebx
	push eax
	push ebx
	ret

defop int32
	mov eax, dword [eval_ip]
	add eval_ip, 4
	pop ebx
	push eax
	push ebx
	ret

defop int64
	mov eax, dword [eval_ip]
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop offset32
	mov eax, dword [eval_ip]
  add eax, eval_ip
	add eval_ip, 4
	pop ebx
	push eax
	push ebx
	ret

defop offset64
	mov eax, dword [eval_ip]
  add eax, eval_ip
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop pointer
	mov eax, dword [eval_ip]
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop asmcall_1
	pop ebx
	pop eax
	push ebx
	jmp eax

defop syscallop
	mov eax, [esp+ptrsize*2]
	mov ebx, [esp+ptrsize*3]
	mov ecx, [esp+ptrsize*4]
	mov edx, [esp+ptrsize*5]
	int 0x80
	ret

defop hello
	syscall_macro 4, 1, .msg, .len
	ret
.msg db "Hello",0xA,0
.len equ $ - .msg

defop peek
	mov eax, [esp+ptrsize]
	mov eax, [eax]
	mov [esp+ptrsize], eax
	ret

defop dup
	pop ebx
	mov eax, [esp]
	push eax
	push ebx
	ret

defop over
	pop ebx
	mov eax, [esp+ptrsize]
	push eax
	push ebx
	ret

defop overn
	pop ebx
	pop eax
	imul eax, ptrsize
	; add eax, ptrsize
	add eax, esp
	mov eax, [eax]
	push eax
	push ebx
	ret

defop drop
	pop ebx
	pop eax
	push ebx
	ret

defop dropn
	pop eax
	pop ebx
	imul ebx, ptrsize
	add esp, ebx
	push eax
	ret

defop swap
	mov eax, [esp+ptrsize]
	mov ebx, [esp+ptrsize*2]
	mov [esp+ptrsize*2], eax
	mov [esp+ptrsize], ebx
	ret

defop rot ; ( a b c -- c b a )
	mov eax, [esp+ptrsize*1]
	mov ebx, [esp+ptrsize*3]
	mov [esp+ptrsize*1], ebx
	mov [esp+ptrsize*3], eax
	ret

defop roll ; ( a b c -- c a b )
	mov eax, [esp+ptrsize*1]
	mov ebx, [esp+ptrsize*2]
	mov ecx, [esp+ptrsize*3]
	mov [esp+ptrsize*1], ebx
	mov [esp+ptrsize*2], ecx
	mov [esp+ptrsize*3], eax
	ret

defop ifzero
	pop ebx
	pop eax
	push ebx
	test eax, eax
	jz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnotzero
	pop ebx
	pop eax
	push ebx
	test eax, eax
	jnz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnegative
	pop ebx
	pop eax
	push ebx
	test eax, eax
	js .done
	add eval_ip, ptrsize
.done:
	ret

defop int_add
	pop ebx
	pop eax
	add eax, [esp]
	mov [esp], eax
	push ebx
	ret

defop int_sub
	pop ebx
	pop ecx
	pop eax
	sub eax, ecx
	push eax
	push ebx
	ret

defop eq
	pop ecx
	pop ebx
	pop eax
	cmp eax, ebx
	je .equal
	push 0
	push ecx
	ret
.equal:
	push 1
	push ecx
	ret

defop here
	pop ebx
	push esp
	push ebx
	ret

defop sysexit
	syscall_macro 1, 0, 0, 0
	ret

defop dict_offset_a
  imul eax, dict_entry_size
  add eax, ptrsize
	add eax, [dictionary+dict_data]
  ret

defop dict_entry_index
  pop ebx
  pop eax
  sub eax, ptrsize
  sub eax, [dictionary+dict_data]
  mov ecx, dict_entry_size
  mov edx, 0
  div ecx
  push eax
  push ebx
  ret
  
defop doconstant
	pop ebx
	mov eax, [eax+dict_data]
	push eax
	push ebx
	ret

defop dovar
	pop ebx
	mov eax, [eax+dict_data]
	mov eax, [eax]
	push eax
	push ebx
	ret

defop fficall_n_0
	jmp [eax+dict_data]

defop ffiexit_1
	pop ebx
	push eax
	push ebx
	ret

%define num_args 0
%rep 8

defop fficall_%+ num_args %+_0
	jmp [eax+dict_data]

defop fficall_%+ num_args %+_1
%rep num_args
	mov ebx, [esp+ptrsize*num_args]
	push ebx
%endrep
	call [eax+dict_data]
	add esp, ptrsize*num_args
	jmp [ffiexit_1+dict_code]

%assign num_args num_args + 1
%endrep

section .text_dict

%macro def 1
create %1, eval_op_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

%macro export 1
global %1
%endmacro

%macro defc 3
extern %1
create c%1, fficall_%2_%3_asm, %1
%endmacro

section .text

defc puts,1,0
defc printf,n,0
defc gets,1,1

%include "dynlibs.asm"

%macro constant 2
create %1,doconstant_asm,%2  
%endmacro

%macro variable 2
create %1,dovar_asm,%1_value
section .data
%1_value dd %2

section .text
%endmacro

constant cpu_bits,BITS
constant cell_size,ptrsize
constant dictionary,dictionary_start
constant dict_entry_length,dict_entry_size
constant builtin_size,m_dictionary_size

%macro finalize_dictionary 0
constant dictionary_size,m_dictionary_size
%endmacro
