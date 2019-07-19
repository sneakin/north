PROGRAMS=test-north test-loader test-index test-dictionary bammer.bin

#
# Flags:
#

POPPER=ruby ../scripts/preproc.rb

ifndef BITS
BITS=32
endif

ifndef LIBC
LIBC=1
endif

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
NASMDEFS=-DBITS=$(BITS)

ifdef LIBC
NASMDEFS+=-DLIBC
endif

ifdef RELEASE
NASMDEFS+=-DRELEASE
else
LDFLAGS+=-g
NASMFLAGS+=-g
NASMDEFS+=-DDEBUG
endif

NASMFLAGS+=-f elf$(BITS) $(NASMDEFS)

LINK=$(LD) $(LDFLAGS) -o $@ $<

#
# Rules
#

all: $(PROGRAMS)

clean:
	rm -f $(PROGRAMS) *.o *.popped.*

%.o: %.S
	$(NASM) $(NASMFLAGS) -o $@ $<

%.o: %.asm
	$(NASM) $(NASMFLAGS) -o $@ $<

%.popped.$(BITS): %.pop north-$(BITS).asm north.h
	$(POPPER) $< > $@

%.o: %.popped.$(BITS)
	$(NASM) $(NASMFLAGS) -o $@ $<

%.bin: %.popped.$(BITS) opcodes-$(BITS).h
	$(NASM) $(NASMDEFS) -o $@ $<

#
# Individual files:
#

opcodes-$(BITS).h: test-dictionary
	./test-dictionary 1 > $@

