%ifndef FFI_H
%define FFI_H 1

%ifidni PLATFORM,windows
%if BITS == 32

%define HAS_DEFC 1

%macro defc 4
extern _%4
create c%1, fficall_op_%2_%3_asm, _%4
%endmacro

%endif
%endif

%ifndef HAS_DEFC

%macro defc 4
extern %4
create c%1, fficall_op_%2_%3_asm, %4
%endmacro

%endif

  
%macro defc 3
defc %1,%2,%3,%1
%endmacro


%ifidni PLATFORM,windows
%defstr PLATFORM_STR win
%else
%defstr PLATFORM_STR sysv
%endif

%if BITS==64
%include "ffi/ffi-sysv-64.asm"
%include "ffi/ffi-win-64.asm"
%else
%include "ffi/ffi-sysv-32.asm"
%include "ffi/ffi-stdcall-32.asm"
%endif

;;; map fficall functions to platform ffi
%define platform_ffi ffi_sysv_%+ BITS

%ifidni PLATFORM,windows
%if BITS==64
%define platform_ffi ffi_win_64
%endif
%endif
  
%define num_rets 0
%rep 2

create fficall_n_%+ num_rets , platform_ffi%+ _n_%+ num_rets%+ _asm , 0
create fficall_op_n_%+ num_rets , platform_ffi%+ _op_n_%+ num_rets%+ _asm , 0
fficall_op_n_%+ num_rets %+ _asm equ platform_ffi%+ _op_n_%+ num_rets%+ _asm

%define num_args 0
%rep 7

create fficall_%+ num_args %+ _%+ num_rets , platform_ffi%+ _%+ num_args %+ _%+ num_rets%+ _asm , 0
create fficall_op_%+ num_args %+ _%+ num_rets , platform_ffi%+ _op_%+ num_args %+ _%+ num_rets%+ _asm , 0
fficall_op_%+ num_args %+ _%+ num_rets%+ _asm equ platform_ffi%+ _op_%+ num_args %+ _%+ num_rets%+ _asm
  
%assign num_args num_args + 1
%endrep

%assign num_rets num_rets + 1
%endrep
  
%endif
