( Basic Prompt )

def write-ok
  int32 $204b4f20 write-word 
end

def write-err
  int32 $20524520 write-word 
end

def write-status
  *status* peek IF
    write-err int32 0 *status* poke return0
  THEN
  write-ok
end
 
def prompt
  int32 $203e0a0d write-word 
end

( More input prompt: )

redef error
  ( error-msg2 error-msg1 )
  arg0 write-line
  arg1 write-line
  arg0 *status* poke
  int32 0 *state* poke
  eval-loop ( let's poke around )
end

redef eval-read-line
  write-status eval-tos peek peek write-int drop write-tab
  prompt read-line return1
end
