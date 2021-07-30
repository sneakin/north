( Colon definition decompilation: address listing: )

def decompile-write-addr
  arg0 write-unsigned-int write-space write-crnl
end

def decompile-seq-by-addr
  arg0 literal decompile-write-addr map-seq return0
end

def decompile-by-addr
  arg0 dict-entry-data decompile-seq-by-addr
end

( Colon definition decompilation: name listing: )

def decompile-write-name
  arg0 dict-entry? IF
    dict-entry-name write-string write-space
    return0
  THEN
  write-unsigned-int write-space
  return0
end

def decompile-seq-by-name
  arg0 literal decompile-write-name map-seq return0
end

( fixme needs to handle non-sequence definitions, or those defs need lengths )
(      fixme need to make the asm code indirectly called for this to work )

( Decompile a colon definition printing out the calls by name if they are in the dictionary. )
def decompile
  arg0 dict-entry? IF
    " : " write-string drop
    dict-entry-name write-line drop
    (
          dict-entry-code dict-entry? IF
            " does> " write-string drop dict-entry-name write-line drop
    THEN drop
    )
          dict-entry-def? IF dict-entry-data decompile-seq-by-name THEN
  THEN
end
