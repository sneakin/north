;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 64

section .text

global main
global outer_eval

ptrsize equ 8

%include "dict_macros.h"

%define eval_ip r12
%define fp r10

main:
%ifidni PLATFORM,windows
	push rdx
	push rcx
%else
	push rsi ; argv
	push rdi ; argc
%endif
	mov rax, d_init
	call outer_eval
	pop rax ; return value
	add rsp, ptrsize*2
	ret

outer_eval:
	jmp [rax+dict_code]

%include "ops.asm"
%include "direct.asm"
%include "indirect.asm"

%ifidni PLATFORM,windows
%include "windows.asm"
%else
%include "linux.asm"
%endif

%include "../ffi.asm"
%include "dynlibs.asm"
%include "../libc.asm"

constant cpu_bits,BITS
constant cell_size,ptrsize
constant builtin_size,m_dictionary_size
