section .text
global main
bits 32

ptrsize equ 4
cellsize equ 4
entry_code equ ptrsize*1
returnaddr equ 4

main:
	mov eax, boot
	jmp [dcall]

%macro syscall_macro 4
    mov     edx,%4
	    mov     ecx,%3
	    mov     ebx,%2
	    mov     eax,%1
	    int     0x80                                ;call kernel
%endmacro

%define dict 0

; todo make op code pointer a pointer load of the data field
; todo definition code pointers should be at the entry, not the data
; todo primary label should include the link.
; todo raw sequence calls and dictionary entry calls? ncall and opcall mainly
; todo finish the names by creating a dictionary entry macro shared by the defs

; Define a ststic dictionary entry. 
%macro dict_entry 3 ; name, code pointer, data pointer
; create the entry
section .data_dict
%1_link: dd dict
dd %1_name
%1: dd %2
%1_data: dd %3

; update last link
%define dict %1_link

; store the name string
section .rodata_dict_names
align 4
%defstr %1_str %1
%strlen %1_name_len %1_str
%1_name: dd %1_name_len
db %1_str,0

; back to sanity...
section .text
%endmacro

; Define an assembly implemented function.
%macro defop 1
dict_entry %1,%1_op,0
section .text
%1_op:
%endmacro

; Copy a definiyion under a new name.
%macro defalias 2
dict_entry %1,%2_op,%2_data
%endmacro

%macro def 1
dict_entry %1,dcall_op,%1_op
section .rodata_pcode
%1_op:
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
	;add eax, entry_code
	mov eax, [eax+entry_code]
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

defop literal
	lodsd
	push eax
	jmp [next]

defalias pointer,literal
defalias string,literal
defalias int32,literal

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
	push eax
	jmp [next]

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

defop zerop
	pop eax
	cmp eax, 0
	jz .zeropskip
	push 0
	jmp [next]
	.zeropskip:
	push 1
	jmp [next]

%ifdef LIBC
extern puts
defop writeln
	call puts
	jmp [next]

extern dlopen
defop libopen
	call dlopen
	push eax
	jmp [next]

extern dlsym
defop libproc
	call dlsym
	push eax
	jmp [next]

extern dlclose
defop libclose
	call dlclose
	jmp [next]

defop fficall
	pop eax
	call eax
	push eax
	jmp [next]

section .rodata
testlib db 'libc.so.6',0
testfn db 'puts',0
section .data
testlib_h dd 0
%endif

section .rodata

msg db 'Hello',0xA
len equ $ - msg
boo db 'BOO',0xA,0
world db 'world',0xA,0
worldlen equ $ - world

section .rodata_forth

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
		syscall,drop,\
		exit

def writen
	dd	rot,\
		int32,1,\
		int32,4,\
		syscall,drop,\
		exit

def boot
	dd	hello,\
		string,world,\
		int32,worldlen,\
		writen,\
		string,boo,\
		int32,4,\
		ncall,writen_op,\
		string,world,\
		int32,worldlen,\
		literal,writen,opcall
%ifdef LIBC
	dd	string,testlib,writeln
	dd	int32,1,string,testlib,libopen
	dd	string,testfn,swap,libproc
	dd	string,boo,swap,fficall
	dd	literal,1,int_add
%else
	dd	literal,3,literal,2,int_add
%endif
	dd	sysexit
