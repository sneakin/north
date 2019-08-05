%ifndef DICT_MACROS_ASM
%define DICT_MACROS_ASM 1
  
%if BITS==64
%define POINTER dq
%define VALUE dq
%else
%define POINTER dd
%define VALUE dd
%endif
  
dict_code equ 0
dict_data equ ptrsize
dict_name equ ptrsize*2
dict_entry_size equ ptrsize*3

section .text_dict

%define m_dictionary_size 1

dictionary_start:
	VALUE m_dictionary_size

%macro create 3
section .text_dict
d_%1:
%1_code: POINTER %2
%1_data: POINTER %3
%1_name: POINTER %1_name_str
%assign m_dictionary_size m_dictionary_size + 1
%define %1_i (d_%1-dictionary_start+ptrsize)/dict_entry_size

section .rdata
%defstr %1_name_str_str %1
%strlen %1_name_str_len %1_name_str_str
%1_name_str:
	VALUE %1_name_str_len
	db %1_name_str_str,0

section .text

%ifidni PLATFORM,windows
%if BITS==32
global _%1
_%1:
%else
global %1
%endif
%else
global %1
%endif

%1:
%if BITS==32
  mov eax, d_%1
%else
  mov rax, d_%1
  %endif
%ifnidni %2,%1_asm
  jmp %2
%endif
%endmacro

%macro defop 1
create %1, %1_asm, 0
section .text
%1_asm:
%endmacro

%macro def 1
create %1, dodirect_asm, %1_ops
section .rdata_forth
%1_ops:
%endmacro

%macro constant 2
create %1,doconstant_asm,%2  
%endmacro

%macro variable 2
create %1,dovar_asm,%1_value
section .data
%1_value POINTER %2

section .text
%endmacro

%macro finalize_dictionary 0
%ifndef DICTIONARY_FINALIZED
%define DICTIONARY_FINALIZED
constant dictionary_size,m_dictionary_size
%else
%fatal "Dictionary already finalized."
%endif
%endmacro

%macro defalias 2
create %1,%2_code,%2_data
%endmacro
  
constant dictionary,dictionary_start
constant dict_entry_length,dict_entry_size

%endif