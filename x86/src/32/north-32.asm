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
  push fp
  mov fp, 0
	mov eax, [esp+ptrsize*3]
	push eax ; argv
	mov eax, [esp+ptrsize*3]
	push eax ; argc
	mov eax, d_init
	call outer_eval
%ifidni LIBC,0
  call osexit_asm
%else
	pop eax ; return value
	add esp, ptrsize*2
  pop fp
%endif
	ret

outer_eval:
	jmp [eax+dict_entry_code]

%include "ops.asm"
%include "math.asm"
%include "jumps.asm"
%include "frames.asm"

%include "direct.asm"
%include "indirect.asm"
%include "indexed-32.asm"
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
