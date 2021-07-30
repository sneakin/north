( Device address and IRQ helpers: )

constant local-storage-addr 4026560512
constant local-storage-irq 15

def local-storage
  local-storage-irq local-storage-addr return2
end

constant session-storage-addr 4026564608
constant session-storage-irq 16

def session-storage
  session-storage-irq session-storage-addr return2
end

constant indexed-storage-addr 4026568704
constant indexed-storage-irq 17

def indexed-storage
  indexed-storage-irq indexed-storage-addr return2
end

constant ipfs-storage-addr 4026572800
constant ipfs-storage-irq 18

def ipfs-storage
  ipfs-storage-irq ipfs-storage-addr return2
end

constant http-storage-addr 4026576896
constant http-storage-irq 19

def http-storage
  http-storage-irq http-storage-addr return2
end

constant table-storage-addr 4026580992
constant table-storage-irq 20

def table-storage
  table-storage-irq table-storage-addr return2
end

constant fs-storage-addr 4026585088
constant fs-storage-irq 21

def fs-storage
  fs-storage-irq fs-storage-addr return2
end
