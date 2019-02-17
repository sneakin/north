( Entry )

: boot
  literal 0 *tokenizer* poke
  literal 0 *status* poke
  literal 0 *debug* poke
  literal 0 *state* poke
  literal 10 base poke
  dict terminator? swapdrop IF dict-init THEN
  eval-loop
  RECURSE
;
