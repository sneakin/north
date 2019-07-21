;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 64

section .text

global main
global outer_eval

ptrsize equ 8

%include "dict_macros.asm"

%define eval_ip r12
%define fp r10

main:
%ifdef WINDOWS
	push rdx
	push rcx
%else
	push rsi ; argv
	push rdi ; argc
%endif
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

defop eval ; the ToS
  pop rbx
  pop rax
  push rbx
  jmp [rax+dict_code]
  
defop doop ; the pointer in rax
	push eval_ip
	mov eval_ip, [rax+dict_data]
	jmp [next+dict_code]

defop next
	mov rax, [eval_ip]
	add eval_ip, ptrsize
	call [rax+dict_code]
	jmp [next+dict_code]

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

defop offset32
	mov eax, dword [eval_ip]
  add rax, eval_ip
	add eval_ip, 4
	pop rbx
	push rax
	push rbx
	ret

defop offset64
	mov rax, [eval_ip]
  add rax, eval_ip
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

%ifdef WINDOWS
defop hello
	mov rcx, .msg
	add rsp, -32
	call printf
	add rsp, 32
	ret
.msg db "Hello",0xA,0
.len equ $ - .msg
%else
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
%endif

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

defop eq
	pop rcx
	pop rbx
	pop rax
	cmp rax, rbx
	je .equal
	push 0
	push rcx
	ret
.equal:
	push 1
	push rcx
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

defop sysexit
	syscall_macro 60, 0, 0, 0
	ret

defop dict_offset_a
  imul rax, dict_entry_size
  add rax, ptrsize
	add rax, [dictionary+dict_data]
  ret

defop dict_entry_index
  pop rbx
  pop rax
  sub rax, ptrsize
  sub rax, [dictionary+dict_data]
  mov rcx, dict_entry_size
  mov rdx, 0
  div rcx
  push rax
  push rbx
  ret
  
defop doconstant
	pop rbx
	mov rax, [rax+dict_data]
	push rax
	push rbx
	ret

defop dovar
	pop rbx
	mov rax, [rax+dict_data]
	mov rax, [rax]
	push rax
	push rbx
	ret

section .text

%include "ffi.h"
%include "dynlibs.asm"
%include "libc.h"  

constant cpu_bits,BITS
constant cell_size,ptrsize
constant builtin_size,m_dictionary_size
