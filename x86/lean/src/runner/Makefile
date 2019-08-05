PROGRAMS=runner

srcdir=../..
include $(srcdir)/Makefile.common

$(OUTDIR)/popped/runner.popped : runner.pop libc.pop output.pop

ifeq ($(PLATFORM),posix)
$(OUTDIR)/popped/runner.popped : mmap.pop map_mmap.pop
else
$(OUTDIR)/popped/runner.popped : page_align.pop map_libc.pop
endif

build: $(foreach n,$(PROGRAMS),$(OUTDIR)/bin/$(n)$(EXEC_SUFFIX))
