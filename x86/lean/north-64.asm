;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 64

section .text

global main
global outer_eval

ptrsize equ 8
index_size equ 4
dict_code equ 0
dict_data equ ptrsize
dict_name equ ptrsize*2
dict_entry_size equ ptrsize*3

%define eval_ip r12
%define fp r10

main:
	push rsi ; argv
	push rdi ; argc
	mov rax, init
	call outer_eval
	pop rax ; return value
	add rsp, ptrsize*2
	ret

outer_eval:
	jmp [eax+dict_code]

%macro syscall_macro 4
	push eval_ip
	mov     rdx,%4
	mov     rsi,%3
	mov     rdi,%2
	mov     rax,%1
	syscall
	pop eval_ip
%endmacro

section .text_dict
%define m_dictionary_size 0

dictionary_start:
	dq m_dictionary_size

%macro create 3
section .text_dict
%1:
%1_code: dq %2
%1_data: dq %3
%1_name: dq %1_name_str

%assign m_dictionary_size m_dictionary_size + 1
%define %1_i %1-dictionary_start

section .rdata
%defstr %1_name_str_str %1
%strlen %1_name_str_len %1_name_str_str
%1_name_str:
	dq %1_name_str_len
	db %1_name_str_str,0

section .text
%endmacro

%macro defop 1
create %1, %1_asm, 0
section .text
%1_asm:
%endmacro

defop call ; the ToS
	pop rbx
	pop rax
	push rbx
	jmp [eval+dict_code]

defop eval ; the pointer in rax
	push eval_ip
	mov eval_ip, [rax+dict_data]
	jmp [next+dict_code]

defop next
	mov rax, [eval_ip]
	add eval_ip, ptrsize
	call [rax+dict_code]
	jmp [next+dict_code]

defop eval_index ; the entry in rax
	push eval_ip
	mov eval_ip, [rax+dict_data]
	jmp [next_index+dict_code]

defop next_index
	mov eax, [eval_ip]
	add rax, [dictionary+dict_data]
	add eval_ip, index_size
	call [rax+dict_code]
	jmp [next_index+dict_code]

defop fexit
	add rsp, ptrsize
	pop eval_ip
	ret

defop break
	ret

defop literal
	mov rax, [eval_ip]
	add eval_ip, ptrsize
	pop rbx
	push rax
	push rbx
	ret

defop int32
	mov eax, dword [eval_ip]
	add eval_ip, 4
	pop rbx
	push rax
	push rbx
	ret

defop int64
	mov rax, [eval_ip]
	add eval_ip, 8
	pop rbx
	push rax
	push rbx
	ret

defop pointer
	mov rax, [eval_ip]
	add eval_ip, 8
	pop rbx
	push rax
	push rbx
	ret

defop asmcall_1
	pop rbx
	pop rax
	push rbx
	mov rdi, [rsp+ptrsize]
	jmp rax

defop syscallop
	mov rax, [rsp+ptrsize*1]
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	syscall
	ret

defop hello
	syscall_macro 1, 1, .msg, .len
	ret
.msg db "Hello",0xA,0
.len equ $ - .msg

defop peek
	mov rax, [rsp+ptrsize]
	mov rax, [rax]
	mov [rsp+ptrsize], rax
	ret

defop dup
	pop rbx
	mov rax, [rsp]
	push rax
	push rbx
	ret

defop over
	pop rbx
	mov rax, [rsp+ptrsize]
	push rax
	push rbx
	ret

defop overn
	pop rbx
	pop rax
	imul rax, ptrsize
	add rax, rsp
	mov rax, [rax]
	push rax
	push rbx
	ret

defop drop
	pop rbx
	pop rax
	push rbx
	ret

defop dropn
	pop rax
	pop rbx
	imul rbx, ptrsize
	add rsp, rbx
	push rax
	ret

defop swap
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*2]
	mov [rsp+ptrsize*2], rax
	mov [rsp+ptrsize], rbx
	ret

defop rot ; ( a b c -- c b a )
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*3]
	mov [rsp+ptrsize], rbx
	mov [rsp+ptrsize*3], rax
	ret

defop roll ; ( a b c -- c a b )
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*2]
	mov rcx, [rsp+ptrsize*3]
	mov [rsp+ptrsize], rbx
	mov [rsp+ptrsize*2], rcx
	mov [rsp+ptrsize*3], rax
	ret

defop apush
	pop rbx
	push rax
	push rbx
	ret

defop ifzero
	pop rbx
	pop rax
	push rbx
	test rax, rax
	jz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnotzero
	pop rbx
	pop rax
	push rbx
	test rax, rax
	jnz .done
	add eval_ip, ptrsize
.done:
	ret

defop ifpositive
	pop rbx
	pop rax
	push rbx
	cmp rax, 0
	jge .done
	add eval_ip, ptrsize
.done:
	ret

defop ifnegative
	pop rbx
	pop rax
	push rbx
	cmp rax, 0
	jl .done
	add eval_ip, ptrsize
.done:
	ret

defop int_add
	pop rbx
	pop rax
	add rax, [rsp]
	mov [rsp], rax
	push rbx
	ret

defop int_sub
	pop rbx
	pop rcx
	pop rax
	sub rax, rcx
	push rax
	push rbx
	ret

defop here
	pop rbx
	push rsp
	push rbx
	ret

defop pusha
	pop r9
	push rax
	push r9
	ret	

defop pushb
	pop r9
	push rax
	push r9
	ret

defop pushdi
	pop r9
	push rdi
	push r9
	ret

defop pushsi
	pop r9
	push rsi
	push r9
	ret

defop sysexit
	syscall_macro 60, 0, 0, 0
	ret

defop constant
	pop rbx
	mov rax, [rax+dict_data]
	push rax
	push rbx
	ret

defop constant_pointer
	pop rbx
	mov rax, [rax+dict_data]
	mov rax, [rax]
	push rax
	push rbx
	ret

defop fficall_0_0
	jmp [rax+dict_data]

defop fficall_1_0
	mov rdi, [rsp+ptrsize*1]
	jmp [rax+dict_data]

defop fficall_n_0
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	mov r9, [rsp+ptrsize*6]
	mov r11, rax
	mov rax, 0 ; number of vector args
	call [r11+dict_data]
	mov rax, r11
	ret

defop fficall_0_1
	call [rax+dict_data]
	pop rbx
	push rax
	push rbx
	ret

defop fficall_1_1
	mov rdi, [rsp+ptrsize*1]
	jmp [fficall_0_1+dict_code]

defop fficall_2_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	jmp [fficall_0_1+dict_code]

defop fficall_3_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	jmp [fficall_0_1+dict_code]

defop fficall_4_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	jmp [fficall_0_1+dict_code]

defop fficall_5_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	jmp [fficall_0_1+dict_code]

defop fficall_n_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	mov r9, [rsp+ptrsize*6]
	jmp [fficall_0_1+dict_code]

section .text_dict

%macro def 1
create %1, eval_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

%macro defi 1
create %1, eval_index_asm, %1_ops
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

create cell_size,constant_asm,ptrsize
create dictionary,constant_asm,dictionary_start
create dict_entry_length,constant_asm,dict_entry_size
create dictionary_size,constant_asm,m_dictionary_size
