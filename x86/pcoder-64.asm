;; A basic call threaded interpreter. The op code is just a list of function addresses.

section .text
global main
bits 64

ptrsize equ 8

;; _start can call main directly.

;extern puts
;main:
;	call hello
;	call boot

%macro syscall_macro 4
    mov     rdx,%4
	    mov     rsi,%3
	    mov     rdi,%2
	    mov     rax,%1
	    syscall
%endmacro

eval: ; the pointer in eax
	push r15
	mov r15, rax
	jmp next

liteval: ; eval the pointer at the return address, used to make interpreted functions callable
	pop rbx
	push r15
	mov r15, [rbx]
next:
	add r15, ptrsize
	call [r15-ptrsize]
	jmp next

fexit:
	add rsp, ptrsize
	pop r15
	ret

opcall_0:
	pop rbx
	pop rax
	push rbx
	jmp rax

opcall_1:
	pop rbx
	pop rax
	mov rdi, [rsp]
	push rbx
	jmp rax

literal:
	mov rax, [r15]
	add r15, ptrsize
	pop rbx
	push rax
	push rbx
	ret

syscallop:
	mov rax, [rsp+ptrsize]
	mov rdi, [rsp+ptrsize*2]
	mov rsi, [rsp+ptrsize*3]
	mov rdx, [rsp+ptrsize*4]
	syscall
	ret

hello:
	syscall_macro 1, 1, msg, len
	ret

peek:
	pop rbx
	pop rax
	mov rax, [rax]
	push rax
	push rbx
	ret

dup:
	pop rbx
	mov rax, [rsp]
	push rax
	push rbx
	ret

over:
	pop rbx
	mov rax, [rsp+ptrsize]
	push rax
	push rbx
	ret

overn:
	pop rbx
	pop rax
	imul rax, ptrsize
	add rax, rsp
	mov rax, [rax]
	push rax
	push rbx
	ret

drop:
	pop rbx
	pop rax
	push rbx
	ret

dropn:
	pop rax
	pop rbx
	imul rbx, ptrsize
	add rsp, rbx
	push rax
	ret

swap:
	pop rax
	pop rbx
	pop rcx
	push rbx
	push rcx
	push rax
	ret

rot:
	mov rax, [rsp+ptrsize]
	mov rbx, [rsp+ptrsize*3]
	mov [rsp+ptrsize], rbx
	mov [rsp+ptrsize*3], rax
	ret

apush:
	pop rbx
	push rax
	push rbx
	ret

ifzero:
	test rax, rax
	jz .done
	add r15, ptrsize
.done:
	ret

ifnotzero:
	test rax, rax
	jnz .done
	add r15, ptrsize
.done:
	ret

int_add:
	pop rbx
	pop rax
	add rax, [rsp]
	mov [rsp], rax
	push rbx
	ret

here:
	pop rbx
	push rsp
	push rbx
	ret

pusha:
	pop r9
	push rax
	push r9
	ret	

pushb:
	pop r9
	push rax
	push r9
	ret

pushdi:
	pop r9
	push rdi
	push r9
	ret

pushsi:
	pop r9
	push rsi
	push r9
	ret

sysexit:
	syscall_macro 60, 0, 0, 0
	ret

constant:
	pop rbx
	mov rax, [rbp]
	push rax
	push rbx
	ret

fficall_0_0:
	pop rax
	jmp [rax]

fficall_0_1:
	pop rax
	pop rdi
	call [rax]
	push rax
	jmp next

fficall_1_1:
	pop rax
	pop rdi
	mov rdi, [rsp]
	call [rax]
	push rax
	jmp next

fficall_2_1:
	pop rax
	pop rdi
	mov rdi, [rsp]
	mov rsi, [rsp+ptrsize]
	call [rax]
	push rax
	jmp next

fficall_1_0:
	pop rax
	mov rdi, [rsp+ptrsize*1]
	jmp [rax]

fficall_n_0:
	pop rax
	mov rdi, [rsp+ptrsize*1]
	mov rsi, [rsp+ptrsize*2]
	mov rdx, [rsp+ptrsize*3]
	mov rcx, [rsp+ptrsize*4]
	mov r8, [rsp+ptrsize*5]
	mov r9, [rsp+ptrsize*6]
	jmp [rax]

section .text_dict
dictionary: call constant
dictionary_data: dq $

%macro def 1
section .text_dict
%1: call liteval
%1_data: dq %1_ops
section .rdata_forth
%1_ops:
%endmacro

%macro export 1
global %1
%endmacro

%macro defc 3
section .text_dict
extern %1
c%1: call fficall_%2_%3
c%1_data: dq %1
%endmacro

%include "test-1.popped.64"
