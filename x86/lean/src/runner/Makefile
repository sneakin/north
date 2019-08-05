PROGRAMS=north-runner

srcdir=../..
include $(srcdir)/Makefile.common

RUNNER=$(OUTDIR)/popped/north-runner.popped

$(RUNNER) : north-runner.pop libc.pop output.pop

ifeq ($(PLATFORM),posix)
$(RUNNER) : mmap.pop map_mmap.pop
else
$(RUNNER) : page_align.pop map_libc.pop
endif

build: $(foreach n,$(PROGRAMS),$(OUTDIR)/bin/$(n)$(EXEC_SUFFIX))
