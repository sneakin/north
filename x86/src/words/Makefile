PROGRAMS=north-words

NORTH_WORDS_MAKEFILE=1

srcdir=../..
include $(srcdir)/Makefile.common

build: $(foreach n,$(PROGRAMS),$(OUTDIR)/bin/$(n)$(EXEC_SUFFIX)) $(OPCODE_H)
