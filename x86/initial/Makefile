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
NASMFLAGS=-f elf$(BITS)

ifdef LIBC
NASMFLAGS+=-DLIBC
endif

ifdef RELEASE
NASMFLAGS+=-DRELEASE
else
LDFLAGS+=-g
NASMFLAGS+=-g -DDEBUG
endif

PROGRAMS=north-$(BITS)

LINK=$(LD) $(LDFLAGS) -o $@ $<

all: north-$(BITS)
north-$(BITS): north-$(BITS).o
	$(LINK)

north-64.o: test-north.popped.64

ifdef LIBC
PROGRAMS+=pcoder-$(BITS)
all: pcoder-$(BITS)

pcoder-$(BITS).o: test-1.popped.$(BITS)

pcoder-$(BITS): pcoder-$(BITS).o
	$(LINK)
endif

%.o: %.S
	$(NASM) $(NASMFLAGS) -o $@ $<

%.o: %.asm
	$(NASM) $(NASMFLAGS) -o $@ $<

%.popped.$(BITS): %.pop
	$(POPPER) $< > $@

%.o: %.popped.$(BITS)
	$(NASM) $(NASMFLAGS) -o $@ $<

clean:
	rm -rf $(PROGRAMS) *.o *.popped*
