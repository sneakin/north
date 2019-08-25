defop current_frame
  pop eax
  push fp
  push eax
  ret
  
defop begin_frame
  pop eax
  push fp
  mov fp, esp
  jmp eax

defop drop_frame
  pop eax
  mov esp, fp
  pop fp
  jmp eax
  
defop end_frame
  mov fp, [fp]
  ret

defop drop_locals
  pop eax
  mov esp, fp
  jmp eax
  
defop continue                  ; end the frame, leave the stack intact, and return to caller
  add esp, ptrsize
  mov eval_ip, [fp+ptrsize]
  mov eax, [fp+ptrsize*2]
  mov fp, [fp]
  jmp eax

defop return0                   ; stash ToS, drop the frame, roll stash, and exit fn
  mov esp, fp
  pop fp
	pop eval_ip
	ret
  
defop return_1                  ; drops an argument
  mov esp, fp
  pop fp
	pop eval_ip
  pop eax
  add esp, ptrsize
	jmp eax

defop return1
  mov eax, [esp+ptrsize]
  mov esp, fp
  pop fp
	pop eval_ip
  pop ebx
  push eax
  push ebx
	ret
  
defop return2
  mov eax, [esp+ptrsize]
  mov ebx, [esp+ptrsize*2]
  mov esp, fp
  pop fp
	pop eval_ip
  pop ecx
  push eax
  push ebx
  push ecx
	ret
  
defop quit
  mov ebx, [esp+ptrsize]        ; keep the ToS as C expects a return value
  mov eax, [fp]                 ; pop frames until the parent frame is 0
  cmp eax, 0
  je .done
  mov fp, eax
  jmp quit_asm
.done:
  mov esp, fp                   ; enter the top most frame
  pop fp
  pop eval_ip
  pop eax                       ; save return to the top frame's caller
  push ebx                      ; return with the ToS
  jmp eax

defop arg0
  mov eax, [fp+ptrsize*3]
  pop ebx
  push eax
  push ebx
  ret
  
defop arg1
  mov eax, [fp+ptrsize*4]
  pop ebx
  push eax
  push ebx
  ret

defop local0
  mov eax, [fp-ptrsize*1]
  pop ebx
  push eax
  push ebx
  ret
