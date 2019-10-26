%macro cmpop 4
defop %1%2,%1_%3
  pop eax
  pop ebx
  pop ecx
  cmp ecx, ebx
  %4 .true
  push 0
  push eax
  ret
.true:
  push 1
  push eax
  ret
%endmacro

%macro invcmpop 4
defop %1%2,%1_%3
  pop eax
  pop ebx
  pop ecx
  cmp ecx, ebx
  %4 .false
  push 1
  push eax
  ret
.false:
  push 0
  push eax
  ret
%endmacro

cmpop int,<,lt,jl
cmpop int,<=,lte,jle
invcmpop int,>,gt,jle
invcmpop int,>=,gte,jl

cmpop uint,<,lt,jb
cmpop uint,<=,lte,jbe
invcmpop uint,>,gt,jbe
invcmpop uint,>=,gte,jb

defalias <,lt,int_lt
defalias <=,lte,int_lte
defalias >,gt,int_gt
defalias >=,gte,int_gte
  
;;;
;;; Floats
;;;

%macro cmpfop 4
defop %1%2,%1_%3
  pop eax
  fld dword [esp+ptrsize]
  fld dword [esp]
  fcomi
  fstp st0
  %4 .true
  push 0
  push eax
  ret
.true:
  push 1
  push eax
  ret
%endmacro

%macro invcmpfop 4
defop %1%2,%1_%3
  pop eax
  fld dword [esp+ptrsize]
  fld dword [esp]
  fcomi
  fstp st0
  %4 .false
  push 1
  push eax
  ret
.false:
  push 0
  push eax
  ret
%endmacro

cmpfop float,<,lt,jb
cmpfop float,<=,lte,jbe
invcmpfop float,>,gt,jbe
invcmpfop float,>=,gte,jb
