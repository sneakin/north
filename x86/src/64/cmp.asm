%macro cmpop 4
defop %1%2,%1_%3
  pop rax
  pop rbx
  pop rcx
  cmp rbx, rcx
  %4 .true
  push 0
  push rax
  ret
.true:
  push 1
  push rax
  ret
%endmacro

%macro invcmpop 4
defop %1%2,%1_%3
  pop rax
  pop rbx
  pop rcx
  cmp rbx, rcx
  %4 .false
  push 1
  push rax
  ret
.false:
  push 0
  push rax
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
  
