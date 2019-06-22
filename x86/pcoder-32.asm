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

opcall:
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

section .rodata

testlib db 'libc.so.6',0
testfn db 'puts',0

section .data
testlib_h: dd 0

section .data
msg db 'Hello',0
len equ $ - msg
boo db 'BOO',0
world db 'world',0
worldlen equ $ - world
num db '12',0
args db '%i %s %x',0xA,0
yesstr db 'YES',0
noostr db 'NOO',0

section .text

sysexit:
	syscall_macro 1, 0, 0, 0
	ret

extern printf
extern puts
extern atoi
extern exit

extern dlopen
extern dlsym

def dltest
	dd	literal,1,literal,testlib,puts,dlopen,apush
	dd	literal,testfn,swap,dlsym,apush
	dd	literal,testfn,swap,opcall
	dd	literal,5,dropn
	dd	fexit

def writeboo
	dd	literal,boo,puts,drop,fexit

def noo
	dd	literal,noostr,puts,drop,fexit

def yes
	dd	literal,yesstr,puts,drop,fexit

def test_ifzero
	dd	literal,0,drop,ifzero,yes
	dd	literal,1,drop,ifzero,noo
	dd	fexit

def test_ifnotzero
	dd	literal,0,drop,ifnotzero,noo
	dd	literal,1,drop,ifnotzero,yes
	dd	fexit

def write_stack
	dd	here,literal,.fmt,printf,drop,drop
	dd	fexit
.fmt:	db	'%x: %x %x | %x %x | %x %x %x %x %x %x',0xA,0

def main
	; call ra, eval ra, argc, argv
	dd	test_ifzero,test_ifnotzero
	; print yes or no if there are any command line args or not
	dd	literal,2,overn,literal,-1,int_add,ifzero,noo,drop,ifnotzero,yes
	; print the stack
	dd	write_stack
	; print argc, argv[0], and the ??
	; todo frame pointer for argn
	dd	literal,4,overn,literal,4,overn,peek,literal,4,overn,literal,args,printf,literal,4,dropn
	; make some calls internally and externally
	dd	hello,literal,msg,literal,boo,puts,puts,drop,puts,drop
	; external calls with args and a return
	dd	literal,num,atoi,apush,writeboo,writeboo
	; try dlopen
	dd	dltest
	; exit with atoi's return value
	;dd	exit
	dd	swap,drop,drop
	dd	fexit
