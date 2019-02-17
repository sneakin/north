( Entry )

: boot
  dict terminator? IF dict-init THEN
  drop
  eval-loop
  RECURSE
;
