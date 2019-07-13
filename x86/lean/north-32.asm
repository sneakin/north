;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 32

section .text

global main
global outer_eval

ptrsize equ 4
dict_code equ 0
dict_data equ ptrsize
dict_name equ ptrsize*2
dict_link equ ptrsize*3

%define eval_ip edi
%define fp ebp

main:
	mov eax, init
	call outer_eval
	pop eax ; return value
	ret

outer_eval:
	jmp [eval+dict_code]

%macro syscall_macro 4
	push eval_ip
	mov     edx,%4
	mov     ecx,%3
	mov     ebx,%2
	mov     eax,%1
	int	0x80
	pop eval_ip
%endmacro

%define next_dict_link 0

%macro create 3
section .text_dict
%1:
%1_code: dd %2
%1_data: dd %3
%1_name: dd %1_name_str
%1_link: dd next_dict_link
%define next_dict_link %1

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

defop eval ; the pointer in eax
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
	mov eax, [eval_ip]
	add eval_ip, ptrsize
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
	add eax, ptrsize
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

defop apush
	pop ebx
	push eax
	push ebx
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

defop int_add
	pop ebx
	pop eax
	add eax, [esp]
	mov [esp], eax
	push ebx
	ret

defop here
	pop ebx
	push esp
	push ebx
	ret

defop sysexit
	syscall_macro 1, 0, 0, 0
	ret

defop constant
	pop ebx
	mov eax, [eax+dict_data]
	push eax
	push ebx
	ret

defop fficall_0_0
	jmp [eax+dict_data]

defop fficall_1_0
	jmp [eax+dict_data]

defop fficall_n_0
	jmp [eax+dict_data]

defop ffiexit_1
	pop ebx
	push eax
	push ebx
	ret

defop fficall_0_1
	call [eax+dict_data]
	jmp [ffiexit_1+dict_code]

defop fficall_1_1
	mov ebx, [esp+ptrsize]
	push ebx
	call [eax+dict_data]
	pop ebx
	jmp [ffiexit_1+dict_code]

defop fficall_2_1
	mov ebx, [esp+ptrsize*2]
	push ebx
	mov ebx, [esp+ptrsize*2]
	push ebx
	call [eax+dict_data]
	pop ebx
	pop ebx
	jmp [ffiexit_1+dict_code]

section .text_dict

%macro def 1
create %1, eval_asm, %1_ops
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

section .rdata
global dictionary
dictionary: dd next_dict_link

section .text
