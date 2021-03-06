;; A basic call threaded interpreter. The op code is just a list of function addresses.

bits 64

section .text

global main
global outer_eval

ptrsize equ 8

%include "dict_macros.h"

%define eval_ip r12
%define fp rbp

main:
  push fp
  mov fp, 0
%ifidni PLATFORM,windows
	push rdx
	push rcx
%else
	push rsi ; argv
	push rdi ; argc
%endif
	mov rax, d_init
	call outer_eval
%ifidni LIBC,0
  call osexit_asm
%else
	pop rax ; return value
	add rsp, ptrsize*2
  pop fp
	ret
%endif

outer_eval:
	jmp [rax+dict_entry_code]

%include "ops.asm"
%include "math.asm"
%include "jumps.asm"
%include "frames.asm"
  
%include "direct.asm"
%include "indirect.asm"
%include "indexed-64.asm"
%include "offset-indirect.asm"
  
%include "cmp.asm"
%include "bits.asm"
%include "core-ops.asm"

%ifidni PLATFORM,windows
%include "windows.asm"
%else
%include "linux.asm"
%endif

%include "../ffi.asm"
%ifidni LIBC,1
%include "dynlibs.asm"
%endif
  
constant cpu_bits,BITS
constant cell_size,ptrsize
constant builtin_size,m_dictionary_size
