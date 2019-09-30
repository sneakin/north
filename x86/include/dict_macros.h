%ifndef DICT_MACROS_ASM
%define DICT_MACROS_ASM 1
  
%if BITS==64
%define POINTER dq
%define VALUE dq
%else
%define POINTER dd
%define VALUE dd
%endif
  
dict_entry_code equ 0
dict_entry_data equ ptrsize
dict_entry_name equ ptrsize*2
dict_entry_label equ ptrsize*3
dict_entry_size equ ptrsize*4

section .text_dict

%define m_dictionary_size 1

dictionary_start:
	VALUE m_dictionary_size

%macro create 4
section .text_dict
d_%2:
%2_code: POINTER %3
%2_data: POINTER %4
%2_name: POINTER %2_name_str
%ifidni %1,%2
%2_label: POINTER %2_name_str
%else
%2_label: POINTER %2_label_str
%endif

%assign m_dictionary_size m_dictionary_size + 1
%define %2_i (d_%2-dictionary_start+ptrsize)/dict_entry_size
%define %2_off (d_%2-dictionary_start)

section .rdata
%defstr %2_name_str_str %1
%strlen %2_name_str_len %2_name_str_str
%2_name_str:
	VALUE %2_name_str_len
	db %2_name_str_str,0

%ifnidni %1,%2
%defstr %2_label_str_str %2
%strlen %2_label_str_len %2_label_str_str
%2_label_str:
	VALUE %2_label_str_len
	db %2_label_str_str,0
%endif
    
section .text

%ifidni PLATFORM,windows
%if BITS==32
global _%2
_%2:
%else
global %2
%endif
%else
global %2
%endif

%2:
%if BITS==32
  mov eax, d_%2
%else
  mov rax, d_%2
  %endif
%ifnidni %3,%2_asm
  jmp %3
%endif
%endmacro

%macro create 3
create %1, %1, %2, %3
%endmacro
    
%macro defop 2
create %1, %2, %2_asm, 0
section .text
%2_asm:
%endmacro

%macro defop 1
defop %1, %1
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

%macro defalias 3
create %1,%2,%3_code,%3_data
%endmacro
  
%macro defalias 2
create %1,%2_code,%2_data
%endmacro
  
constant dictionary,dictionary_start
constant dict_entry_length,dict_entry_size

%endif
