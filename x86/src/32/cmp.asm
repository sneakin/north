%macro cmpop 4
defop %1%2,%1_%3
  pop eax
  pop ebx
  pop ecx
  cmp ebx, ecx
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
  cmp ebx, ecx
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
invcmpop int,>,gt,jl
invcmpop int,>=,gte,jle

cmpop uint,<,lt,jb
cmpop uint,<=,lte,jbe
invcmpop uint,>,gt,jb
invcmpop uint,>=,gte,jbe

defalias <,lt,int_lt
defalias <=,lte,int_lte
defalias >,gt,int_gt
defalias >=,gte,int_gte
  
