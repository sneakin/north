( Colon definition decompilation: address listing: )

: decompile-write-addr
  arg0 write-unsigned-int write-space write-crnl
;

: decompile-seq-by-addr
  arg0 literal decompile-write-addr map-seq return0
;

: decompile-by-addr
  arg0 dict-entry-data decompile-seq-by-addr
;

( Colon definition decompilation: name listing: )

: decompile-write-name
  arg0 dict-entry? IF
    dict-entry-name write-string write-space
    return0
  THEN
  write-unsigned-int write-space
  return0
;

: decompile-seq-by-name
  arg0 literal decompile-write-name map-seq return0
;

( fixme needs to handle non-sequence definitions, or those defs need lengths )

( Decompile a colon definition printing out the calls by name if they are in the dictionary. )
: decompile
  arg0 dict-entry? IF
    " : " write-string drop
          dict-entry-name write-line drop
          dict-entry-code dict-entry? IF
            ( fixme need to make the asm code indirectly called for this to work )
            " does> " write-string drop dict-entry-name write-line drop
          THEN drop
    dict-entry-data decompile-seq-by-name
  THEN
;
