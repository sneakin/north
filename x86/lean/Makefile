PROGRAMS=test-hello test-north test-loader test-index test-dictionary bammer.bin
HEADERS=north.h ffi.h indexed.h

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
LDFLAGS=-mconsole -no-pie
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
DEFINES+=-DDYNAMIC=1
endif

ifeq ($(LIBC),1)
DEFINES+=-DLIBC=1
endif

ifeq ($(WINDOWS),1)
DEFINES+=-DWINDOWS=1
endif

ifeq ($(RELEASE),1)
DEFINES+=-DRELEASE=1
else
LDFLAGS+=-g
NASMFLAGS+=-g
DEFINES+=-DDEBUG=1
endif

ifeq ($(WINDOWS),1)
NASMFLAGS+=-f win$(BITS)
else
NASMFLAGS+=-f elf$(BITS)
endif

NASMFLAGS+=$(DEFINES)

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

%.popped.$(BITS): %.pop north-$(BITS).asm $(HEADERS)
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

