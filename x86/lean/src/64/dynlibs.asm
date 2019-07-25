%ifdef DYNAMIC
%ifidni PLATFORM,windows

defc dlopen,1,1,LoadLibraryA
defc dlsym,2,1,GetProcAddress
defc dlclose,1,0,FreeLibrary

%else

defc dlopen,2,1
defc dlclose,1,0
defc dlsym,2,1

%endif
%endif
