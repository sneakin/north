%ifdef DYNAMIC
%ifdef WINDOWS
%if BITS==64

defc dlopen,1,1,LoadLibraryA
defc dlsym,2,1,GetProcAddress
defc dlclose,1,0,FreeLibrary

%else

defstdcall dlopen,1,1,_LoadLibraryA@4
defstdcall dlsym,2,1,_GetProcAddress@8
defstdcall dlclose,1,0,_FreeLibrary@4

%endif
  
%else
defc dlopen,2,1
defc dlclose,1,0
defc dlsym,2,1
%endif

%endif
