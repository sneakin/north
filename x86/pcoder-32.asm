;; A basic call threaded interpreter. The op code is just a list of function addresses.

section .text
global main
bits 32

ptrsize equ 4

;; _start can call main directly.

;main:
;	call boot

%macro syscall_macro 4
    mov     edx,%4
	    mov     ecx,%3
	    mov     ebx,%2
	    mov     eax,%1
	    int     0x80                                ;call kernel
%endmacro

eval: ; the pointer in eax
	push esi
	mov esi, eax
	jmp next

liteval: ; eval the pointer at the return address, used to make interpreted functions callable
	pop ebx
	push esi
	mov esi, [ebx]
next:
	add esi, ptrsize
	call [esi-ptrsize]
	jmp next

fexit:
	add esp, ptrsize
	pop esi
	ret

fficall_0:
	pop eax
	jmp [eax]

fficall_1:
	pop eax
	pop ebx
	call [eax]
	push eax
	jmp next

opcall_0:
opcall_1:
	pop ebx
	pop eax
	push ebx
	jmp eax

literal:
	lodsd
	pop ebx
	push eax
	push ebx
	ret

syscall:
	mov eax, [esp+ptrsize]
	mov ebx, [esp+ptrsize*2]
	mov ecx, [esp+ptrsize*3]
	mov edx, [esp+ptrsize*4]
	int 0x80
	ret

hello:
	syscall_macro 4, 1, msg, len
	ret

sysexit:
	syscall_macro 1, 0, 0, 0
	ret

peek:
	pop ebx
	pop eax
	mov eax, [eax]
	push eax
	push ebx
	ret

dup:
	pop ebx
	mov eax, [esp]
	push eax
	push ebx
	ret

over:
	pop ebx
	mov eax, [esp+ptrsize]
	push eax
	push ebx
	ret

overn:
	pop ebx
	pop eax
	imul eax, ptrsize
	add eax, esp
	mov eax, [eax]
	push eax
	push ebx
	ret

drop:
	pop ebx
	pop eax
	push ebx
	ret

dropn:
	pop eax
	pop ebx
	imul ebx, ptrsize
	add esp, ebx
	push eax
	ret

swap:
	pop eax
	pop ebx
	pop ecx
	push ebx
	push ecx
	push eax
	ret

rot:
	mov eax, [esp+ptrsize]
	mov ebx, [esp+ptrsize*3]
	mov [esp+ptrsize], ebx
	mov [esp+ptrsize*3], eax
	ret

apush:
	pop ebx
	push eax
	push ebx
	ret

ifzero:
	test eax, eax
	jz .done
	add esi, ptrsize
.done:
	ret

ifnotzero:
	test eax, eax
	jnz .done
	add esi, ptrsize
.done:
	ret

int_add:
	pop ebx
	pop eax
	add eax, [esp]
	mov [esp], eax
	push ebx
	ret

here:
	pop ebx
	push esp
	push ebx
	ret

%macro def 1
section .text
%1: call liteval
%1_data: dd %1_ops
section .rdata_forth
%1_ops:
%endmacro

%macro export 1
global %1
%endmacro

%macro defc 3
section .text
extern %1
c%1: call fficall_%3
c%1_data: dd %1
%endmacro

%include "test-1.popped.32"
