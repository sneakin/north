defop current_frame
  pop eax
  push ebp
  push eax
  ret
  
defop begin_frame
  pop eax
  push ebp
  mov ebp, esp
  jmp eax

defop drop_frame
  pop eax
  mov esp, ebp
  pop ebp
  jmp eax
  
defop end_frame
  mov ebp, [ebp]
  ret

defop drop_locals
  pop eax
  mov esp, ebp
  jmp eax
  
defop continue                  ; end the frame, leave the stack intact, and return to caller
  add esp, ptrsize
  mov eval_ip, [ebp+ptrsize]
  mov eax, [ebp+ptrsize*2]
  mov ebp, [ebp]
  jmp eax

defop return0                   ; stash ToS, drop the frame, roll stash, and exit fn
  mov esp, ebp
  pop ebp
	pop eval_ip
	ret
  
defop return1
  mov eax, [esp+ptrsize]
  mov esp, ebp
  pop ebp
	pop eval_ip
  pop ebx
  push eax
  push ebx
	ret
  
defop arg0
  mov eax, [ebp+ptrsize*3]
  pop ebx
  push eax
  push ebx
  ret
  
defop arg1
  mov eax, [ebp+ptrsize*4]
  pop ebx
  push eax
  push ebx
  ret
