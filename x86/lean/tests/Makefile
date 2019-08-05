PROGRAMS=test-lone-hello test-hello test-printf test-dictionary test-frames math test-north test-index test-loader test-ffi-returns

srcdir=..
include $(srcdir)/Makefile.common

$(OUTDIR)/include/north/$(PLATFORM)-$(BITS)/opcodes.h: $(OUTDIR)/bin/test-dictionary$(EXEC_SUFFIX)
	mkdir -p $(dir $@)
	$(EXEC) $(OUTDIR)/bin/test-dictionary$(EXEC_SUFFIX) 1 > $@

bammer.pop :  $(OUTDIR)/include/north/$(PLATFORM)-$(BITS)/opcodes.h

$(OUTDIR)/bin/test-ffi-returns$(EXEC_SUFFIX) : $(OUTDIR)/lib/libtestlib$(SO_SUFFIX)

$(OUTDIR)/lib/libtestlib$(SO_SUFFIX) : $(OUTDIR)/objects/testlib$(OBJ_SUFFIX)

$(OUTDIR)/objects/testlib$(OBJ_SUFFIX) : testlib.c
	mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c -o $@ $<

build: $(foreach n,$(PROGRAMS),$(OUTDIR)/bin/$(n)$(EXEC_SUFFIX)) $(OUTDIR)/bin/bammer.bin
