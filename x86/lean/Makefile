MINGW32_CC=i686-w32-mingw32-gcc
MINGW64_CC=x86_64-w64-mingw32-gcc
POSIX32_CC=$(CC)
POSIX64_CC=$(CC)

srcdir=.

PHONY=dir-tests clean

ifdef BITS
all: tests-$(PLATFORM)-$(BITS)
else
all: tests-posix-64 tests-posix-32 tests-windows-64 tests-windows-32
endif

clean:
	rm -rf $(srcdir)/build

tests-posix-32:
	$(MAKE) -C tests BITS=32 PLATFORM=posix CC=$(POSIX32_CC) all

tests-posix-64:
	$(MAKE) -C tests BITS=64 PLATFORM=posix CC=$(POSIX64_CC) all

tests-windows-32:
	$(MAKE) -C tests BITS=32 PLATFORM=windows CC=$(MINGW32_CC) all

tests-windows-64:
	$(MAKE) -C tests BITS=64 PLATFORM=windows CC=$(MINGW64_CC) all
