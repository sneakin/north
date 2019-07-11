PROGRAMS=test-1

ifndef BITS
BITS=32
endif

POPPER=ruby ../scripts/preproc.rb

ifdef LIBC
LD=gcc
LDFLAGS=-m$(BITS) -no-pie -ldl
else
ifeq ($(BITS),32)
LDFLAGS=-m elf_i386 -e main
else
LDFLAGS=-m elf_x86_64 -e main
endif
endif

NASM=nasm
NASMFLAGS=-f elf$(BITS) -DBITS=$(BITS)

ifdef LIBC
NASMFLAGS+=-DLIBC
endif

ifdef RELEASE
NASMFLAGS+=-DRELEASE
else
LDFLAGS+=-g
NASMFLAGS+=-g -DDEBUG
endif

LINK=$(LD) $(LDFLAGS) -o $@ $<

all: $(PROGRAMS)

clean:
	rm -f $(PROGRAMS) *.o *.popped.*

%.o: %.S
	$(NASM) $(NASMFLAGS) -o $@ $<

%.o: %.asm
	$(NASM) $(NASMFLAGS) -o $@ $<

%.popped.$(BITS): %.pop
	$(POPPER) $< > $@

%.o: %.popped.$(BITS)
	$(NASM) $(NASMFLAGS) -o $@ $<
