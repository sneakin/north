%ifndef FFI_H
%define FFI_H 1

%if WINDOWS == 1 && BITS == 32

%macro defc 3
extern _%1
create c%1, fficall_%2_%3_asm, _%1
%endmacro

%else

%macro defc 4
extern %4
create c%1, fficall_%2_%3_asm, %4
%endmacro

%macro defc 3
defc %1,%2,%3,%1
%endmacro

%endif
  
%ifdef WINDOWS
%defstr PLATFORM_STR win
%else
%defstr PLATFORM_STR sysv
%endif

%defstr BITS_STR BITS
%strcat FFI_PATH "ffi-",PLATFORM_STR,"-",BITS_STR,".asm"
%include FFI_PATH

%endif
  
