( Sequence accessors: )

: head-seq
  arg0 peek return1
;

: tail-seq
  arg0 cell+ return1
;

: seq-poke ( v seq n )
  arg2 arg1 arg0 cell+n rotdrop2 cell+ swapdrop
  poke
;

: seq-peek ( [seq n] todo bounds checking )
  arg1 arg0 cell+n cell+ rotdrop2
  peek return1
;


( Sequence iteration: )

: revmap ( ptr count fn )
  arg1 literal 0 <= IF return0 THEN
  arg1 literal 1 int-sub set-arg1
  arg2 arg1 cell* swapdrop int-add peek
  arg0 exec
  RECURSE
;

: map/4 ( ptr count fn counter )
  arg0 arg2 >= IF return0 THEN
  arg3 arg0 cell* swapdrop int-add peek
  arg1 exec
  arg0 literal 1 int-add set-arg0
  RECURSE
;

: map ( ptr count fn )
  literal 0
  rot swap
  literal map/4 jump-entry-data
;

: map-seq ( seq fn )
  arg1 seq-length swap
  cell+ swapdrop swap
  arg0 literal 0 map/4
;

: revmap-seq ( seq fn )
  arg1 seq-length swap
  cell+ swapdrop swap
  arg0
  revmap
;


( Sequence writing: )

: write-seq
  arg0 literal write-line-ret map-seq
;
