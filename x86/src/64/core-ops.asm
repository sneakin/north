variable base, 10
variable immediate_dict, 0
;; variable dict, 0
;; variable *mark*, 0
;; variable *state*, 0
;; variable *status*, 0
;; variable *tokenizer*, 0

defop peek_byte
  mov rax, [rsp+ptrsize]
  mov al, [rax]
  mov [rsp+ptrsize], rax
  ret
  
;;;
;;; Dictionary
;;;
  
%define r_dict r9
  
defop dict
  pop rax
  push r_dict
  push rax
  ret
  
defop set_dict
  pop rax
  pop r_dict
  push rax
  ret
  
;;; 
;;; Frames
;;; 

defalias exit,continue
defalias begin,begin_frame
defalias end,end_frame
  
defop arg2
  mov rax, [rbp+ptrsize*5]
  pop rbx
  push rax
  push rbx
  ret

defop arg3
  mov rax, [rbp+ptrsize*6]
  pop rbx
  push rax
  push rbx
  ret

defop set_arg0
  pop rbx
  pop rax
  mov [rbp+ptrsize*3], rax
  push rbx
  ret

defop set_arg1
  pop rbx
  pop rax
  mov [rbp+ptrsize*4], rax
  push rbx
  ret

defop set_arg2
  pop rbx
  pop rax
  mov [rbp+ptrsize*5], rax
  push rbx
  ret

defop set_arg3
  pop rbx
  pop rax
  mov [rbp+ptrsize*6], rax
  push rbx
  ret

defop store_local0
  pop rbx
  pop rax
  mov [rbp-ptrsize*0], rax
  push rbx
  ret

defop return0_n
  mov rax, [rsp+ptrsize]        ; # of args to drop
  imul rax, ptrsize
  mov rsp, fp                   ; return from frame
  pop fp
	pop eval_ip
  pop rbx                       ; save next's address
  add rsp, rax                  ; drop the args
  push rbx                      ; restore return
  ret

defop return1_n
  mov rax, [rsp+ptrsize]        ; # of args to drop
  imul rax, ptrsize
  mov rbx, [rsp+ptrsize*2]      ; return value
  mov rsp, fp                   ; return from frame
  pop fp
	pop eval_ip
  pop rcx                       ; save next's address
  add rsp, rax                  ; drop the args
  push rbx                      ; push return value
  push rcx                      ; restore return
  ret

defop cont
  pop rbx
  pop rax
  ;; end the frame
  mov rsp, fp
  pop fp
  jmp [rax+dict_entry_code]
  
;;;
;;; Pairs
;;;
  
defop 2dup,twodup
  pop rax
  mov rbx, [rsp+ptrsize]
  push rbx
  mov rbx, [rsp+ptrsize]
  push rbx
  push rax
  ret
  
defop drop2
	pop rax
	add rsp, ptrsize*2
	push rax
	ret

;;;
;;; Stack manipulations
;;;
  
defop drop3
	pop rax
	add rsp, ptrsize*3
	push rax
	ret

defop swapdrop
  pop rax
  pop rbx
  pop rcx
  push rbx
  push rax
  ret

defop rotdrop2
  pop rax
  pop rbx
  add rsp, ptrsize*2
  push rbx
  push rax
	ret

;;;
;;; Control flow
;;;
  
defop exec                      ; assembly word
  pop rax
  pop rax
  jmp rax

defop jump                      ; evaluated code
  pop rax
  pop eval_ip
  push rax
  ret

defop jump_entry_data
  pop rax
  pop eval_ip
  add eval_ip, dict_entry_data
  push rax
  ret

defop call_data_seq             ; word is in rax
  push eval_ip
  mov eval_ip, [rax+ptrsize*2]
  add eval_ip, [d_offset_indirect_size+dict_entry_data]
  call [d_begin_frame+dict_entry_code]
  jmp [d_next_offset_indirect+dict_entry_code]

defop value_peeker
	pop rbx
	mov rax, [rax+ptrsize*2]
	push rax
	push rbx
	ret

defop variable_peeker
	pop rbx
	mov rax, [rax+ptrsize*2]
	push rax
	push rbx
	ret

;;;
;;; Aliases
;;;
  
;;; defalias lit,literal
defalias next_param,literal

  ;; defalias value_peeker,doconstant
  ;; defalias variable_peeker,dovar
defalias equals,eq

defalias drop_call_frame,drop2
