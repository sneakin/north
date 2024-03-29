;; variable base, 10
;; variable immediate_dict, 0
;; variable dict, 0
;; variable *mark*, 0
;; variable *state*, 0
;; variable *status*, 0
;; variable *tokenizer*, 0

defop eip
  pop eax
  push eval_ip
  push eax
  ret
  
defop peek_byte
  mov eax, [esp+ptrsize]
  mov al, [eax]
  mov [esp+ptrsize], eax
  ret
  
;;; 
;;; Frames
;;; 

;;; todo move to frames.asm?

defalias begin,begin_frame

defop exit
  mov eval_ip, [fp+ptrsize]
  jmp end_frame_asm

defalias exit_frame,exit
	
defop arg2
  mov eax, [fp+call_frame_byte_size+ptrsize*2]
  pop ebx
  push eax
  push ebx
  ret

defop arg3
  mov eax, [fp+call_frame_byte_size+ptrsize*3]
  pop ebx
  push eax
  push ebx
  ret

defop set_arg0
  pop ebx
  pop eax
  mov [fp+call_frame_byte_size], eax
  push ebx
  ret

defop set_arg1
  pop ebx
  pop eax
  mov [fp+call_frame_byte_size+ptrsize], eax
  push ebx
  ret

defop set_arg2
  pop ebx
  pop eax
  mov [fp+call_frame_byte_size+ptrsize*2], eax
  push ebx
  ret

defop set_arg3
  pop ebx
  pop eax
  mov [fp+call_frame_byte_size+ptrsize*3], eax
  push ebx
  ret

defop store_local0
  pop ebx
  pop eax
  mov [fp-ptrsize*1], eax
  push ebx
  ret

defop return0_n
  mov eax, [esp+ptrsize]        ; # of args to drop
  imul eax, ptrsize
  mov esp, fp                   ; return from frame
  pop fp
	pop eval_ip
  pop ebx                       ; save next's address
  add esp, eax                  ; drop the args
  push ebx                      ; restore return
  ret

defop return1_n
  mov eax, [esp+ptrsize]        ; # of args to drop
  imul eax, ptrsize
  mov ebx, [esp+ptrsize*2]      ; return value
  mov esp, fp                   ; return from frame
  pop fp
	pop eval_ip
  pop ecx                       ; save next's address
  add esp, eax                  ; drop the args
  push ebx                      ; push return value
  push ecx                      ; restore return
  ret

defop return2_n
  mov eax, [esp+ptrsize]        ; # of args to drop
  imul eax, ptrsize
  mov ebx, esp                  ; save stack for return values
  mov esp, fp                   ; return from frame
  pop fp
  pop eval_ip
  pop ecx                       ; save next's address
  add esp, eax                  ; drop the args
  mov eax, [ebx+ptrsize*3]      ; push return value 1
  push eax
  mov eax, [ebx+ptrsize*2]      ; push return value 2
  push eax
  push ecx                      ; restore return
  ret

defop cont
  pop ebx
  pop eax
  ;; end the frame
  mov eval_ip, [fp+ptrsize]
  mov ecx, [fp+ptrsize*2]
  mov fp, [fp]
  push ecx
  ;; push ebx
  jmp [eax+dict_entry_code]
	
defop tailcall
  pop ebx
  pop eax
  mov esp, fp
  pop fp
  pop eval_ip
  jmp [eax+dict_entry_code]
  
;;;
;;; Pairs
;;;
  
defop 2dup,twodup
  pop eax
  mov ebx, [esp+ptrsize]
  push ebx
  mov ebx, [esp+ptrsize]
  push ebx
  push eax
  ret
  
defop drop2
	pop eax
	add esp, ptrsize*2
	push eax
	ret

;;;
;;; Stack manipulations
;;;

defop move
  pop ebx
  pop eax
  add esp, eax
  push ebx
  ret

defop drop3
	pop eax
	add esp, ptrsize*3
	push eax
	ret

defop swapdrop
  pop eax
  pop ebx
  pop ecx
  push ebx
  push eax
  ret

defop rotdrop2
  pop eax
  pop ebx
  add esp, ptrsize*2
  push ebx
  push eax
	ret

;;;
;;; Control flow
;;;

defop exec_core_word
  pop ebx
  pop eax
  push ebx
  jmp [eax+dict_entry_code]

defop exec_op                      ; assembly word
  pop eax
  pop eax
  jmp eax

defop jump                      ; evaluated code
  pop eax
  pop eval_ip
  push eax
  ret

defop jump_entry_data
  pop eax
  pop eval_ip
  mov eval_ip, [eval_ip+dict_entry_data]
  add eval_ip, [d_offset_indirect_size+dict_entry_data]
  push eax
  ret

defop do_seq             ; word is in eax
  push eval_ip
  mov eval_ip, eax
  add eval_ip, ptrsize
  jmp [d_next+dict_entry_code]

defop call_indirect_seq
  pop ebx
  pop eax
  push ebx
  jmp [d_do_seq+dict_entry_code]

defop call_data_seq             ; word is in eax
  push eval_ip
  mov eval_ip, [eax+dict_entry_data]
  add eval_ip, ptrsize
  call [d_begin_frame+dict_entry_code]
  jmp [d_next+dict_entry_code]

defop call_offset_data_seq             ; word is in eax
  push eval_ip
  mov eval_ip, [eax+dict_entry_data]
  add eval_ip, [d_offset_indirect_size+dict_entry_data]
  call [d_begin_frame+dict_entry_code]
  jmp [d_next_offset_indirect+dict_entry_code]

defop value_peeker
	pop ebx
	mov eax, [eax+dict_entry_data]
	push eax
	push ebx
	ret

defop variable_peeker
	pop ebx
	mov eax, [eax+dict_entry_data]
	push eax
	push ebx
	ret

;;;
;;; Aliases
;;;
  
;;; defalias lit,literal
defop next_param
  mov ebx, [fp+ptrsize]
  mov eax, [ebx]
  call [d_indexed_offset_a+dict_entry_code]
  pop ecx
  push eax
  push ecx
  add ebx, [d_offset_indirect_size+dict_entry_data]
  mov [fp+ptrsize], ebx
  ret
  
  ;; defalias value_peeker,doconstant
  ;; defalias variable_peeker,dovar

defalias equals,eq

defop set_current_frame
  pop ebx
  pop fp
  push ebx
  ret
  
defop drop_call_frame
  pop eax
  mov fp, [fp]
  add esp, call_frame_byte_size
  push eax
  ret

defop returnN
  pop eax
  pop eax                       ; # words
  mov ebx, esp                  ; where we were
  ;;  pop frame
  mov esp, fp
  pop fp
  pop eval_ip
  pop ecx                       ; next addr
  jmp shift_stack_go
  
defop shift_stack
  pop ecx
  pop eax                       ; # words
  pop ebx                       ; target SP
  shift_stack_go: 
  imul eax, ptrsize
  add eax, ebx
  .loop:
  cmp eax, ebx
  jle .done
  add eax, -ptrsize
  mov edx, [eax]
  push edx
  jmp .loop
  .done:
  push ecx
  ret

defop reboot
  ret

defop do_accessor
  pop ecx
  pop ebx
  mov eax, [eax+dict_entry_data]
  add eax, ebx
  push eax
  push ecx
  ret

variable on_trace,0
  
defop do_trace
  ;; push eax
  ;; mov eax, d_on_trace
  ;; call [d_exec_core_word+dict_entry_code]
  ret

defop do_op_trace
  ret

defop shift
  pop eax
  pop ebx
  pop ecx
  pop edx
  push ecx
  push ebx
  push edx
  push eax
  ret

defop jump_return
  pop eax
  pop eval_ip
  ret
