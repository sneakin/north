CC_windows_32=x86_64-w64-mingw32-gcc
CC_windows_64=x86_64-w64-mingw32-gcc
CC_posix_32=$(CC)
CC_posix_64=$(CC)

srcdir=.

ifndef PLATFORMS
PLATFORMS=posix windows
endif
ifndef BITS
BITS=32 64
endif

PHONY=dir-tests clean

distclean:
	rm -rf $(srcdir)/build

define platform_tasks
all: tests-$1-$2 runner-$1-$2
clean: clean-$1-$2

clean-$1-$2 :
	rm -rf $(srcdir)/build/$1-$2

tests-$1-$2:
	$$(MAKE) -C tests BITS=$2 PLATFORM=$1 CC=$$(CC_$1_$2) all

runner-$1-$2:
	$$(MAKE) -C src/runner BITS=$2 PLATFORM=$1 CC=$$(CC_$1_$2) all

endef

$(foreach platform,$(PLATFORMS),$(foreach bits,$(BITS),$(eval $(call platform_tasks,$(platform),$(bits)))))
