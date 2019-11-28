North
===

Nolan's Forth

Copyright (C) 2019 Nolan Eakins

Demo: https://sneakin.github.io/north/

Source code: https://github.com/sneakin/north


Building
---

You will need a POSIX environment like Linux or MSYS, `git`, `node.js`, `ruby`, `rake`, and a web browser.

To build the web site's files:

1. `git submodule --init`
2. `npm install`
3. `export PATH=$(npm bin):$PATH`
4. `rake`

For the native x86 builds:

1. All of the above
2. `rake i32:build i64:build`


Running
---

* To run stage0 with the native interpretter: `rake i32:stage0:run`
* With a web browser: Open `build/runner.html`
* Run Bacaw's `bccon` or development page using one of the BIN files in the build directory.


Credits
===

Under their own licenses:

* [Viznut's Unscii](http://pelulamu.net/unscii/)

