( Device address and IRQ helpers: )

constant local-storage-addr 4026560512
constant local-storage-irq 15

: local-storage
  local-storage-irq local-storage-addr return2
;

constant session-storage-addr 4026564608
constant session-storage-irq 16

: session-storage
  session-storage-irq session-storage-addr return2
;

constant indexed-storage-addr 4026568704
constant indexed-storage-irq 17

: indexed-storage
  indexed-storage-irq indexed-storage-addr return2
;

constant ipfs-storage-addr 4026572800
constant ipfs-storage-irq 18

: ipfs-storage
  ipfs-storage-irq ipfs-storage-addr return2
;

constant http-storage-addr 4026576896
constant http-storage-irq 19

: http-storage
  http-storage-irq http-storage-addr return2
;

constant table-storage-addr 4026580992
constant table-storage-irq 20

: table-storage
  table-storage-irq table-storage-addr return2
;

constant fs-storage-addr 4026585088
constant fs-storage-irq 21

: fs-storage
  fs-storage-irq fs-storage-addr return2
;
