(
: dallot
    dhere cell+ dup
arg0 int-add dup
dmove
return1-1
;
)

: dallot-zeroed
    arg0 dallot
    arg0 fill
    local0 return1-1
;

: dallot-cells
    arg0 cell* dallot-zeroed return1-1
;
