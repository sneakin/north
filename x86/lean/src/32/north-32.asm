;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 32

section .text

global main
global outer_eval

ptrsize equ 4

%include "dict_macros.h"

%define eval_ip edi
%define fp ebp

%ifidni PLATFORM,windows
%if BITS==32
global _main
_main:
%endif
%endif
  
main:
	mov eax, [esp+ptrsize*2]
	push eax ; argv
	mov eax, [esp+ptrsize*2]
	push eax ; argc
	mov eax, d_init
	call outer_eval
	pop eax ; return value
	add esp, ptrsize*2
	ret

outer_eval:
	jmp [eax+dict_code]

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
