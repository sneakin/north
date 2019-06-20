section .text
global _start
bits 32

%macro syscall_macro 4
    mov     edx,%4
	    mov     ecx,%3
	    mov     ebx,%2
	    mov     eax,%1
	    int     0x80                                ;call kernel
%endmacro

%define dict 0

%macro defop 1
%1: dd $+entry_code
%1_link: dd dict
%define dict %1
%1_op:
%endmacro

%macro def 1
%1: dd dcall+entry_code
%1_link: dd dict
%define dict %1
%1_data:
%endmacro

defop next
	lodsd
	jmp [eax]

defop opcall
	pop eax
	jmp [eax]

defop ncall
	lodsd
	jmp [acall]

defop dcall
	add eax, entry_code
	jmp [acall]

defop acall
	push esi
	mov esi, eax
	jmp [next]

defop exit
	pop esi
	jmp [next]

defop dup
	mov eax, [esp]
	push eax
	jmp [next]

pointer:
string:
int32:
defop literal
	lodsd
	push eax
	jmp [next]

defop swap
	pop eax
	pop ebx
	push eax
	push ebx
	jmp [next]

defop rot
	pop eax
	pop ebx
	pop ecx
	push eax
	push ebx
	push ecx
	jmp [next]

defop syscall
	pop eax
	pop ebx
	pop ecx
	pop edx
	int 0x80
	jmp [next]

_start:
	mov eax, boot
	jmp [dcall]

defop hello
	syscall_macro 4, 1, msg, len
	jmp [next]

defop arg0
	mov eax, [esp+returnaddr]
	push eax
	jmp [next]

defop arg1
	mov eax, [esp+returnaddr+cellsize]
	push eax
	jmp [next]

defop drop
	pop eax
	jmp [next]

defop int_add
	pop ebx
	pop eax
	add eax, ebx
	push eax
	jmp [next]

section .data

ptrsize equ 4
cellsize equ 4
entry_code equ ptrsize*2
returnaddr equ 4

section .rdata

msg db 'Hello',0xA
len equ $ - msg
boo db 'BOO',0xA,0
world db 'world',0xA,0
worldlen equ $ - world

section .rdata_forth

;sysexit:  dd $+ptrsize
;	dd dict
;	%assign dict dict + 1
;	syscall_macro 1, 0, 0, 0
;	jmp [next]
def sysexit
	dd	swap,\
		int32,0,\
		int32,0,\
		rot,\
		int32,1,\
		syscall,\
		exit

def writen
	dd	rot,\
		int32,1,\
		int32,4,\
		syscall,\
		exit

def boot
	dd	hello,\
		string,world,\
		int32,worldlen,\
		writen,\
		string,boo,\
		int32,4,\
		ncall,writen_data,\
		string,world,\
		int32,worldlen,\
		literal,writen,opcall,\
		literal,3,literal,2,int_add,\
		sysexit
