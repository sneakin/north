defop current_frame
  pop rax
  push rbp
  push rax
  ret
  
defop begin_frame
  pop rax
  push rbp
  mov rbp, rsp
  jmp rax

defop drop_frame
  pop rax
  mov rsp, rbp
  pop rbp
  jmp rax
  
defop end_frame
  mov rbp, [rbp]
  ret

defop drop_locals
  pop rax
  mov rsp, rbp
  jmp rax
  
defop continue                  ; end the frame, leave the stack intact, and return to caller
  add rsp, ptrsize
  mov eval_ip, [rbp+ptrsize]
  mov rax, [rbp+ptrsize*2]
  mov rbp, [rbp]
  jmp rax

defop return0                   ; stash ToS, drop the frame, roll stash, and exit fn
  mov rsp, rbp
  pop rbp
	pop eval_ip
	ret
  
defop return1
  mov rax, [rsp+ptrsize]
  mov rsp, rbp
  pop rbp
	pop eval_ip
  pop rbx
  push rax
  push rbx
	ret
  
defop arg0
  mov rax, [rbp+ptrsize*3]
  pop rbx
  push rax
  push rbx
  ret
  
defop arg1
  mov rax, [rbp+ptrsize*4]
  pop rbx
  push rax
  push rbx
  ret
