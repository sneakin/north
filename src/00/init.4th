( Entry )

global-var *debug*

: init-00
  int32 0 *tokenizer* poke
  int32 0 *tokenizer-stack* poke
  int32 0 *status* poke
  int32 0 *debug* poke
  int32 0 *state* poke
  int32 10 base poke
  dict terminator? swapdrop IF
    dict-init
    about
  THEN
;

: test-init-00
    base peek int32 10 " set base to 10" assert-equal
    *tokenizer* peek int32 0 " set *tokenizer* to 0" assert-equal
    *tokenizer-stack* peek int32 0 " set *tokenizer-stack* to 0" assert-equal
    *status* peek int32 0 " set *status* to 0" assert-equal
    *state* peek int32 0 " set *state* to 0" assert-equal
    *debug* peek int32 0 " set *debug* to 0" assert-equal
;

: boot
    init-00
    test-init-00
    eval-input
    RECURSE
;
