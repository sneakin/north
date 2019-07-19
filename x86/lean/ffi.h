%macro defc 3
extern %1
create c%1, fficall_%2_%3_asm, %1
%endmacro

%ifdef WINDOWS
%defstr PLATFORM_STR win
%else
%defstr PLATFORM_STR sysv
%endif

%defstr BITS_STR BITS
%strcat FFI_PATH "ffi-",PLATFORM_STR,"-",BITS_STR,".asm"
%include FFI_PATH
