North x86
===

Copyright (C) 2019-2022 Nolan Eakins

A binary "Forth" interpreter for x86 writen in NASM assembly and a very very basic reformatter from Forth like definitions to NASM data.

Currently only 32 bit Windows and Linux using libc functions works.

Dependencies
---

* GNU make
* nasm
* Linux
  * 32 bit GCC libs and glibc: on ArchLinux they are `lib32-glibc` and `lib32-gcc-libs`
* Windows
  * msys

Building
---

The Makefile uses a few variables to determine what to build.

* `PLATFORM` can be set to `posix` or `windows`
* `BITS` can `32` or `64`, though 64 bit is incomplete
* `LIBC` can `0` to disable libc calls or `1` to dynamically link and use the libc functions.

Knowing the above, to build for 32 bit Linux using libc: `make PLATFORM=posix BITS=32 LIBC=1`.

Or just run `make` to build everything.

Output files and binaries will be placed under `build/$PLATFORM-$BITS`.

And to remove everything built by running `make clean`.

Running
---

The primary binary is `north-runner`. It executes a binary blob of offset Forth code. The word indexes used can be obtained with `north-words`.

Many test binaries are also built.
