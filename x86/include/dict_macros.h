%ifndef DICT_MACROS_ASM
%define DICT_MACROS_ASM 1
  
%if BITS==64
%define POINTER dq
%define VALUE dq
%else
%define POINTER dd
%define VALUE dd
%endif
  
dict_entry_name equ 0
dict_entry_code equ ptrsize
dict_entry_data equ ptrsize*2
dict_entry_label equ ptrsize*3
dict_entry_size equ ptrsize*4

section .text_dict

%define m_dictionary_size 1

dictionary_start:
	VALUE m_dictionary_size

%macro create 4
;;; Creates a dictionary entry in the dictionary segment / array.
;;; %1 name
;;; %2 label, direct call trampoline's label
;;; %3 code field
;;; %4 data field

;;; In the
section .text_dict
;;; there's an entry
d_%2:
%2_name: POINTER %2_name_str
%2_code: POINTER %3
%2_data: POINTER %4
%ifidni %1,%2
%2_label: POINTER %2_name_str
%else
%2_label: POINTER %2_label_str
%endif

;;; Value constants
%define v_%2_code %3
%define v_%2_data %4

;;; Increase size
%assign m_dictionary_size m_dictionary_size + 1

;;; An index into the array: i*size
%define %2_i (d_%2-dictionary_start+ptrsize)/dict_entry_size
;;; Offset into array
%define %2_off (d_%2-dictionary_start)

;;; Name string gets stored in the rdata segment.
section .rdata
%ifstr %1
%define %2_name_str_str %1
%else
%defstr %2_name_str_str %1
%endif
%strlen %2_name_str_len %2_name_str_str
%2_name_str:
	VALUE %2_name_str_len
	db %2_name_str_str,0

;;; As does the label if it's not the name.
%ifnidni %1,%2
%defstr %2_label_str_str %2
%strlen %2_label_str_len %2_label_str_str
%2_label_str:
	VALUE %2_label_str_len
	db %2_label_str_str,0
%endif

;;; A trampoline for direct threading.
section .text

;;; Declared as global and exported for 32 and 64 bits.
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
;; move the word into rax like next does
%if BITS==32
  mov eax, d_%2
%else
  mov rax, d_%2
  %endif
%ifnidni %3,%2_asm ; only jump to known code
  jmp %3 ; to the code word
%endif

%endmacro ; create 4

;;; Names and labels are usually the same.
%macro create 3
create %1, %1, %2, %3
%endmacro ; create 3

;;; Creates an entry and opens the body of an assembly word.
%macro defop 2
create %1, %2, %2_asm, 0
section .text
%2_asm:
%endmacro

%macro defop 1
defop %1, %1
%endmacro

;;; Creates a dictionary entry for a direct thread defined in the subsequent list of pointers.
%macro def 2
create %1, %2, dodirect_asm, %2_ops
section .rdata_forth
%2_ops:
%endmacro

%macro def 1
def %1, %1
%endmacro

;;; Creates an entry that returns its data field.
%macro constant 2
create %1,doconstant_asm,%2
%endmacro

;;; Creates an entry that returns the address of its data field.
%macro variable 3
create %1,%2,dovar_asm,%2_value
section .data
%2_value POINTER %3
section .text
%endmacro

%macro variable 2
variable %1,%1,%2
%endmacro

;;; After the last word to define a constant with the dictionary's size.
%macro finalize_dictionary 0
%ifndef DICTIONARY_FINALIZED
%define DICTIONARY_FINALIZED
constant dictionary_size,m_dictionary_size
%else
%fatal "Dictionary already finalized."
%endif
%endmacro

;;; Create an entry named %1 that is a copy of %2's code and data fields.
%macro defalias 3
create %1,%2,v_%3_code,v_%3_data
%endmacro

%macro defalias 2
defalias %1,%1,%2
%endmacro

;;; Constant pointing at the dictionary.
constant dictionary,dictionary_start
;;; Constant of a dictionary entry's byte size for index multiplying.
constant dict_entry_length,dict_entry_size

%endif
