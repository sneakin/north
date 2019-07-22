;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 32

section .text

%define MAIN main

%ifdef WINDOWS
%if BITS==32
%assign MAIN _main
%endif
%endif

global MAIN
global outer_eval

ptrsize equ 4

%include "dict_macros.asm"

%define eval_ip edi
%define fp ebp

MAIN:
	mov eax, [esp+ptrsize*2]
	push eax ; argv
	mov eax, [esp+ptrsize*2]
	push eax ; argc
	mov eax, init
	call outer_eval
	pop eax ; return value
	add esp, ptrsize*2
	ret

outer_eval:
	jmp [eax+dict_code]

%macro syscall_macro 4
	push eval_ip
	mov edx,%4
	mov ecx,%3
	mov ebx,%2
	mov eax,%1
	int	0x80
	pop eval_ip
%endmacro

section .text

defop eval ; the ToS
	pop ebx
	pop eax
	push ebx
	jmp [eax+dict_code]

defop doop ; the entry in eax
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
	mov eax, dword [eval_ip]
	add eval_ip, ptrsize
	pop ebx
	push eax
	push ebx
	ret

defop int32
	mov eax, dword [eval_ip]
	add eval_ip, 4
	pop ebx
	push eax
	push ebx
	ret

defop int64
	mov eax, dword [eval_ip]
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop offset32
	mov eax, dword [eval_ip]
  add eax, eval_ip
	add eval_ip, 4
	pop ebx
	push eax
	push ebx
	ret

defop offset64
	mov eax, dword [eval_ip]
  add eax, eval_ip
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

defop pointer
	mov eax, dword [eval_ip]
	add eval_ip, 8
	pop ebx
	push eax
	push ebx
	ret

%ifdef WINDOWS
extern _printf
extern _fflush
defop hello
	mov eax, .msg
  push eax
	call _printf
  add esp, ptrsize
  mov eax, 1
	ret
.msg db "Hello",0xA,0
  ;; .len equ $ - .msg
%else
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
%endif

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
	; add eax, ptrsize
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

defop ifnegative
	pop ebx
	pop eax
	push ebx
	test eax, eax
	js .done
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

defop int_sub
	pop ebx
	pop ecx
	pop eax
	sub eax, ecx
	push eax
	push ebx
	ret

defop eq
	pop ecx
	pop ebx
	pop eax
	cmp eax, ebx
	je .equal
	push 0
	push ecx
	ret
.equal:
	push 1
	push ecx
	ret

defop here
	pop ebx
	push esp
	push ebx
	ret

%ifdef WINDOWS
extern _exit
defop sysexit
  jmp _exit
%else
defop sysexit
	syscall_macro 1, 0, 0, 0
	ret
%endif
  
defop dict_offset_a
  imul eax, dict_entry_size
  add eax, ptrsize
	add eax, [dictionary+dict_data]
  ret

defop dict_entry_index
  pop ebx
  pop eax
  sub eax, ptrsize
  sub eax, [dictionary+dict_data]
  mov ecx, dict_entry_size
  mov edx, 0
  div ecx
  push eax
  push ebx
  ret
  
defop doconstant
	pop ebx
	mov eax, [eax+dict_data]
	push eax
	push ebx
	ret

defop dovar
	pop ebx
	mov eax, [eax+dict_data]
	mov eax, [eax]
	push eax
	push ebx
	ret

section .text

%include "ffi.h"
%include "dynlibs.asm"
%include "libc.h"  

constant cpu_bits,BITS
constant cell_size,ptrsize
constant builtin_size,m_dictionary_size
