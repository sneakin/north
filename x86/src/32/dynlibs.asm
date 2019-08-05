%ifdef DYNAMIC
%ifidni PLATFORM,windows

defstdcall dlopen,1,1,_LoadLibraryA@4
defstdcall dlsym,2,1,_GetProcAddress@8
defstdcall dlclose,1,0,_FreeLibrary@4

%else

defc dlopen,2,1
defc dlclose,1,0
defc dlsym,2,1

%endif
%endif
