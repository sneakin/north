%ifdef DYNAMIC
%ifdef WINDOWS
; defc LoadLibrary,1,1
; defc GetProcAddress,2,1
; defc GetLastError,0,1
extern LoadLibraryA
extern GetProcAddress
extern FreeLibrary

create cdlopen,fficall_2_1_asm,LoadLibraryA
create cdlsym,fficall_2_1_asm,GetProcAddress
create cdlclose,fficall_1_0_asm,FreeLibrary

%else
defc dlopen,2,1
defc dlclose,1,0
defc dlsym,2,1
%endif

%endif
