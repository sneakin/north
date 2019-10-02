( Entry )

global-var *debug*

: init-00
  int32 0 *tokenizer* poke
  int32 0 *status* poke
  int32 0 *debug* poke
  int32 0 *state* poke
  int32 10 base poke
  dict terminator? swapdrop IF
    dict-init
    about
  THEN
;

: boot
  init-00
  eval-loop
  RECURSE
;
