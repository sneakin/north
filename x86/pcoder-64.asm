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
	mov rdi, [rsp+ptrsize*0]
	mov rsi, [rsp+ptrsize*1]
	mov rdx, [rsp+ptrsize*2]
	mov rcx, [rsp+ptrsize*3]
	mov r8, [rsp+ptrsize*4]
	mov r9, [rsp+ptrsize*5]
	add r15, ptrsize
	call [r15-ptrsize]
	jmp next

fexit:
	add rsp, ptrsize
	pop r15
	ret

opcall:
	pop rbx
	pop rax
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

%macro def 1
section .text
%1: call liteval
%1_data: dq %1_ops
section .rdata_forth
%1_ops:
%endmacro

section .rdata

testlib db 'libc.so.6',0
testfn db 'puts',0

section .data
testlib_h: dq 0

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
	syscall_macro 60, 0, 0, 0
	ret

extern printf
extern puts
extern atoi
extern exit

extern dlopen
extern dlsym

def dltest
	dq	literal,1,literal,testlib,puts,dlopen,apush
	dq	literal,testfn,swap,dlsym,apush
	dq	literal,testfn,swap,opcall
	dq	literal,5,dropn
	dq	fexit

def writeboo
	dq	literal,boo,puts,drop,fexit

def noo
	dq	literal,noostr,puts,drop,fexit

def yes
	dq	literal,yesstr,puts,drop,fexit

def test_ifzero
	dq	literal,0,drop,ifzero,yes
	dq	literal,1,drop,ifzero,noo
	dq	fexit

def test_ifnotzero
	dq	literal,0,drop,ifnotzero,noo
	dq	literal,1,drop,ifnotzero,yes
	dq	fexit

def write_stack
	dq	here,literal,.fmt,printf,drop,drop
	dq	fexit
.fmt:	db	'%x: %x %x | %x %x | %x %x %x %x %x %x',0xA,0

def main
	dq	pushdi,pushsi
	dq	hello,yes,noo
	; call ra, eval ra, argc, argv
	dq	test_ifzero,test_ifnotzero
	; print yes or no if there are any command line args or not
	; dq	literal,2,overn,literal,-1,int_add,ifzero,noo,drop,ifnotzero,yes
	; print the stack
	dq	write_stack
	; print argc, argv[0], and the ??
	; todo frame pointer for argn
	; dq	literal,4,overn,literal,4,overn,peek,literal,4,overn,literal,args,printf,literal,4,dropn
	; make some calls internally and externally
	dq	hello,literal,msg,literal,boo,puts,puts,drop,puts,drop
	; external calls with args and a return
	dq	literal,num,atoi,apush,writeboo,writeboo
	; try dlopen
	dq	dltest
	; exit with atoi's return value
	;dq	exit
	dq	swap,drop,drop
	dq	fexit
