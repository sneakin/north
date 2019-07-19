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

ifndef DYNAMIC
DYNAMIC=1
endif

ifeq ($(LIBC),1)
ifdef WINDOWS
LDFLAGS=-m$(BITS) -no-pie
else
LDFLAGS=-m$(BITS) -no-pie -ldl
endif
else
ifeq ($(BITS),32)
LDFLAGS=-m elf_i386 -e main
else
LDFLAGS=-m elf_x86_64 -e main
endif
endif

NASM=nasm
DEFINES=-DBITS=$(BITS)

ifeq ($(DYNAMIC),1)
DEFINES+=-DDYNAMIC
endif

ifeq ($(LIBC),1)
DEFINES+=-DLIBC
endif

ifeq ($(WINDOWS),1)
DEFINES+=-DWINDOWS
endif

ifeq ($(RELEASE),1)
DEFINES+=-DRELEASE
else
LDFLAGS+=-g
NASMFLAGS+=-g
DEFINES+=-DDEBUG
endif

NASMFLAGS+=-f elf$(BITS) $(DEFINES)

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
	$(NASM) $(DEFINES) -o $@ $<

#
# Individual files:
#

opcodes-$(BITS).h: test-dictionary
	./test-dictionary 1 > $@

