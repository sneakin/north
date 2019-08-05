ifndef NASM
NASM=nasm
endif

ifeq ($(DEBUG),1)
LDFLAGS+=-g
NASMFLAGS+=-g
DEFINES+=-DDEBUG=1
endif

ifeq ($(PLATFORM),windows)
NASMFLAGS+=-f win$(BITS)
else
NASMFLAGS+=-f elf$(BITS)
endif

NASMFLAGS+=$(DEFINES) -I$(INCDIR) -I$(OUTDIR)/include -I$(srcdir)/src/$(BITS) -I$(srcdir)/src

$(OBJDIR)/%.o : %.asm
	$(NASM) $(NASM_FLAGS) -o $@ $<
