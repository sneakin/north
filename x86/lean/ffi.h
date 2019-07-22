%ifndef FFI_H
%define FFI_H 1

%ifdef WINDOWS
%if BITS == 32

%macro defc 4
extern _%4
create c%1, fficall_op_%2_%3_asm, _%4
%endmacro

%endif
%endif

%ifndef defc

%macro defc 4
extern %4
create c%1, fficall_op_%2_%3_asm, %4
%endmacro

%endif

  
%macro defc 3
defc %1,%2,%3,%1
%endmacro


%ifdef WINDOWS
%defstr PLATFORM_STR win
%else
%defstr PLATFORM_STR sysv
%endif

%defstr BITS_STR BITS
%strcat FFI_PATH "ffi-",PLATFORM_STR,"-",BITS_STR,".asm"
%include FFI_PATH

%endif