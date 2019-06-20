LDFLAGS=-g -m elf_i386

NASM=nasm
NASMFLAGS=-g -f elf32

BINARY=north
OBJECTS=north.o

$(BINARY): $(OBJECTS)
	$(LD) $(LDFLAGS) -o $@ $<

run: $(BINARY)
	./$(BINARY)

%.o: %.S
	$(NASM) $(NASMFLAGS) -o $@ $<

clean:
	rm -rf $(BINARY) $(OBJECTS)
