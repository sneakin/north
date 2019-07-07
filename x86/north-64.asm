;; A basic call threaded interpreter. The op code is just a list of function addresses.

section .text
global main
bits 64

ptrsize equ 8
dict_code equ 0
dict_data equ ptrsize
dict_name equ ptrsize*2
dict_link equ ptrsize*3

main:
	call [hello+dict_code]
	mov rax, init
	call [eval+dict_code]
	ret

%macro syscall_macro 4
	push rsi ; eval ip
	mov     rdx,%4
	mov     rsi,%3
	mov     rdi,%2
	mov     rax,%1
	syscall
	pop rsi
%endmacro

%define eip r12
%define dictionary 0

%macro create 3
section .text_dict
%1:
%1_code: dq %2
%1_data: dq %3
%1_name: dq %1_name_str
%1_link: dq dictionary
%define dictionary %1

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

defop eval ; the pointer in eax
	push eip
	mov eip, [rax+dict_data]
	jmp [next+dict_code]

defop next
	mov rax, [eip]
	add eip, ptrsize
	call [rax+dict_code]
	jmp [next+dict_code]

defop fexit
	add rsp, ptrsize
	pop eip
	ret

defop opcall_0
	pop rbx
	pop rax
	push rbx
	jmp [rax]

defop opcall_1
	pop rbx
	pop rax
	mov rdi, [rsp]
	push rbx
	jmp [rax]

defop literal
	mov rax, [eip]
	add eip, ptrsize
	pop rbx
	push rax
	push rbx
	ret

defop syscallop
	mov rax, [rsp+ptrsize*1]
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	syscall
	ret

defop hello
	syscall_macro 1, 1, msg, len
	ret

defop peek
	pop rbx
	pop rax
	mov rax, [rax]
	push rax
	push rbx
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
	pop rax
	pop rbx
	pop rcx
	push rbx
	push rcx
	push rax
	ret

defop rot
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*3]
	mov [rsp+ptrsize], rbx
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
	test rax, rax
	jz .done
	add eip, ptrsize
.done:
	push rbx
	ret

defop ifnotzero
	pop rbx
	pop rax
	test rax, rax
	jnz .done
	add eip, ptrsize
.done:
	push rbx
	ret

defop int_add
	pop rbx
	pop rax
	add rax, [rsp]
	mov [rsp], rax
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
	mov rax, [rbx]
	push rax
	push rbx
	ret

defop fficall_0_0
	jmp [rax+dict_data]

defop fficall_0_1
	call [rax+dict_data]
	pop rbx
	push rax
	push rbx
	ret

defop fficall_1_1
	mov rdi, [rsp+ptrsize*1]
	call [rax+dict_data]
	pop rbx
	push rax
	push rbx
	ret

defop fficall_2_1
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	call [rax+dict_data]
	jmp [ffiexit_1+dict_code]

defop ffiexit_1
	pop rbx
	push rax
	push rbx
	ret

defop fficall_1_0
	mov rdi, [rsp+ptrsize*1]
	call [rax+dict_data]
	ret

defop fficall_n_0
	pop r13
	mov rdi, [rsp+ptrsize*0]
	mov rsi, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov rcx, [rsp+ptrsize*3]
	mov r8, [rsp+ptrsize*4]
	mov r9, [rsp+ptrsize*5]
	call [rax+dict_data]
	push r13
	ret

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

%include "test-north.popped.64"
