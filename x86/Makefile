ifndef BITS
BITS=32
endif

ifdef LIBC
LD=gcc
LDFLAGS=-m$(BITS) -no-pie -ldl
else
LDFLAGS=-m elf_i386 -e main
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
	ruby preproc.rb $< > $@

clean:
	rm -rf $(PROGRAMS) *.o *.popped*
