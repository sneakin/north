(
structure structure-field
field: name
field: type
field: size
field: offset
field: doc

structure structure
field: byte-size
field: fields
)

: structure-byte-size
    arg0 return1-1
;

: structure-fields
    arg0 cell+ return1-1
;

: structure-field-name
    arg0 return1-1
;

: structure-field-size
    arg0 cell+ return1-1
;

: structure-field-type
    arg0 literal 2 cell+n return1-1
;

: structure-field-offset
    arg0 literal 3 cell+n return1-1
;

: structure-field-doc
    arg0 literal 4 cell+n return1-1
;

: make-structure-field
    literal 5 dallot-cells
    arg0 over structure-field-name poke
    arg1 over structure-field-size poke
    arg2 over structure-field-type poke
    arg3 over structure-field-offset poke
    literal 0 over structure-field-doc poke
    return1
;

: structure-byte-size-inc
    arg0 structure-byte-size peek arg1 int-add 
    arg0 structure-byte-size poke
;

: structure-add-field
    arg0 structure-byte-size peek
    arg3 arg2 arg1 make-structure-field
    arg0 structure-fields peek
    swap dcons
    arg0 structure-fields poke
    arg2 arg0 structure-byte-size-inc
    literal 2 dropn return1
;

: make-structure
    literal 2 dallot-cells
    literal 0 over structure-byte-size poke
    literal 0 over structure-fields poke
    return1
;

: does-struct
    ' value-peeker dict-entry-code dict set-dict-entry-code
    make-structure dict set-dict-entry-data
;

: structure
    create does-struct
;

: structure-gen-accessor
    args( field name )
    arg1 structure-field-name peek
    " -" arg0 literal 3 n-seqs-append
    ' do-accessor dict-entry-code swapdrop
    arg1 structure-field-offset peek
    dict add-dict-after
;

( todo need a type system. if all structs are wrapped in a typed pointer cons? )

: does-structure?
    arg0 dict-entry-code
    ' value-peeker dict-entry-code swapdrop
    equals return1
;

: field/3
    args( type byte-size name )
    dict does-structure? UNLESS " Not defining a structure." " structure-error" error THEN
    arg2 arg1 arg0
    dict dict-entry-data swapdrop
    structure-add-field
    dict dict-entry-name swapdrop
    structure-gen-accessor
;

: field[]
    next-word next-int next-int rot field/3
;

: bytes:
     int32 0 next-word next-int swap field/3
;

: cells:
     int32 0 next-word next-int cell* swapdrop swap field/3
;

: field:
     int32 0 cell-size next-word field/3
;

: make-instance
    arg0 structure-byte-size peek dallot return1-1
;

: test-struct
    " structure point
    field[] x 1 4
    field: y
    field: z
    cells: angles 3
    point structure-byte-size @ write-int write-crnl drop
    point make-instance variable position
    : write-point
    arg0 point-x @ write-int write-space drop
    arg0 point-y @ write-int write-space drop
    arg0 point-z @ write-int drop
    ;
    11 over point-x !
    22 over point-y !
    33 over point-z !
    write-point
    " eval-string
;
