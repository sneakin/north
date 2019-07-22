bits 32
  
%define num_args 0
%rep 8

defop ffi_stdcall_op_%+ num_args %+_0
%rep num_args
	mov ebx, [esp+ptrsize*num_args]
	push ebx
%endrep
	call [eax+dict_data]
  ret

defop ffi_stdcall_op_%+ num_args %+_1
%rep num_args
	mov ebx, [esp+ptrsize*num_args]
	push ebx
%endrep
	call [eax+dict_data]
	jmp [ffiexit_1+dict_code]

%assign num_args num_args + 1
%endrep


%macro defstdcall 4
extern %4
create c%1, ffi_stdcall_op_%2_%3_asm, %4
%endmacro

%macro defstdcall 3
%assign size (%2*ptrsize)
defstdcall %1,%2,%3,_%1@%+ size
%undef size  
%endmacro
