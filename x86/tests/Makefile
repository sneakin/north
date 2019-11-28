PROGRAMS=test-lone-hello test-hello test-printf test-frames math test-north test-index test-ffi-returns test-bye test-data test-offset-indirect

srcdir=..
include $(srcdir)/Makefile.common

bammer.pop : $(OPCODE_H)

$(OUTDIR)/bin/test-ffi-returns$(EXEC_SUFFIX) : $(OUTDIR)/lib/libtestlib$(SO_SUFFIX)

$(OUTDIR)/lib/libtestlib$(SO_SUFFIX) : $(OUTDIR)/objects/testlib$(OBJ_SUFFIX)

$(OUTDIR)/objects/testlib$(OBJ_SUFFIX) : testlib.c
	mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c -o $@ $<

build: $(foreach n,$(PROGRAMS),$(OUTDIR)/bin/$(n)$(EXEC_SUFFIX)) $(OUTDIR)/bin/bammer.bin
