PROGRAMS=test-lone-hello test-hello test-printf test-dictionary test-north test-index test-loader

srcdir=..
include $(srcdir)/Makefile.common

$(OUTDIR)/include/north/$(PLATFORM)-$(BITS)/opcodes.h: $(OUTDIR)/bin/test-dictionary$(EXEC_SUFFIX)
	mkdir -p $(dir $@)
	$(EXEC) $(OUTDIR)/bin/test-dictionary$(EXEC_SUFFIX) 1 > $@

bammer.pop :  $(OUTDIR)/include/north/$(PLATFORM)-$(BITS)/opcodes.h

build: $(foreach n,$(PROGRAMS),$(OUTDIR)/bin/$(n)$(EXEC_SUFFIX)) $(OUTDIR)/bin/bammer.bin
