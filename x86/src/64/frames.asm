defop current_frame
  pop rax
  push fp
  push rax
  ret
  
defop begin_frame
  pop rax
  push fp
  mov fp, rsp
  jmp rax

defop drop_frame
  pop rax
  mov rsp, fp
  pop fp
  jmp rax
  
defop end_frame
  mov fp, [fp]
  ret

;;;
;;; Returns
;;;

defop drop_locals
  pop rax
  mov rsp, fp
  jmp rax
  
defop continue                  ; end the frame, leave the stack intact, and return to caller
  add rsp, ptrsize
  mov eval_ip, [fp+ptrsize]
  mov rax, [fp+ptrsize*2]
  mov fp, [fp]
  jmp rax

defop return0                   ; stash ToS, drop the frame, roll stash, and exit fn
  mov rsp, fp
  pop fp
	pop eval_ip
	ret
  
defop return_1                  ; drops an argument
  mov rsp, fp
  pop fp
	pop eval_ip
  pop rax
  add rsp, ptrsize
	jmp rax
  
defop return1
  mov rax, [rsp+ptrsize]
  mov rsp, fp
  pop fp
	pop eval_ip
  pop rbx
  push rax
  push rbx
	ret
  
defop return2
  mov rax, [rsp+ptrsize]
  mov rbx, [rsp+ptrsize*2]
  mov rsp, fp
  pop fp
	pop eval_ip
  pop rcx
  push rax
  push rbx
  push rcx
	ret

defop quit
  mov rbx, [rsp+ptrsize]        ; keep the ToS as C expects a return value
  mov rax, [fp]                 ; pop frames until the parent frame is 0
  cmp rax, 0
  je .done
  mov fp, rax
  jmp quit_asm
.done:
  mov rsp, fp                   ; enter the top most frame
  pop fp
  pop eval_ip
  pop rax                       ; save return to the top frame's caller
  push rbx                      ; return with the ToS
  jmp rax

;;;
;;; Call Arguments
;;;
  
defop args
  lea rax, [fp+ptrsize*3]
  pop rbx
  push rax
  push rbx
  ret
  
defop arg0
  mov rax, [fp+ptrsize*3]
  pop rbx
  push rax
  push rbx
  ret
  
defop arg1
  mov rax, [fp+ptrsize*4]
  pop rbx
  push rax
  push rbx
  ret

;;;
;;; Local data
;;;

defop locals
  lea rax, [fp-ptrsize*1]
  pop rbx
  push rax
  push rbx
  ret

defop local0
  mov rax, [fp-ptrsize*1]
  pop rbx
  push rax
  push rbx
  ret
