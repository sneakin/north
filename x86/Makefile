ifdef LIBC
LD=gcc
LDFLAGS=-m32 -ldl
else
LDFLAGS=-m elf_i386 -e main
endif

NASM=nasm
NASMFLAGS=-f elf32

ifdef LIBC
NASMFLAGS+=-DLIBC
endif

ifdef RELEASE
NASMFLAGS+=-DRELEASE
else
LDFLAGS+=-g
NASMFLAGS+=-g -DDEBUG
endif

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
