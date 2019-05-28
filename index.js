(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*

The MIT License (MIT)

Original Library
  - Copyright (c) Marak Squires

Additional functionality
 - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var colors = {};
module['exports'] = colors;

colors.themes = {};

var util = require('util');
var ansiStyles = colors.styles = require('./styles');
var defineProps = Object.defineProperties;
var newLineRegex = new RegExp(/[\r\n]+/g);

colors.supportsColor = require('./system/supports-colors').supportsColor;

if (typeof colors.enabled === 'undefined') {
  colors.enabled = colors.supportsColor() !== false;
}

colors.enable = function() {
  colors.enabled = true;
};

colors.disable = function() {
  colors.enabled = false;
};

colors.stripColors = colors.strip = function(str) {
  return ('' + str).replace(/\x1B\[\d+m/g, '');
};

// eslint-disable-next-line no-unused-vars
var stylize = colors.stylize = function stylize(str, style) {
  if (!colors.enabled) {
    return str+'';
  }

  return ansiStyles[style].open + str + ansiStyles[style].close;
};

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
var escapeStringRegexp = function(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe, '\\$&');
};

function build(_styles) {
  var builder = function builder() {
    return applyStyle.apply(builder, arguments);
  };
  builder._styles = _styles;
  // __proto__ is used because we must return a function, but there is
  // no way to create a function with a different prototype.
  builder.__proto__ = proto;
  return builder;
}

var styles = (function() {
  var ret = {};
  ansiStyles.grey = ansiStyles.gray;
  Object.keys(ansiStyles).forEach(function(key) {
    ansiStyles[key].closeRe =
      new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
    ret[key] = {
      get: function() {
        return build(this._styles.concat(key));
      },
    };
  });
  return ret;
})();

var proto = defineProps(function colors() {}, styles);

function applyStyle() {
  var args = Array.prototype.slice.call(arguments);

  var str = args.map(function(arg) {
    if (arg !== undefined && arg.constructor === String) {
      return arg;
    } else {
      return util.inspect(arg);
    }
  }).join(' ');

  if (!colors.enabled || !str) {
    return str;
  }

  var newLinesPresent = str.indexOf('\n') != -1;

  var nestedStyles = this._styles;

  var i = nestedStyles.length;
  while (i--) {
    var code = ansiStyles[nestedStyles[i]];
    str = code.open + str.replace(code.closeRe, code.open) + code.close;
    if (newLinesPresent) {
      str = str.replace(newLineRegex, function(match) {
        return code.close + match + code.open;
      });
    }
  }

  return str;
}

colors.setTheme = function(theme) {
  if (typeof theme === 'string') {
    console.log('colors.setTheme now only accepts an object, not a string.  ' +
      'If you are trying to set a theme from a file, it is now your (the ' +
      'caller\'s) responsibility to require the file.  The old syntax ' +
      'looked like colors.setTheme(__dirname + ' +
      '\'/../themes/generic-logging.js\'); The new syntax looks like '+
      'colors.setTheme(require(__dirname + ' +
      '\'/../themes/generic-logging.js\'));');
    return;
  }
  for (var style in theme) {
    (function(style) {
      colors[style] = function(str) {
        if (typeof theme[style] === 'object') {
          var out = str;
          for (var i in theme[style]) {
            out = colors[theme[style][i]](out);
          }
          return out;
        }
        return colors[theme[style]](str);
      };
    })(style);
  }
};

function init() {
  var ret = {};
  Object.keys(styles).forEach(function(name) {
    ret[name] = {
      get: function() {
        return build([name]);
      },
    };
  });
  return ret;
}

var sequencer = function sequencer(map, str) {
  var exploded = str.split('');
  exploded = exploded.map(map);
  return exploded.join('');
};

// custom formatter methods
colors.trap = require('./custom/trap');
colors.zalgo = require('./custom/zalgo');

// maps
colors.maps = {};
colors.maps.america = require('./maps/america')(colors);
colors.maps.zebra = require('./maps/zebra')(colors);
colors.maps.rainbow = require('./maps/rainbow')(colors);
colors.maps.random = require('./maps/random')(colors);

for (var map in colors.maps) {
  (function(map) {
    colors[map] = function(str) {
      return sequencer(colors.maps[map], str);
    };
  })(map);
}

defineProps(colors, init());

},{"./custom/trap":2,"./custom/zalgo":3,"./maps/america":4,"./maps/rainbow":5,"./maps/random":6,"./maps/zebra":7,"./styles":8,"./system/supports-colors":10,"util":115}],2:[function(require,module,exports){
module['exports'] = function runTheTrap(text, options) {
  var result = '';
  text = text || 'Run the trap, drop the bass';
  text = text.split('');
  var trap = {
    a: ['\u0040', '\u0104', '\u023a', '\u0245', '\u0394', '\u039b', '\u0414'],
    b: ['\u00df', '\u0181', '\u0243', '\u026e', '\u03b2', '\u0e3f'],
    c: ['\u00a9', '\u023b', '\u03fe'],
    d: ['\u00d0', '\u018a', '\u0500', '\u0501', '\u0502', '\u0503'],
    e: ['\u00cb', '\u0115', '\u018e', '\u0258', '\u03a3', '\u03be', '\u04bc',
      '\u0a6c'],
    f: ['\u04fa'],
    g: ['\u0262'],
    h: ['\u0126', '\u0195', '\u04a2', '\u04ba', '\u04c7', '\u050a'],
    i: ['\u0f0f'],
    j: ['\u0134'],
    k: ['\u0138', '\u04a0', '\u04c3', '\u051e'],
    l: ['\u0139'],
    m: ['\u028d', '\u04cd', '\u04ce', '\u0520', '\u0521', '\u0d69'],
    n: ['\u00d1', '\u014b', '\u019d', '\u0376', '\u03a0', '\u048a'],
    o: ['\u00d8', '\u00f5', '\u00f8', '\u01fe', '\u0298', '\u047a', '\u05dd',
      '\u06dd', '\u0e4f'],
    p: ['\u01f7', '\u048e'],
    q: ['\u09cd'],
    r: ['\u00ae', '\u01a6', '\u0210', '\u024c', '\u0280', '\u042f'],
    s: ['\u00a7', '\u03de', '\u03df', '\u03e8'],
    t: ['\u0141', '\u0166', '\u0373'],
    u: ['\u01b1', '\u054d'],
    v: ['\u05d8'],
    w: ['\u0428', '\u0460', '\u047c', '\u0d70'],
    x: ['\u04b2', '\u04fe', '\u04fc', '\u04fd'],
    y: ['\u00a5', '\u04b0', '\u04cb'],
    z: ['\u01b5', '\u0240'],
  };
  text.forEach(function(c) {
    c = c.toLowerCase();
    var chars = trap[c] || [' '];
    var rand = Math.floor(Math.random() * chars.length);
    if (typeof trap[c] !== 'undefined') {
      result += trap[c][rand];
    } else {
      result += c;
    }
  });
  return result;
};

},{}],3:[function(require,module,exports){
// please no
module['exports'] = function zalgo(text, options) {
  text = text || '   he is here   ';
  var soul = {
    'up': [
      '̍', '̎', '̄', '̅',
      '̿', '̑', '̆', '̐',
      '͒', '͗', '͑', '̇',
      '̈', '̊', '͂', '̓',
      '̈', '͊', '͋', '͌',
      '̃', '̂', '̌', '͐',
      '̀', '́', '̋', '̏',
      '̒', '̓', '̔', '̽',
      '̉', 'ͣ', 'ͤ', 'ͥ',
      'ͦ', 'ͧ', 'ͨ', 'ͩ',
      'ͪ', 'ͫ', 'ͬ', 'ͭ',
      'ͮ', 'ͯ', '̾', '͛',
      '͆', '̚',
    ],
    'down': [
      '̖', '̗', '̘', '̙',
      '̜', '̝', '̞', '̟',
      '̠', '̤', '̥', '̦',
      '̩', '̪', '̫', '̬',
      '̭', '̮', '̯', '̰',
      '̱', '̲', '̳', '̹',
      '̺', '̻', '̼', 'ͅ',
      '͇', '͈', '͉', '͍',
      '͎', '͓', '͔', '͕',
      '͖', '͙', '͚', '̣',
    ],
    'mid': [
      '̕', '̛', '̀', '́',
      '͘', '̡', '̢', '̧',
      '̨', '̴', '̵', '̶',
      '͜', '͝', '͞',
      '͟', '͠', '͢', '̸',
      '̷', '͡', ' ҉',
    ],
  };
  var all = [].concat(soul.up, soul.down, soul.mid);

  function randomNumber(range) {
    var r = Math.floor(Math.random() * range);
    return r;
  }

  function isChar(character) {
    var bool = false;
    all.filter(function(i) {
      bool = (i === character);
    });
    return bool;
  }


  function heComes(text, options) {
    var result = '';
    var counts;
    var l;
    options = options || {};
    options['up'] =
      typeof options['up'] !== 'undefined' ? options['up'] : true;
    options['mid'] =
      typeof options['mid'] !== 'undefined' ? options['mid'] : true;
    options['down'] =
      typeof options['down'] !== 'undefined' ? options['down'] : true;
    options['size'] =
      typeof options['size'] !== 'undefined' ? options['size'] : 'maxi';
    text = text.split('');
    for (l in text) {
      if (isChar(l)) {
        continue;
      }
      result = result + text[l];
      counts = {'up': 0, 'down': 0, 'mid': 0};
      switch (options.size) {
        case 'mini':
          counts.up = randomNumber(8);
          counts.mid = randomNumber(2);
          counts.down = randomNumber(8);
          break;
        case 'maxi':
          counts.up = randomNumber(16) + 3;
          counts.mid = randomNumber(4) + 1;
          counts.down = randomNumber(64) + 3;
          break;
        default:
          counts.up = randomNumber(8) + 1;
          counts.mid = randomNumber(6) / 2;
          counts.down = randomNumber(8) + 1;
          break;
      }

      var arr = ['up', 'mid', 'down'];
      for (var d in arr) {
        var index = arr[d];
        for (var i = 0; i <= counts[index]; i++) {
          if (options[index]) {
            result = result + soul[index][randomNumber(soul[index].length)];
          }
        }
      }
    }
    return result;
  }
  // don't summon him
  return heComes(text, options);
};


},{}],4:[function(require,module,exports){
module['exports'] = function(colors) {
  return function(letter, i, exploded) {
    if (letter === ' ') return letter;
    switch (i%3) {
      case 0: return colors.red(letter);
      case 1: return colors.white(letter);
      case 2: return colors.blue(letter);
    }
  };
};

},{}],5:[function(require,module,exports){
module['exports'] = function(colors) {
  // RoY G BiV
  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta'];
  return function(letter, i, exploded) {
    if (letter === ' ') {
      return letter;
    } else {
      return colors[rainbowColors[i++ % rainbowColors.length]](letter);
    }
  };
};


},{}],6:[function(require,module,exports){
module['exports'] = function(colors) {
  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green',
    'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === ' ' ? letter :
      colors[
          available[Math.round(Math.random() * (available.length - 2))]
      ](letter);
  };
};

},{}],7:[function(require,module,exports){
module['exports'] = function(colors) {
  return function(letter, i, exploded) {
    return i % 2 === 0 ? letter : colors.inverse(letter);
  };
};

},{}],8:[function(require,module,exports){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var styles = {};
module['exports'] = styles;

var codes = {
  reset: [0, 0],

  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],

  // legacy styles for colors pre v1.0.0
  blackBG: [40, 49],
  redBG: [41, 49],
  greenBG: [42, 49],
  yellowBG: [43, 49],
  blueBG: [44, 49],
  magentaBG: [45, 49],
  cyanBG: [46, 49],
  whiteBG: [47, 49],

};

Object.keys(codes).forEach(function(key) {
  var val = codes[key];
  var style = styles[key] = [];
  style.open = '\u001b[' + val[0] + 'm';
  style.close = '\u001b[' + val[1] + 'm';
});

},{}],9:[function(require,module,exports){
(function (process){
/*
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

module.exports = function(flag, argv) {
  argv = argv || process.argv;

  var terminatorPos = argv.indexOf('--');
  var prefix = /^-{1,2}/.test(flag) ? '' : '--';
  var pos = argv.indexOf(prefix + flag);

  return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

}).call(this,require('_process'))
},{"_process":113}],10:[function(require,module,exports){
(function (process){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

'use strict';

var os = require('os');
var hasFlag = require('./has-flag.js');

var env = process.env;

var forceColor = void 0;
if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false')) {
  forceColor = false;
} else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true')
           || hasFlag('color=always')) {
  forceColor = true;
}
if ('FORCE_COLOR' in env) {
  forceColor = env.FORCE_COLOR.length === 0
    || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
  if (level === 0) {
    return false;
  }

  return {
    level: level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3,
  };
}

function supportsColor(stream) {
  if (forceColor === false) {
    return 0;
  }

  if (hasFlag('color=16m') || hasFlag('color=full')
      || hasFlag('color=truecolor')) {
    return 3;
  }

  if (hasFlag('color=256')) {
    return 2;
  }

  if (stream && !stream.isTTY && forceColor !== true) {
    return 0;
  }

  var min = forceColor ? 1 : 0;

  if (process.platform === 'win32') {
    // Node.js 7.5.0 is the first version of Node.js to include a patch to
    // libuv that enables 256 color output on Windows. Anything earlier and it
    // won't work. However, here we target Node.js 8 at minimum as it is an LTS
    // release, and Node.js 7 is not. Windows 10 build 10586 is the first
    // Windows release that supports 256 colors. Windows 10 build 14931 is the
    // first release that supports 16m/TrueColor.
    var osRelease = os.release().split('.');
    if (Number(process.versions.node.split('.')[0]) >= 8
        && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }

    return 1;
  }

  if ('CI' in env) {
    if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(function(sign) {
      return sign in env;
    }) || env.CI_NAME === 'codeship') {
      return 1;
    }

    return min;
  }

  if ('TEAMCITY_VERSION' in env) {
    return (/^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0
    );
  }

  if ('TERM_PROGRAM' in env) {
    var version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

    switch (env.TERM_PROGRAM) {
      case 'iTerm.app':
        return version >= 3 ? 3 : 2;
      case 'Hyper':
        return 3;
      case 'Apple_Terminal':
        return 2;
      // No default
    }
  }

  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }

  if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }

  if ('COLORTERM' in env) {
    return 1;
  }

  if (env.TERM === 'dumb') {
    return min;
  }

  return min;
}

function getSupportLevel(stream) {
  var level = supportsColor(stream);
  return translateLevel(level);
}

module.exports = {
  supportsColor: getSupportLevel,
  stdout: getSupportLevel(process.stdout),
  stderr: getSupportLevel(process.stderr),
};

}).call(this,require('_process'))
},{"./has-flag.js":9,"_process":113,"os":112}],11:[function(require,module,exports){
//
// Remark: Requiring this file will use the "safe" colors API,
// which will not touch String.prototype.
//
//   var colors = require('colors/safe');
//   colors.red("foo")
//
//
var colors = require('./lib/colors');
module['exports'] = colors;

},{"./lib/colors":1}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Strings = require("./Strings");
var Browser_1 = require("./shared/utils/Browser");
var RenderDebouncer_1 = require("./ui/RenderDebouncer");
var Lifecycle_1 = require("./ui/Lifecycle");
var Lifecycle_2 = require("./common/Lifecycle");
var MAX_ROWS_TO_READ = 20;
var AccessibilityManager = (function (_super) {
    __extends(AccessibilityManager, _super);
    function AccessibilityManager(_terminal) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._liveRegionLineCount = 0;
        _this._charsToConsume = [];
        _this._accessibilityTreeRoot = document.createElement('div');
        _this._accessibilityTreeRoot.classList.add('xterm-accessibility');
        _this._rowContainer = document.createElement('div');
        _this._rowContainer.classList.add('xterm-accessibility-tree');
        _this._rowElements = [];
        for (var i = 0; i < _this._terminal.rows; i++) {
            _this._rowElements[i] = _this._createAccessibilityTreeNode();
            _this._rowContainer.appendChild(_this._rowElements[i]);
        }
        _this._topBoundaryFocusListener = function (e) { return _this._onBoundaryFocus(e, 0); };
        _this._bottomBoundaryFocusListener = function (e) { return _this._onBoundaryFocus(e, 1); };
        _this._rowElements[0].addEventListener('focus', _this._topBoundaryFocusListener);
        _this._rowElements[_this._rowElements.length - 1].addEventListener('focus', _this._bottomBoundaryFocusListener);
        _this._refreshRowsDimensions();
        _this._accessibilityTreeRoot.appendChild(_this._rowContainer);
        _this._renderRowsDebouncer = new RenderDebouncer_1.RenderDebouncer(_this._terminal, _this._renderRows.bind(_this));
        _this._refreshRows();
        _this._liveRegion = document.createElement('div');
        _this._liveRegion.classList.add('live-region');
        _this._liveRegion.setAttribute('aria-live', 'assertive');
        _this._accessibilityTreeRoot.appendChild(_this._liveRegion);
        _this._terminal.element.insertAdjacentElement('afterbegin', _this._accessibilityTreeRoot);
        _this.register(_this._renderRowsDebouncer);
        _this.register(_this._terminal.addDisposableListener('resize', function (data) { return _this._onResize(data.rows); }));
        _this.register(_this._terminal.addDisposableListener('refresh', function (data) { return _this._refreshRows(data.start, data.end); }));
        _this.register(_this._terminal.addDisposableListener('scroll', function (data) { return _this._refreshRows(); }));
        _this.register(_this._terminal.addDisposableListener('a11y.char', function (char) { return _this._onChar(char); }));
        _this.register(_this._terminal.addDisposableListener('linefeed', function () { return _this._onChar('\n'); }));
        _this.register(_this._terminal.addDisposableListener('a11y.tab', function (spaceCount) { return _this._onTab(spaceCount); }));
        _this.register(_this._terminal.addDisposableListener('key', function (keyChar) { return _this._onKey(keyChar); }));
        _this.register(_this._terminal.addDisposableListener('blur', function () { return _this._clearLiveRegion(); }));
        _this.register(_this._terminal.addDisposableListener('dprchange', function () { return _this._refreshRowsDimensions(); }));
        _this.register(_this._terminal.renderer.addDisposableListener('resize', function () { return _this._refreshRowsDimensions(); }));
        _this.register(Lifecycle_1.addDisposableDomListener(window, 'resize', function () { return _this._refreshRowsDimensions(); }));
        return _this;
    }
    AccessibilityManager.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._terminal.element.removeChild(this._accessibilityTreeRoot);
        this._rowElements.length = 0;
    };
    AccessibilityManager.prototype._onBoundaryFocus = function (e, position) {
        var boundaryElement = e.target;
        var beforeBoundaryElement = this._rowElements[position === 0 ? 1 : this._rowElements.length - 2];
        var posInSet = boundaryElement.getAttribute('aria-posinset');
        var lastRowPos = position === 0 ? '1' : "" + this._terminal.buffer.lines.length;
        if (posInSet === lastRowPos) {
            return;
        }
        if (e.relatedTarget !== beforeBoundaryElement) {
            return;
        }
        var topBoundaryElement;
        var bottomBoundaryElement;
        if (position === 0) {
            topBoundaryElement = boundaryElement;
            bottomBoundaryElement = this._rowElements.pop();
            this._rowContainer.removeChild(bottomBoundaryElement);
        }
        else {
            topBoundaryElement = this._rowElements.shift();
            bottomBoundaryElement = boundaryElement;
            this._rowContainer.removeChild(topBoundaryElement);
        }
        topBoundaryElement.removeEventListener('focus', this._topBoundaryFocusListener);
        bottomBoundaryElement.removeEventListener('focus', this._bottomBoundaryFocusListener);
        if (position === 0) {
            var newElement = this._createAccessibilityTreeNode();
            this._rowElements.unshift(newElement);
            this._rowContainer.insertAdjacentElement('afterbegin', newElement);
        }
        else {
            var newElement = this._createAccessibilityTreeNode();
            this._rowElements.push(newElement);
            this._rowContainer.appendChild(newElement);
        }
        this._rowElements[0].addEventListener('focus', this._topBoundaryFocusListener);
        this._rowElements[this._rowElements.length - 1].addEventListener('focus', this._bottomBoundaryFocusListener);
        this._terminal.scrollLines(position === 0 ? -1 : 1);
        this._rowElements[position === 0 ? 1 : this._rowElements.length - 2].focus();
        e.preventDefault();
        e.stopImmediatePropagation();
    };
    AccessibilityManager.prototype._onResize = function (rows) {
        this._rowElements[this._rowElements.length - 1].removeEventListener('focus', this._bottomBoundaryFocusListener);
        for (var i = this._rowContainer.children.length; i < this._terminal.rows; i++) {
            this._rowElements[i] = this._createAccessibilityTreeNode();
            this._rowContainer.appendChild(this._rowElements[i]);
        }
        while (this._rowElements.length > rows) {
            this._rowContainer.removeChild(this._rowElements.pop());
        }
        this._rowElements[this._rowElements.length - 1].addEventListener('focus', this._bottomBoundaryFocusListener);
        this._refreshRowsDimensions();
    };
    AccessibilityManager.prototype._createAccessibilityTreeNode = function () {
        var element = document.createElement('div');
        element.setAttribute('role', 'listitem');
        element.tabIndex = -1;
        this._refreshRowDimensions(element);
        return element;
    };
    AccessibilityManager.prototype._onTab = function (spaceCount) {
        for (var i = 0; i < spaceCount; i++) {
            this._onChar(' ');
        }
    };
    AccessibilityManager.prototype._onChar = function (char) {
        var _this = this;
        if (this._liveRegionLineCount < MAX_ROWS_TO_READ + 1) {
            if (this._charsToConsume.length > 0) {
                var shiftedChar = this._charsToConsume.shift();
                if (shiftedChar !== char) {
                    this._announceCharacter(char);
                }
            }
            else {
                this._announceCharacter(char);
            }
            if (char === '\n') {
                this._liveRegionLineCount++;
                if (this._liveRegionLineCount === MAX_ROWS_TO_READ + 1) {
                    this._liveRegion.textContent += Strings.tooMuchOutput;
                }
            }
            if (Browser_1.isMac) {
                if (this._liveRegion.textContent && this._liveRegion.textContent.length > 0 && !this._liveRegion.parentNode) {
                    setTimeout(function () {
                        _this._accessibilityTreeRoot.appendChild(_this._liveRegion);
                    }, 0);
                }
            }
        }
    };
    AccessibilityManager.prototype._clearLiveRegion = function () {
        this._liveRegion.textContent = '';
        this._liveRegionLineCount = 0;
        if (Browser_1.isMac) {
            if (this._liveRegion.parentNode) {
                this._accessibilityTreeRoot.removeChild(this._liveRegion);
            }
        }
    };
    AccessibilityManager.prototype._onKey = function (keyChar) {
        this._clearLiveRegion();
        this._charsToConsume.push(keyChar);
    };
    AccessibilityManager.prototype._refreshRows = function (start, end) {
        this._renderRowsDebouncer.refresh(start, end);
    };
    AccessibilityManager.prototype._renderRows = function (start, end) {
        var buffer = this._terminal.buffer;
        var setSize = buffer.lines.length.toString();
        for (var i = start; i <= end; i++) {
            var lineData = buffer.translateBufferLineToString(buffer.ydisp + i, true);
            var posInSet = (buffer.ydisp + i + 1).toString();
            var element = this._rowElements[i];
            element.textContent = lineData.length === 0 ? Strings.blankLine : lineData;
            element.setAttribute('aria-posinset', posInSet);
            element.setAttribute('aria-setsize', setSize);
        }
    };
    AccessibilityManager.prototype._refreshRowsDimensions = function () {
        if (!this._terminal.renderer.dimensions.actualCellHeight) {
            return;
        }
        if (this._rowElements.length !== this._terminal.rows) {
            this._onResize(this._terminal.rows);
        }
        for (var i = 0; i < this._terminal.rows; i++) {
            this._refreshRowDimensions(this._rowElements[i]);
        }
    };
    AccessibilityManager.prototype._refreshRowDimensions = function (element) {
        element.style.height = this._terminal.renderer.dimensions.actualCellHeight + "px";
    };
    AccessibilityManager.prototype._announceCharacter = function (char) {
        if (char === ' ') {
            this._liveRegion.innerHTML += '&nbsp;';
        }
        else {
            this._liveRegion.textContent += char;
        }
    };
    return AccessibilityManager;
}(Lifecycle_2.Disposable));
exports.AccessibilityManager = AccessibilityManager;

},{"./Strings":24,"./common/Lifecycle":29,"./shared/utils/Browser":57,"./ui/Lifecycle":59,"./ui/RenderDebouncer":61}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var CircularList_1 = require("./common/CircularList");
var EventEmitter_1 = require("./common/EventEmitter");
var BufferLine_1 = require("./BufferLine");
exports.DEFAULT_ATTR = (0 << 18) | (257 << 9) | (256 << 0);
exports.CHAR_DATA_ATTR_INDEX = 0;
exports.CHAR_DATA_CHAR_INDEX = 1;
exports.CHAR_DATA_WIDTH_INDEX = 2;
exports.CHAR_DATA_CODE_INDEX = 3;
exports.MAX_BUFFER_SIZE = 4294967295;
exports.NULL_CELL_CHAR = ' ';
exports.NULL_CELL_WIDTH = 1;
exports.NULL_CELL_CODE = 32;
var Buffer = (function () {
    function Buffer(_terminal, _hasScrollback) {
        this._terminal = _terminal;
        this._hasScrollback = _hasScrollback;
        this.markers = [];
        this.clear();
    }
    Object.defineProperty(Buffer.prototype, "hasScrollback", {
        get: function () {
            return this._hasScrollback && this.lines.maxLength > this._terminal.rows;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "isCursorInViewport", {
        get: function () {
            var absoluteY = this.ybase + this.y;
            var relativeY = absoluteY - this.ydisp;
            return (relativeY >= 0 && relativeY < this._terminal.rows);
        },
        enumerable: true,
        configurable: true
    });
    Buffer.prototype._getCorrectBufferLength = function (rows) {
        if (!this._hasScrollback) {
            return rows;
        }
        var correctBufferLength = rows + this._terminal.options.scrollback;
        return correctBufferLength > exports.MAX_BUFFER_SIZE ? exports.MAX_BUFFER_SIZE : correctBufferLength;
    };
    Buffer.prototype.fillViewportRows = function () {
        if (this.lines.length === 0) {
            var i = this._terminal.rows;
            while (i--) {
                this.lines.push(BufferLine_1.BufferLine.blankLine(this._terminal.cols, exports.DEFAULT_ATTR));
            }
        }
    };
    Buffer.prototype.clear = function () {
        this.ydisp = 0;
        this.ybase = 0;
        this.y = 0;
        this.x = 0;
        this.lines = new CircularList_1.CircularList(this._getCorrectBufferLength(this._terminal.rows));
        this.scrollTop = 0;
        this.scrollBottom = this._terminal.rows - 1;
        this.setupTabStops();
    };
    Buffer.prototype.resize = function (newCols, newRows) {
        var newMaxLength = this._getCorrectBufferLength(newRows);
        if (newMaxLength > this.lines.maxLength) {
            this.lines.maxLength = newMaxLength;
        }
        if (this.lines.length > 0) {
            if (this._terminal.cols < newCols) {
                var ch = [exports.DEFAULT_ATTR, exports.NULL_CELL_CHAR, exports.NULL_CELL_WIDTH, exports.NULL_CELL_CODE];
                for (var i = 0; i < this.lines.length; i++) {
                    while (this.lines.get(i).length < newCols) {
                        this.lines.get(i).push(ch);
                    }
                }
            }
            var addToY = 0;
            if (this._terminal.rows < newRows) {
                for (var y = this._terminal.rows; y < newRows; y++) {
                    if (this.lines.length < newRows + this.ybase) {
                        if (this.ybase > 0 && this.lines.length <= this.ybase + this.y + addToY + 1) {
                            this.ybase--;
                            addToY++;
                            if (this.ydisp > 0) {
                                this.ydisp--;
                            }
                        }
                        else {
                            this.lines.push(BufferLine_1.BufferLine.blankLine(newCols, exports.DEFAULT_ATTR));
                        }
                    }
                }
            }
            else {
                for (var y = this._terminal.rows; y > newRows; y--) {
                    if (this.lines.length > newRows + this.ybase) {
                        if (this.lines.length > this.ybase + this.y + 1) {
                            this.lines.pop();
                        }
                        else {
                            this.ybase++;
                            this.ydisp++;
                        }
                    }
                }
            }
            if (newMaxLength < this.lines.maxLength) {
                var amountToTrim = this.lines.length - newMaxLength;
                if (amountToTrim > 0) {
                    this.lines.trimStart(amountToTrim);
                    this.ybase = Math.max(this.ybase - amountToTrim, 0);
                    this.ydisp = Math.max(this.ydisp - amountToTrim, 0);
                }
                this.lines.maxLength = newMaxLength;
            }
            this.x = Math.min(this.x, newCols - 1);
            this.y = Math.min(this.y, newRows - 1);
            if (addToY) {
                this.y += addToY;
            }
            this.savedY = Math.min(this.savedY, newRows - 1);
            this.savedX = Math.min(this.savedX, newCols - 1);
            this.scrollTop = 0;
        }
        this.scrollBottom = newRows - 1;
    };
    Buffer.prototype.stringIndexToBufferIndex = function (lineIndex, stringIndex) {
        while (stringIndex) {
            var line = this.lines.get(lineIndex);
            if (!line) {
                [-1, -1];
            }
            for (var i = 0; i < line.length; ++i) {
                stringIndex -= line.get(i)[exports.CHAR_DATA_CHAR_INDEX].length;
                if (stringIndex < 0) {
                    return [lineIndex, i];
                }
            }
            lineIndex++;
        }
        return [lineIndex, 0];
    };
    Buffer.prototype.translateBufferLineToString = function (lineIndex, trimRight, startCol, endCol) {
        if (startCol === void 0) { startCol = 0; }
        if (endCol === void 0) { endCol = null; }
        var lineString = '';
        var line = this.lines.get(lineIndex);
        if (!line) {
            return '';
        }
        var startIndex = startCol;
        if (endCol === null) {
            endCol = line.length;
        }
        var endIndex = endCol;
        for (var i = 0; i < line.length; i++) {
            var char = line.get(i);
            lineString += char[exports.CHAR_DATA_CHAR_INDEX];
            if (char[exports.CHAR_DATA_WIDTH_INDEX] === 0) {
                if (startCol >= i) {
                    startIndex--;
                }
                if (endCol > i) {
                    endIndex--;
                }
            }
            else {
                if (char[exports.CHAR_DATA_CHAR_INDEX].length > 1) {
                    if (startCol > i) {
                        startIndex += char[exports.CHAR_DATA_CHAR_INDEX].length - 1;
                    }
                    if (endCol > i) {
                        endIndex += char[exports.CHAR_DATA_CHAR_INDEX].length - 1;
                    }
                }
            }
        }
        if (trimRight) {
            var rightWhitespaceIndex = lineString.search(/\s+$/);
            if (rightWhitespaceIndex !== -1) {
                endIndex = Math.min(endIndex, rightWhitespaceIndex);
            }
            if (endIndex <= startIndex) {
                return '';
            }
        }
        return lineString.substring(startIndex, endIndex);
    };
    Buffer.prototype.getWrappedRangeForLine = function (y) {
        var first = y;
        var last = y;
        while (first > 0 && this.lines.get(first).isWrapped) {
            first--;
        }
        while (last + 1 < this.lines.length && this.lines.get(last + 1).isWrapped) {
            last++;
        }
        return { first: first, last: last };
    };
    Buffer.prototype.setupTabStops = function (i) {
        if (i !== null && i !== undefined) {
            if (!this.tabs[i]) {
                i = this.prevStop(i);
            }
        }
        else {
            this.tabs = {};
            i = 0;
        }
        for (; i < this._terminal.cols; i += this._terminal.options.tabStopWidth) {
            this.tabs[i] = true;
        }
    };
    Buffer.prototype.prevStop = function (x) {
        if (x === null || x === undefined) {
            x = this.x;
        }
        while (!this.tabs[--x] && x > 0)
            ;
        return x >= this._terminal.cols ? this._terminal.cols - 1 : x < 0 ? 0 : x;
    };
    Buffer.prototype.nextStop = function (x) {
        if (x === null || x === undefined) {
            x = this.x;
        }
        while (!this.tabs[++x] && x < this._terminal.cols)
            ;
        return x >= this._terminal.cols ? this._terminal.cols - 1 : x < 0 ? 0 : x;
    };
    Buffer.prototype.addMarker = function (y) {
        var _this = this;
        var marker = new Marker(y);
        this.markers.push(marker);
        marker.register(this.lines.addDisposableListener('trim', function (amount) {
            marker.line -= amount;
            if (marker.line < 0) {
                marker.dispose();
            }
        }));
        marker.register(marker.addDisposableListener('dispose', function () { return _this._removeMarker(marker); }));
        return marker;
    };
    Buffer.prototype._removeMarker = function (marker) {
        this.markers.splice(this.markers.indexOf(marker), 1);
    };
    Buffer.prototype.iterator = function (trimRight, startIndex, endIndex, startOverscan, endOverscan) {
        return new BufferStringIterator(this, trimRight, startIndex, endIndex, startOverscan, endOverscan);
    };
    return Buffer;
}());
exports.Buffer = Buffer;
var Marker = (function (_super) {
    __extends(Marker, _super);
    function Marker(line) {
        var _this = _super.call(this) || this;
        _this.line = line;
        _this._id = Marker._nextId++;
        _this.isDisposed = false;
        return _this;
    }
    Object.defineProperty(Marker.prototype, "id", {
        get: function () { return this._id; },
        enumerable: true,
        configurable: true
    });
    Marker.prototype.dispose = function () {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true;
        this.emit('dispose');
        _super.prototype.dispose.call(this);
    };
    Marker._nextId = 1;
    return Marker;
}(EventEmitter_1.EventEmitter));
exports.Marker = Marker;
var BufferStringIterator = (function () {
    function BufferStringIterator(_buffer, _trimRight, _startIndex, _endIndex, _startOverscan, _endOverscan) {
        if (_startIndex === void 0) { _startIndex = 0; }
        if (_endIndex === void 0) { _endIndex = _buffer.lines.length; }
        if (_startOverscan === void 0) { _startOverscan = 0; }
        if (_endOverscan === void 0) { _endOverscan = 0; }
        this._buffer = _buffer;
        this._trimRight = _trimRight;
        this._startIndex = _startIndex;
        this._endIndex = _endIndex;
        this._startOverscan = _startOverscan;
        this._endOverscan = _endOverscan;
        if (this._startIndex < 0) {
            this._startIndex = 0;
        }
        if (this._endIndex > this._buffer.lines.length) {
            this._endIndex = this._buffer.lines.length;
        }
        this._current = this._startIndex;
    }
    BufferStringIterator.prototype.hasNext = function () {
        return this._current < this._endIndex;
    };
    BufferStringIterator.prototype.next = function () {
        var range = this._buffer.getWrappedRangeForLine(this._current);
        if (range.first < this._startIndex - this._startOverscan) {
            range.first = this._startIndex - this._startOverscan;
        }
        if (range.last > this._endIndex + this._endOverscan) {
            range.last = this._endIndex + this._endOverscan;
        }
        range.first = Math.max(range.first, 0);
        range.last = Math.min(range.last, this._buffer.lines.length);
        var result = '';
        for (var i = range.first; i <= range.last; ++i) {
            result += this._buffer.translateBufferLineToString(i, (this._trimRight) ? i === range.last : false);
        }
        this._current = range.last + 1;
        return { range: range, content: result };
    };
    return BufferStringIterator;
}());
exports.BufferStringIterator = BufferStringIterator;

},{"./BufferLine":14,"./common/CircularList":27,"./common/EventEmitter":28}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("./Buffer");
var BufferLine = (function () {
    function BufferLine(cols, ch, isWrapped) {
        this.isWrapped = false;
        this._data = [];
        this.length = this._data.length;
        if (cols) {
            if (!ch) {
                ch = [0, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE];
            }
            for (var i = 0; i < cols; i++) {
                this.push(ch);
            }
        }
        if (isWrapped) {
            this.isWrapped = true;
        }
    }
    BufferLine.blankLine = function (cols, attr, isWrapped) {
        var ch = [attr, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE];
        return new BufferLine(cols, ch, isWrapped);
    };
    BufferLine.prototype.get = function (index) {
        return this._data[index];
    };
    BufferLine.prototype.set = function (index, data) {
        this._data[index] = data;
    };
    BufferLine.prototype.pop = function () {
        var data = this._data.pop();
        this.length = this._data.length;
        return data;
    };
    BufferLine.prototype.push = function (data) {
        this._data.push(data);
        this.length = this._data.length;
    };
    BufferLine.prototype.splice = function (start, deleteCount) {
        var items = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            items[_i - 2] = arguments[_i];
        }
        var _a;
        var removed = (_a = this._data).splice.apply(_a, [start, deleteCount].concat(items));
        this.length = this._data.length;
        return removed;
    };
    BufferLine.prototype.insertCells = function (pos, n, ch) {
        while (n--) {
            this.splice(pos, 0, ch);
            this.pop();
        }
    };
    BufferLine.prototype.deleteCells = function (pos, n, fill) {
        while (n--) {
            this.splice(pos, 1);
            this.push(fill);
        }
    };
    BufferLine.prototype.replaceCells = function (start, end, fill) {
        while (start < end && start < this.length) {
            this.set(start++, fill);
        }
    };
    return BufferLine;
}());
exports.BufferLine = BufferLine;

},{"./Buffer":13}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("./Buffer");
var EventEmitter_1 = require("./common/EventEmitter");
var BufferSet = (function (_super) {
    __extends(BufferSet, _super);
    function BufferSet(_terminal) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._normal = new Buffer_1.Buffer(_this._terminal, true);
        _this._normal.fillViewportRows();
        _this._alt = new Buffer_1.Buffer(_this._terminal, false);
        _this._activeBuffer = _this._normal;
        _this.setupTabStops();
        return _this;
    }
    Object.defineProperty(BufferSet.prototype, "alt", {
        get: function () {
            return this._alt;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BufferSet.prototype, "active", {
        get: function () {
            return this._activeBuffer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BufferSet.prototype, "normal", {
        get: function () {
            return this._normal;
        },
        enumerable: true,
        configurable: true
    });
    BufferSet.prototype.activateNormalBuffer = function () {
        if (this._activeBuffer === this._normal) {
            return;
        }
        this._alt.clear();
        this._activeBuffer = this._normal;
        this.emit('activate', {
            activeBuffer: this._normal,
            inactiveBuffer: this._alt
        });
    };
    BufferSet.prototype.activateAltBuffer = function () {
        if (this._activeBuffer === this._alt) {
            return;
        }
        this._alt.fillViewportRows();
        this._activeBuffer = this._alt;
        this.emit('activate', {
            activeBuffer: this._alt,
            inactiveBuffer: this._normal
        });
    };
    BufferSet.prototype.resize = function (newCols, newRows) {
        this._normal.resize(newCols, newRows);
        this._alt.resize(newCols, newRows);
    };
    BufferSet.prototype.setupTabStops = function (i) {
        this._normal.setupTabStops(i);
        this._alt.setupTabStops(i);
    };
    return BufferSet;
}(EventEmitter_1.EventEmitter));
exports.BufferSet = BufferSet;

},{"./Buffer":13,"./common/EventEmitter":28}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wcwidth = (function (opts) {
    var COMBINING_BMP = [
        [0x0300, 0x036F], [0x0483, 0x0486], [0x0488, 0x0489],
        [0x0591, 0x05BD], [0x05BF, 0x05BF], [0x05C1, 0x05C2],
        [0x05C4, 0x05C5], [0x05C7, 0x05C7], [0x0600, 0x0603],
        [0x0610, 0x0615], [0x064B, 0x065E], [0x0670, 0x0670],
        [0x06D6, 0x06E4], [0x06E7, 0x06E8], [0x06EA, 0x06ED],
        [0x070F, 0x070F], [0x0711, 0x0711], [0x0730, 0x074A],
        [0x07A6, 0x07B0], [0x07EB, 0x07F3], [0x0901, 0x0902],
        [0x093C, 0x093C], [0x0941, 0x0948], [0x094D, 0x094D],
        [0x0951, 0x0954], [0x0962, 0x0963], [0x0981, 0x0981],
        [0x09BC, 0x09BC], [0x09C1, 0x09C4], [0x09CD, 0x09CD],
        [0x09E2, 0x09E3], [0x0A01, 0x0A02], [0x0A3C, 0x0A3C],
        [0x0A41, 0x0A42], [0x0A47, 0x0A48], [0x0A4B, 0x0A4D],
        [0x0A70, 0x0A71], [0x0A81, 0x0A82], [0x0ABC, 0x0ABC],
        [0x0AC1, 0x0AC5], [0x0AC7, 0x0AC8], [0x0ACD, 0x0ACD],
        [0x0AE2, 0x0AE3], [0x0B01, 0x0B01], [0x0B3C, 0x0B3C],
        [0x0B3F, 0x0B3F], [0x0B41, 0x0B43], [0x0B4D, 0x0B4D],
        [0x0B56, 0x0B56], [0x0B82, 0x0B82], [0x0BC0, 0x0BC0],
        [0x0BCD, 0x0BCD], [0x0C3E, 0x0C40], [0x0C46, 0x0C48],
        [0x0C4A, 0x0C4D], [0x0C55, 0x0C56], [0x0CBC, 0x0CBC],
        [0x0CBF, 0x0CBF], [0x0CC6, 0x0CC6], [0x0CCC, 0x0CCD],
        [0x0CE2, 0x0CE3], [0x0D41, 0x0D43], [0x0D4D, 0x0D4D],
        [0x0DCA, 0x0DCA], [0x0DD2, 0x0DD4], [0x0DD6, 0x0DD6],
        [0x0E31, 0x0E31], [0x0E34, 0x0E3A], [0x0E47, 0x0E4E],
        [0x0EB1, 0x0EB1], [0x0EB4, 0x0EB9], [0x0EBB, 0x0EBC],
        [0x0EC8, 0x0ECD], [0x0F18, 0x0F19], [0x0F35, 0x0F35],
        [0x0F37, 0x0F37], [0x0F39, 0x0F39], [0x0F71, 0x0F7E],
        [0x0F80, 0x0F84], [0x0F86, 0x0F87], [0x0F90, 0x0F97],
        [0x0F99, 0x0FBC], [0x0FC6, 0x0FC6], [0x102D, 0x1030],
        [0x1032, 0x1032], [0x1036, 0x1037], [0x1039, 0x1039],
        [0x1058, 0x1059], [0x1160, 0x11FF], [0x135F, 0x135F],
        [0x1712, 0x1714], [0x1732, 0x1734], [0x1752, 0x1753],
        [0x1772, 0x1773], [0x17B4, 0x17B5], [0x17B7, 0x17BD],
        [0x17C6, 0x17C6], [0x17C9, 0x17D3], [0x17DD, 0x17DD],
        [0x180B, 0x180D], [0x18A9, 0x18A9], [0x1920, 0x1922],
        [0x1927, 0x1928], [0x1932, 0x1932], [0x1939, 0x193B],
        [0x1A17, 0x1A18], [0x1B00, 0x1B03], [0x1B34, 0x1B34],
        [0x1B36, 0x1B3A], [0x1B3C, 0x1B3C], [0x1B42, 0x1B42],
        [0x1B6B, 0x1B73], [0x1DC0, 0x1DCA], [0x1DFE, 0x1DFF],
        [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2063],
        [0x206A, 0x206F], [0x20D0, 0x20EF], [0x302A, 0x302F],
        [0x3099, 0x309A], [0xA806, 0xA806], [0xA80B, 0xA80B],
        [0xA825, 0xA826], [0xFB1E, 0xFB1E], [0xFE00, 0xFE0F],
        [0xFE20, 0xFE23], [0xFEFF, 0xFEFF], [0xFFF9, 0xFFFB]
    ];
    var COMBINING_HIGH = [
        [0x10A01, 0x10A03], [0x10A05, 0x10A06], [0x10A0C, 0x10A0F],
        [0x10A38, 0x10A3A], [0x10A3F, 0x10A3F], [0x1D167, 0x1D169],
        [0x1D173, 0x1D182], [0x1D185, 0x1D18B], [0x1D1AA, 0x1D1AD],
        [0x1D242, 0x1D244], [0xE0001, 0xE0001], [0xE0020, 0xE007F],
        [0xE0100, 0xE01EF]
    ];
    function bisearch(ucs, data) {
        var min = 0;
        var max = data.length - 1;
        var mid;
        if (ucs < data[0][0] || ucs > data[max][1]) {
            return false;
        }
        while (max >= min) {
            mid = (min + max) >> 1;
            if (ucs > data[mid][1]) {
                min = mid + 1;
            }
            else if (ucs < data[mid][0]) {
                max = mid - 1;
            }
            else {
                return true;
            }
        }
        return false;
    }
    function wcwidthBMP(ucs) {
        if (ucs === 0) {
            return opts.nul;
        }
        if (ucs < 32 || (ucs >= 0x7f && ucs < 0xa0)) {
            return opts.control;
        }
        if (bisearch(ucs, COMBINING_BMP)) {
            return 0;
        }
        if (isWideBMP(ucs)) {
            return 2;
        }
        return 1;
    }
    function isWideBMP(ucs) {
        return (ucs >= 0x1100 && (ucs <= 0x115f ||
            ucs === 0x2329 ||
            ucs === 0x232a ||
            (ucs >= 0x2e80 && ucs <= 0xa4cf && ucs !== 0x303f) ||
            (ucs >= 0xac00 && ucs <= 0xd7a3) ||
            (ucs >= 0xf900 && ucs <= 0xfaff) ||
            (ucs >= 0xfe10 && ucs <= 0xfe19) ||
            (ucs >= 0xfe30 && ucs <= 0xfe6f) ||
            (ucs >= 0xff00 && ucs <= 0xff60) ||
            (ucs >= 0xffe0 && ucs <= 0xffe6)));
    }
    function wcwidthHigh(ucs) {
        if (bisearch(ucs, COMBINING_HIGH)) {
            return 0;
        }
        if ((ucs >= 0x20000 && ucs <= 0x2fffd) || (ucs >= 0x30000 && ucs <= 0x3fffd)) {
            return 2;
        }
        return 1;
    }
    var control = opts.control | 0;
    var table = null;
    function initTable() {
        var CODEPOINTS = 65536;
        var BITWIDTH = 2;
        var ITEMSIZE = 32;
        var CONTAINERSIZE = CODEPOINTS * BITWIDTH / ITEMSIZE;
        var CODEPOINTS_PER_ITEM = ITEMSIZE / BITWIDTH;
        table = (typeof Uint32Array === 'undefined')
            ? new Array(CONTAINERSIZE)
            : new Uint32Array(CONTAINERSIZE);
        for (var i = 0; i < CONTAINERSIZE; ++i) {
            var num = 0;
            var pos = CODEPOINTS_PER_ITEM;
            while (pos--) {
                num = (num << 2) | wcwidthBMP(CODEPOINTS_PER_ITEM * i + pos);
            }
            table[i] = num;
        }
        return table;
    }
    return function (num) {
        num = num | 0;
        if (num < 32) {
            return control | 0;
        }
        if (num < 127) {
            return 1;
        }
        var t = table || initTable();
        if (num < 65536) {
            return t[num >> 4] >> ((num & 15) << 1) & 3;
        }
        return wcwidthHigh(num);
    };
})({ nul: 0, control: 0 });
function getStringCellWidth(s) {
    var result = 0;
    for (var i = 0; i < s.length; ++i) {
        var code = s.charCodeAt(i);
        if (0xD800 <= code && code <= 0xDBFF) {
            var low = s.charCodeAt(i + 1);
            if (isNaN(low)) {
                return result;
            }
            code = ((code - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
        }
        if (0xDC00 <= code && code <= 0xDFFF) {
            continue;
        }
        result += exports.wcwidth(code);
    }
    return result;
}
exports.getStringCellWidth = getStringCellWidth;

},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CompositionHelper = (function () {
    function CompositionHelper(_textarea, _compositionView, _terminal) {
        this._textarea = _textarea;
        this._compositionView = _compositionView;
        this._terminal = _terminal;
        this._isComposing = false;
        this._isSendingComposition = false;
        this._compositionPosition = { start: null, end: null };
    }
    CompositionHelper.prototype.compositionstart = function () {
        this._isComposing = true;
        this._compositionPosition.start = this._textarea.value.length;
        this._compositionView.textContent = '';
        this._compositionView.classList.add('active');
    };
    CompositionHelper.prototype.compositionupdate = function (ev) {
        var _this = this;
        this._compositionView.textContent = ev.data;
        this.updateCompositionElements();
        setTimeout(function () {
            _this._compositionPosition.end = _this._textarea.value.length;
        }, 0);
    };
    CompositionHelper.prototype.compositionend = function () {
        this._finalizeComposition(true);
    };
    CompositionHelper.prototype.keydown = function (ev) {
        if (this._isComposing || this._isSendingComposition) {
            if (ev.keyCode === 229) {
                return false;
            }
            else if (ev.keyCode === 16 || ev.keyCode === 17 || ev.keyCode === 18) {
                return false;
            }
            this._finalizeComposition(false);
        }
        if (ev.keyCode === 229) {
            this._handleAnyTextareaChanges();
            return false;
        }
        return true;
    };
    CompositionHelper.prototype._finalizeComposition = function (waitForPropogation) {
        var _this = this;
        this._compositionView.classList.remove('active');
        this._isComposing = false;
        this._clearTextareaPosition();
        if (!waitForPropogation) {
            this._isSendingComposition = false;
            var input = this._textarea.value.substring(this._compositionPosition.start, this._compositionPosition.end);
            this._terminal.handler(input);
        }
        else {
            var currentCompositionPosition_1 = {
                start: this._compositionPosition.start,
                end: this._compositionPosition.end
            };
            this._isSendingComposition = true;
            setTimeout(function () {
                if (_this._isSendingComposition) {
                    _this._isSendingComposition = false;
                    var input = void 0;
                    if (_this._isComposing) {
                        input = _this._textarea.value.substring(currentCompositionPosition_1.start, currentCompositionPosition_1.end);
                    }
                    else {
                        input = _this._textarea.value.substring(currentCompositionPosition_1.start);
                    }
                    _this._terminal.handler(input);
                }
            }, 0);
        }
    };
    CompositionHelper.prototype._handleAnyTextareaChanges = function () {
        var _this = this;
        var oldValue = this._textarea.value;
        setTimeout(function () {
            if (!_this._isComposing) {
                var newValue = _this._textarea.value;
                var diff = newValue.replace(oldValue, '');
                if (diff.length > 0) {
                    _this._terminal.handler(diff);
                }
            }
        }, 0);
    };
    CompositionHelper.prototype.updateCompositionElements = function (dontRecurse) {
        var _this = this;
        if (!this._isComposing) {
            return;
        }
        if (this._terminal.buffer.isCursorInViewport) {
            var cellHeight = Math.ceil(this._terminal.charMeasure.height * this._terminal.options.lineHeight);
            var cursorTop = this._terminal.buffer.y * cellHeight;
            var cursorLeft = this._terminal.buffer.x * this._terminal.charMeasure.width;
            this._compositionView.style.left = cursorLeft + 'px';
            this._compositionView.style.top = cursorTop + 'px';
            this._compositionView.style.height = cellHeight + 'px';
            this._compositionView.style.lineHeight = cellHeight + 'px';
            var compositionViewBounds = this._compositionView.getBoundingClientRect();
            this._textarea.style.left = cursorLeft + 'px';
            this._textarea.style.top = cursorTop + 'px';
            this._textarea.style.width = compositionViewBounds.width + 'px';
            this._textarea.style.height = compositionViewBounds.height + 'px';
            this._textarea.style.lineHeight = compositionViewBounds.height + 'px';
        }
        if (!dontRecurse) {
            setTimeout(function () { return _this.updateCompositionElements(true); }, 0);
        }
    };
    CompositionHelper.prototype._clearTextareaPosition = function () {
        this._textarea.style.left = '';
        this._textarea.style.top = '';
    };
    return CompositionHelper;
}());
exports.CompositionHelper = CompositionHelper;

},{}],18:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Lifecycle_1 = require("./common/Lifecycle");
function r(low, high) {
    var c = high - low;
    var arr = new Array(c);
    while (c--) {
        arr[c] = --high;
    }
    return arr;
}
var TransitionTable = (function () {
    function TransitionTable(length) {
        this.table = (typeof Uint8Array === 'undefined')
            ? new Array(length)
            : new Uint8Array(length);
    }
    TransitionTable.prototype.add = function (code, state, action, next) {
        this.table[state << 8 | code] = ((action | 0) << 4) | ((next === undefined) ? state : next);
    };
    TransitionTable.prototype.addMany = function (codes, state, action, next) {
        for (var i = 0; i < codes.length; i++) {
            this.add(codes[i], state, action, next);
        }
    };
    return TransitionTable;
}());
exports.TransitionTable = TransitionTable;
var PRINTABLES = r(0x20, 0x7f);
var EXECUTABLES = r(0x00, 0x18);
EXECUTABLES.push(0x19);
EXECUTABLES.concat(r(0x1c, 0x20));
var DEFAULT_TRANSITION = 1 << 4 | 0;
exports.VT500_TRANSITION_TABLE = (function () {
    var table = new TransitionTable(4095);
    var states = r(0, 13 + 1);
    var state;
    for (state in states) {
        for (var code = 0; code < 160; ++code) {
            table.add(code, state, 1, 0);
        }
    }
    table.addMany(PRINTABLES, 0, 2, 0);
    for (state in states) {
        table.addMany([0x18, 0x1a, 0x99, 0x9a], state, 3, 0);
        table.addMany(r(0x80, 0x90), state, 3, 0);
        table.addMany(r(0x90, 0x98), state, 3, 0);
        table.add(0x9c, state, 0, 0);
        table.add(0x1b, state, 11, 1);
        table.add(0x9d, state, 4, 8);
        table.addMany([0x98, 0x9e, 0x9f], state, 0, 7);
        table.add(0x9b, state, 11, 3);
        table.add(0x90, state, 11, 9);
    }
    table.addMany(EXECUTABLES, 0, 3, 0);
    table.addMany(EXECUTABLES, 1, 3, 1);
    table.add(0x7f, 1, 0, 1);
    table.addMany(EXECUTABLES, 8, 0, 8);
    table.addMany(EXECUTABLES, 3, 3, 3);
    table.add(0x7f, 3, 0, 3);
    table.addMany(EXECUTABLES, 4, 3, 4);
    table.add(0x7f, 4, 0, 4);
    table.addMany(EXECUTABLES, 6, 3, 6);
    table.addMany(EXECUTABLES, 5, 3, 5);
    table.add(0x7f, 5, 0, 5);
    table.addMany(EXECUTABLES, 2, 3, 2);
    table.add(0x7f, 2, 0, 2);
    table.add(0x5d, 1, 4, 8);
    table.addMany(PRINTABLES, 8, 5, 8);
    table.add(0x7f, 8, 5, 8);
    table.addMany([0x9c, 0x1b, 0x18, 0x1a, 0x07], 8, 6, 0);
    table.addMany(r(0x1c, 0x20), 8, 0, 8);
    table.addMany([0x58, 0x5e, 0x5f], 1, 0, 7);
    table.addMany(PRINTABLES, 7, 0, 7);
    table.addMany(EXECUTABLES, 7, 0, 7);
    table.add(0x9c, 7, 0, 0);
    table.add(0x5b, 1, 11, 3);
    table.addMany(r(0x40, 0x7f), 3, 7, 0);
    table.addMany(r(0x30, 0x3a), 3, 8, 4);
    table.add(0x3b, 3, 8, 4);
    table.addMany([0x3c, 0x3d, 0x3e, 0x3f], 3, 9, 4);
    table.addMany(r(0x30, 0x3a), 4, 8, 4);
    table.add(0x3b, 4, 8, 4);
    table.addMany(r(0x40, 0x7f), 4, 7, 0);
    table.addMany([0x3a, 0x3c, 0x3d, 0x3e, 0x3f], 4, 0, 6);
    table.addMany(r(0x20, 0x40), 6, 0, 6);
    table.add(0x7f, 6, 0, 6);
    table.addMany(r(0x40, 0x7f), 6, 0, 0);
    table.add(0x3a, 3, 0, 6);
    table.addMany(r(0x20, 0x30), 3, 9, 5);
    table.addMany(r(0x20, 0x30), 5, 9, 5);
    table.addMany(r(0x30, 0x40), 5, 0, 6);
    table.addMany(r(0x40, 0x7f), 5, 7, 0);
    table.addMany(r(0x20, 0x30), 4, 9, 5);
    table.addMany(r(0x20, 0x30), 1, 9, 2);
    table.addMany(r(0x20, 0x30), 2, 9, 2);
    table.addMany(r(0x30, 0x7f), 2, 10, 0);
    table.addMany(r(0x30, 0x50), 1, 10, 0);
    table.addMany(r(0x51, 0x58), 1, 10, 0);
    table.addMany([0x59, 0x5a, 0x5c], 1, 10, 0);
    table.addMany(r(0x60, 0x7f), 1, 10, 0);
    table.add(0x50, 1, 11, 9);
    table.addMany(EXECUTABLES, 9, 0, 9);
    table.add(0x7f, 9, 0, 9);
    table.addMany(r(0x1c, 0x20), 9, 0, 9);
    table.addMany(r(0x20, 0x30), 9, 9, 12);
    table.add(0x3a, 9, 0, 11);
    table.addMany(r(0x30, 0x3a), 9, 8, 10);
    table.add(0x3b, 9, 8, 10);
    table.addMany([0x3c, 0x3d, 0x3e, 0x3f], 9, 9, 10);
    table.addMany(EXECUTABLES, 11, 0, 11);
    table.addMany(r(0x20, 0x80), 11, 0, 11);
    table.addMany(r(0x1c, 0x20), 11, 0, 11);
    table.addMany(EXECUTABLES, 10, 0, 10);
    table.add(0x7f, 10, 0, 10);
    table.addMany(r(0x1c, 0x20), 10, 0, 10);
    table.addMany(r(0x30, 0x3a), 10, 8, 10);
    table.add(0x3b, 10, 8, 10);
    table.addMany([0x3a, 0x3c, 0x3d, 0x3e, 0x3f], 10, 0, 11);
    table.addMany(r(0x20, 0x30), 10, 9, 12);
    table.addMany(EXECUTABLES, 12, 0, 12);
    table.add(0x7f, 12, 0, 12);
    table.addMany(r(0x1c, 0x20), 12, 0, 12);
    table.addMany(r(0x20, 0x30), 12, 9, 12);
    table.addMany(r(0x30, 0x40), 12, 0, 11);
    table.addMany(r(0x40, 0x7f), 12, 12, 13);
    table.addMany(r(0x40, 0x7f), 10, 12, 13);
    table.addMany(r(0x40, 0x7f), 9, 12, 13);
    table.addMany(EXECUTABLES, 13, 13, 13);
    table.addMany(PRINTABLES, 13, 13, 13);
    table.add(0x7f, 13, 0, 13);
    table.addMany([0x1b, 0x9c], 13, 14, 0);
    return table;
})();
var DcsDummy = (function () {
    function DcsDummy() {
    }
    DcsDummy.prototype.hook = function (collect, params, flag) { };
    DcsDummy.prototype.put = function (data, start, end) { };
    DcsDummy.prototype.unhook = function () { };
    return DcsDummy;
}());
var EscapeSequenceParser = (function (_super) {
    __extends(EscapeSequenceParser, _super);
    function EscapeSequenceParser(TRANSITIONS) {
        if (TRANSITIONS === void 0) { TRANSITIONS = exports.VT500_TRANSITION_TABLE; }
        var _this = _super.call(this) || this;
        _this.TRANSITIONS = TRANSITIONS;
        _this.initialState = 0;
        _this.currentState = _this.initialState;
        _this._osc = '';
        _this._params = [0];
        _this._collect = '';
        _this._printHandlerFb = function (data, start, end) { };
        _this._executeHandlerFb = function (code) { };
        _this._csiHandlerFb = function (collect, params, flag) { };
        _this._escHandlerFb = function (collect, flag) { };
        _this._oscHandlerFb = function (identifier, data) { };
        _this._dcsHandlerFb = new DcsDummy();
        _this._errorHandlerFb = function (state) { return state; };
        _this._printHandler = _this._printHandlerFb;
        _this._executeHandlers = Object.create(null);
        _this._csiHandlers = Object.create(null);
        _this._escHandlers = Object.create(null);
        _this._oscHandlers = Object.create(null);
        _this._dcsHandlers = Object.create(null);
        _this._activeDcsHandler = null;
        _this._errorHandler = _this._errorHandlerFb;
        return _this;
    }
    EscapeSequenceParser.prototype.dispose = function () {
        this._printHandlerFb = null;
        this._executeHandlerFb = null;
        this._csiHandlerFb = null;
        this._escHandlerFb = null;
        this._oscHandlerFb = null;
        this._dcsHandlerFb = null;
        this._errorHandlerFb = null;
        this._printHandler = null;
        this._executeHandlers = null;
        this._csiHandlers = null;
        this._escHandlers = null;
        this._oscHandlers = null;
        this._dcsHandlers = null;
        this._activeDcsHandler = null;
        this._errorHandler = null;
    };
    EscapeSequenceParser.prototype.setPrintHandler = function (callback) {
        this._printHandler = callback;
    };
    EscapeSequenceParser.prototype.clearPrintHandler = function () {
        this._printHandler = this._printHandlerFb;
    };
    EscapeSequenceParser.prototype.setExecuteHandler = function (flag, callback) {
        this._executeHandlers[flag.charCodeAt(0)] = callback;
    };
    EscapeSequenceParser.prototype.clearExecuteHandler = function (flag) {
        if (this._executeHandlers[flag.charCodeAt(0)])
            delete this._executeHandlers[flag.charCodeAt(0)];
    };
    EscapeSequenceParser.prototype.setExecuteHandlerFallback = function (callback) {
        this._executeHandlerFb = callback;
    };
    EscapeSequenceParser.prototype.setCsiHandler = function (flag, callback) {
        this._csiHandlers[flag.charCodeAt(0)] = callback;
    };
    EscapeSequenceParser.prototype.clearCsiHandler = function (flag) {
        if (this._csiHandlers[flag.charCodeAt(0)])
            delete this._csiHandlers[flag.charCodeAt(0)];
    };
    EscapeSequenceParser.prototype.setCsiHandlerFallback = function (callback) {
        this._csiHandlerFb = callback;
    };
    EscapeSequenceParser.prototype.setEscHandler = function (collectAndFlag, callback) {
        this._escHandlers[collectAndFlag] = callback;
    };
    EscapeSequenceParser.prototype.clearEscHandler = function (collectAndFlag) {
        if (this._escHandlers[collectAndFlag])
            delete this._escHandlers[collectAndFlag];
    };
    EscapeSequenceParser.prototype.setEscHandlerFallback = function (callback) {
        this._escHandlerFb = callback;
    };
    EscapeSequenceParser.prototype.setOscHandler = function (ident, callback) {
        this._oscHandlers[ident] = callback;
    };
    EscapeSequenceParser.prototype.clearOscHandler = function (ident) {
        if (this._oscHandlers[ident])
            delete this._oscHandlers[ident];
    };
    EscapeSequenceParser.prototype.setOscHandlerFallback = function (callback) {
        this._oscHandlerFb = callback;
    };
    EscapeSequenceParser.prototype.setDcsHandler = function (collectAndFlag, handler) {
        this._dcsHandlers[collectAndFlag] = handler;
    };
    EscapeSequenceParser.prototype.clearDcsHandler = function (collectAndFlag) {
        if (this._dcsHandlers[collectAndFlag])
            delete this._dcsHandlers[collectAndFlag];
    };
    EscapeSequenceParser.prototype.setDcsHandlerFallback = function (handler) {
        this._dcsHandlerFb = handler;
    };
    EscapeSequenceParser.prototype.setErrorHandler = function (callback) {
        this._errorHandler = callback;
    };
    EscapeSequenceParser.prototype.clearErrorHandler = function () {
        this._errorHandler = this._errorHandlerFb;
    };
    EscapeSequenceParser.prototype.reset = function () {
        this.currentState = this.initialState;
        this._osc = '';
        this._params = [0];
        this._collect = '';
        this._activeDcsHandler = null;
    };
    EscapeSequenceParser.prototype.parse = function (data) {
        var code = 0;
        var transition = 0;
        var error = false;
        var currentState = this.currentState;
        var print = -1;
        var dcs = -1;
        var osc = this._osc;
        var collect = this._collect;
        var params = this._params;
        var table = this.TRANSITIONS.table;
        var dcsHandler = this._activeDcsHandler;
        var callback = null;
        var l = data.length;
        for (var i = 0; i < l; ++i) {
            code = data.charCodeAt(i);
            if (currentState === 0 && code > 0x1f && code < 0x80) {
                print = (~print) ? print : i;
                do
                    i++;
                while (i < l && data.charCodeAt(i) > 0x1f && data.charCodeAt(i) < 0x80);
                i--;
                continue;
            }
            if (currentState === 4 && (code > 0x2f && code < 0x39)) {
                params[params.length - 1] = params[params.length - 1] * 10 + code - 48;
                continue;
            }
            transition = (code < 0xa0) ? (table[currentState << 8 | code]) : DEFAULT_TRANSITION;
            switch (transition >> 4) {
                case 2:
                    print = (~print) ? print : i;
                    break;
                case 3:
                    if (~print) {
                        this._printHandler(data, print, i);
                        print = -1;
                    }
                    callback = this._executeHandlers[code];
                    if (callback)
                        callback();
                    else
                        this._executeHandlerFb(code);
                    break;
                case 0:
                    if (~print) {
                        this._printHandler(data, print, i);
                        print = -1;
                    }
                    else if (~dcs) {
                        dcsHandler.put(data, dcs, i);
                        dcs = -1;
                    }
                    break;
                case 1:
                    if (code > 0x9f) {
                        switch (currentState) {
                            case 0:
                                print = (~print) ? print : i;
                                break;
                            case 8:
                                osc += String.fromCharCode(code);
                                transition |= 8;
                                break;
                            case 6:
                                transition |= 6;
                                break;
                            case 11:
                                transition |= 11;
                                break;
                            case 13:
                                dcs = (~dcs) ? dcs : i;
                                transition |= 13;
                                break;
                            default:
                                error = true;
                        }
                    }
                    else {
                        error = true;
                    }
                    if (error) {
                        var inject = this._errorHandler({
                            position: i,
                            code: code,
                            currentState: currentState,
                            print: print,
                            dcs: dcs,
                            osc: osc,
                            collect: collect,
                            params: params,
                            abort: false
                        });
                        if (inject.abort)
                            return;
                        error = false;
                    }
                    break;
                case 7:
                    callback = this._csiHandlers[code];
                    if (callback)
                        callback(params, collect);
                    else
                        this._csiHandlerFb(collect, params, code);
                    break;
                case 8:
                    if (code === 0x3b)
                        params.push(0);
                    else
                        params[params.length - 1] = params[params.length - 1] * 10 + code - 48;
                    break;
                case 9:
                    collect += String.fromCharCode(code);
                    break;
                case 10:
                    callback = this._escHandlers[collect + String.fromCharCode(code)];
                    if (callback)
                        callback(collect, code);
                    else
                        this._escHandlerFb(collect, code);
                    break;
                case 11:
                    if (~print) {
                        this._printHandler(data, print, i);
                        print = -1;
                    }
                    osc = '';
                    params = [0];
                    collect = '';
                    dcs = -1;
                    break;
                case 12:
                    dcsHandler = this._dcsHandlers[collect + String.fromCharCode(code)];
                    if (!dcsHandler)
                        dcsHandler = this._dcsHandlerFb;
                    dcsHandler.hook(collect, params, code);
                    break;
                case 13:
                    dcs = (~dcs) ? dcs : i;
                    break;
                case 14:
                    if (dcsHandler) {
                        if (~dcs)
                            dcsHandler.put(data, dcs, i);
                        dcsHandler.unhook();
                        dcsHandler = null;
                    }
                    if (code === 0x1b)
                        transition |= 1;
                    osc = '';
                    params = [0];
                    collect = '';
                    dcs = -1;
                    break;
                case 4:
                    if (~print) {
                        this._printHandler(data, print, i);
                        print = -1;
                    }
                    osc = '';
                    break;
                case 5:
                    osc += data.charAt(i);
                    break;
                case 6:
                    if (osc && code !== 0x18 && code !== 0x1a) {
                        var idx = osc.indexOf(';');
                        if (idx === -1) {
                            this._oscHandlerFb(-1, osc);
                        }
                        else {
                            var identifier = parseInt(osc.substring(0, idx));
                            var content = osc.substring(idx + 1);
                            callback = this._oscHandlers[identifier];
                            if (callback)
                                callback(content);
                            else
                                this._oscHandlerFb(identifier, content);
                        }
                    }
                    if (code === 0x1b)
                        transition |= 1;
                    osc = '';
                    params = [0];
                    collect = '';
                    dcs = -1;
                    break;
            }
            currentState = transition & 15;
        }
        if (currentState === 0 && ~print) {
            this._printHandler(data, print, data.length);
        }
        else if (currentState === 13 && ~dcs && dcsHandler) {
            dcsHandler.put(data, dcs, data.length);
        }
        this._osc = osc;
        this._collect = collect;
        this._params = params;
        this._activeDcsHandler = dcsHandler;
        this.currentState = currentState;
    };
    return EscapeSequenceParser;
}(Lifecycle_1.Disposable));
exports.EscapeSequenceParser = EscapeSequenceParser;

},{"./common/Lifecycle":29}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var EscapeSequences_1 = require("./common/data/EscapeSequences");
var Charsets_1 = require("./core/data/Charsets");
var Buffer_1 = require("./Buffer");
var CharWidth_1 = require("./CharWidth");
var EscapeSequenceParser_1 = require("./EscapeSequenceParser");
var Lifecycle_1 = require("./common/Lifecycle");
var BufferLine_1 = require("./BufferLine");
var GLEVEL = { '(': 0, ')': 1, '*': 2, '+': 3, '-': 1, '.': 2 };
var DECRQSS = (function () {
    function DECRQSS(_terminal) {
        this._terminal = _terminal;
    }
    DECRQSS.prototype.hook = function (collect, params, flag) {
        this._data = '';
    };
    DECRQSS.prototype.put = function (data, start, end) {
        this._data += data.substring(start, end);
    };
    DECRQSS.prototype.unhook = function () {
        switch (this._data) {
            case '"q':
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r0\"q" + EscapeSequences_1.C0.ESC + "\\");
            case '"p':
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r61\"p" + EscapeSequences_1.C0.ESC + "\\");
            case 'r':
                var pt = '' + (this._terminal.buffer.scrollTop + 1) +
                    ';' + (this._terminal.buffer.scrollBottom + 1) + 'r';
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r" + pt + EscapeSequences_1.C0.ESC + "\\");
            case 'm':
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r0m" + EscapeSequences_1.C0.ESC + "\\");
            case ' q':
                var STYLES = { 'block': 2, 'underline': 4, 'bar': 6 };
                var style = STYLES[this._terminal.getOption('cursorStyle')];
                style -= this._terminal.getOption('cursorBlink');
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r" + style + " q" + EscapeSequences_1.C0.ESC + "\\");
            default:
                this._terminal.error('Unknown DCS $q %s', this._data);
                this._terminal.handler(EscapeSequences_1.C0.ESC + "P0$r" + EscapeSequences_1.C0.ESC + "\\");
        }
    };
    return DECRQSS;
}());
var InputHandler = (function (_super) {
    __extends(InputHandler, _super);
    function InputHandler(_terminal, _parser) {
        if (_parser === void 0) { _parser = new EscapeSequenceParser_1.EscapeSequenceParser(); }
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._parser = _parser;
        _this.register(_this._parser);
        _this._surrogateHigh = '';
        _this._parser.setCsiHandlerFallback(function (collect, params, flag) {
            _this._terminal.error('Unknown CSI code: ', { collect: collect, params: params, flag: String.fromCharCode(flag) });
        });
        _this._parser.setEscHandlerFallback(function (collect, flag) {
            _this._terminal.error('Unknown ESC code: ', { collect: collect, flag: String.fromCharCode(flag) });
        });
        _this._parser.setExecuteHandlerFallback(function (code) {
            _this._terminal.error('Unknown EXECUTE code: ', { code: code });
        });
        _this._parser.setOscHandlerFallback(function (identifier, data) {
            _this._terminal.error('Unknown OSC code: ', { identifier: identifier, data: data });
        });
        _this._parser.setPrintHandler(function (data, start, end) { return _this.print(data, start, end); });
        _this._parser.setCsiHandler('@', function (params, collect) { return _this.insertChars(params); });
        _this._parser.setCsiHandler('A', function (params, collect) { return _this.cursorUp(params); });
        _this._parser.setCsiHandler('B', function (params, collect) { return _this.cursorDown(params); });
        _this._parser.setCsiHandler('C', function (params, collect) { return _this.cursorForward(params); });
        _this._parser.setCsiHandler('D', function (params, collect) { return _this.cursorBackward(params); });
        _this._parser.setCsiHandler('E', function (params, collect) { return _this.cursorNextLine(params); });
        _this._parser.setCsiHandler('F', function (params, collect) { return _this.cursorPrecedingLine(params); });
        _this._parser.setCsiHandler('G', function (params, collect) { return _this.cursorCharAbsolute(params); });
        _this._parser.setCsiHandler('H', function (params, collect) { return _this.cursorPosition(params); });
        _this._parser.setCsiHandler('I', function (params, collect) { return _this.cursorForwardTab(params); });
        _this._parser.setCsiHandler('J', function (params, collect) { return _this.eraseInDisplay(params); });
        _this._parser.setCsiHandler('K', function (params, collect) { return _this.eraseInLine(params); });
        _this._parser.setCsiHandler('L', function (params, collect) { return _this.insertLines(params); });
        _this._parser.setCsiHandler('M', function (params, collect) { return _this.deleteLines(params); });
        _this._parser.setCsiHandler('P', function (params, collect) { return _this.deleteChars(params); });
        _this._parser.setCsiHandler('S', function (params, collect) { return _this.scrollUp(params); });
        _this._parser.setCsiHandler('T', function (params, collect) { return _this.scrollDown(params, collect); });
        _this._parser.setCsiHandler('X', function (params, collect) { return _this.eraseChars(params); });
        _this._parser.setCsiHandler('Z', function (params, collect) { return _this.cursorBackwardTab(params); });
        _this._parser.setCsiHandler('`', function (params, collect) { return _this.charPosAbsolute(params); });
        _this._parser.setCsiHandler('a', function (params, collect) { return _this.hPositionRelative(params); });
        _this._parser.setCsiHandler('b', function (params, collect) { return _this.repeatPrecedingCharacter(params); });
        _this._parser.setCsiHandler('c', function (params, collect) { return _this.sendDeviceAttributes(params, collect); });
        _this._parser.setCsiHandler('d', function (params, collect) { return _this.linePosAbsolute(params); });
        _this._parser.setCsiHandler('e', function (params, collect) { return _this.vPositionRelative(params); });
        _this._parser.setCsiHandler('f', function (params, collect) { return _this.hVPosition(params); });
        _this._parser.setCsiHandler('g', function (params, collect) { return _this.tabClear(params); });
        _this._parser.setCsiHandler('h', function (params, collect) { return _this.setMode(params, collect); });
        _this._parser.setCsiHandler('l', function (params, collect) { return _this.resetMode(params, collect); });
        _this._parser.setCsiHandler('m', function (params, collect) { return _this.charAttributes(params); });
        _this._parser.setCsiHandler('n', function (params, collect) { return _this.deviceStatus(params, collect); });
        _this._parser.setCsiHandler('p', function (params, collect) { return _this.softReset(params, collect); });
        _this._parser.setCsiHandler('q', function (params, collect) { return _this.setCursorStyle(params, collect); });
        _this._parser.setCsiHandler('r', function (params, collect) { return _this.setScrollRegion(params, collect); });
        _this._parser.setCsiHandler('s', function (params, collect) { return _this.saveCursor(params); });
        _this._parser.setCsiHandler('u', function (params, collect) { return _this.restoreCursor(params); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.BEL, function () { return _this.bell(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.LF, function () { return _this.lineFeed(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.VT, function () { return _this.lineFeed(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.FF, function () { return _this.lineFeed(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.CR, function () { return _this.carriageReturn(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.BS, function () { return _this.backspace(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.HT, function () { return _this.tab(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.SO, function () { return _this.shiftOut(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.SI, function () { return _this.shiftIn(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C1.IND, function () { return _this.index(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C1.NEL, function () { return _this.nextLine(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C1.HTS, function () { return _this.tabSet(); });
        _this._parser.setOscHandler(0, function (data) { return _this.setTitle(data); });
        _this._parser.setOscHandler(2, function (data) { return _this.setTitle(data); });
        _this._parser.setEscHandler('7', function () { return _this.saveCursor([]); });
        _this._parser.setEscHandler('8', function () { return _this.restoreCursor([]); });
        _this._parser.setEscHandler('D', function () { return _this.index(); });
        _this._parser.setEscHandler('E', function () { return _this.nextLine(); });
        _this._parser.setEscHandler('H', function () { return _this.tabSet(); });
        _this._parser.setEscHandler('M', function () { return _this.reverseIndex(); });
        _this._parser.setEscHandler('=', function () { return _this.keypadApplicationMode(); });
        _this._parser.setEscHandler('>', function () { return _this.keypadNumericMode(); });
        _this._parser.setEscHandler('c', function () { return _this.reset(); });
        _this._parser.setEscHandler('n', function () { return _this.setgLevel(2); });
        _this._parser.setEscHandler('o', function () { return _this.setgLevel(3); });
        _this._parser.setEscHandler('|', function () { return _this.setgLevel(3); });
        _this._parser.setEscHandler('}', function () { return _this.setgLevel(2); });
        _this._parser.setEscHandler('~', function () { return _this.setgLevel(1); });
        _this._parser.setEscHandler('%@', function () { return _this.selectDefaultCharset(); });
        _this._parser.setEscHandler('%G', function () { return _this.selectDefaultCharset(); });
        var _loop_1 = function (flag) {
            this_1._parser.setEscHandler('(' + flag, function () { return _this.selectCharset('(' + flag); });
            this_1._parser.setEscHandler(')' + flag, function () { return _this.selectCharset(')' + flag); });
            this_1._parser.setEscHandler('*' + flag, function () { return _this.selectCharset('*' + flag); });
            this_1._parser.setEscHandler('+' + flag, function () { return _this.selectCharset('+' + flag); });
            this_1._parser.setEscHandler('-' + flag, function () { return _this.selectCharset('-' + flag); });
            this_1._parser.setEscHandler('.' + flag, function () { return _this.selectCharset('.' + flag); });
            this_1._parser.setEscHandler('/' + flag, function () { return _this.selectCharset('/' + flag); });
        };
        var this_1 = this;
        for (var flag in Charsets_1.CHARSETS) {
            _loop_1(flag);
        }
        _this._parser.setErrorHandler(function (state) {
            _this._terminal.error('Parsing error: ', state);
            return state;
        });
        _this._parser.setDcsHandler('$q', new DECRQSS(_this._terminal));
        return _this;
    }
    InputHandler.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._terminal = null;
    };
    InputHandler.prototype.parse = function (data) {
        if (!this._terminal) {
            return;
        }
        var buffer = this._terminal.buffer;
        var cursorStartX = buffer.x;
        var cursorStartY = buffer.y;
        if (this._terminal.debug) {
            this._terminal.log('data: ' + data);
        }
        if (this._surrogateHigh) {
            data = this._surrogateHigh + data;
            this._surrogateHigh = '';
        }
        this._parser.parse(data);
        buffer = this._terminal.buffer;
        if (buffer.x !== cursorStartX || buffer.y !== cursorStartY) {
            this._terminal.emit('cursormove');
        }
    };
    InputHandler.prototype.print = function (data, start, end) {
        var char;
        var code;
        var low;
        var chWidth;
        var buffer = this._terminal.buffer;
        var charset = this._terminal.charset;
        var screenReaderMode = this._terminal.options.screenReaderMode;
        var cols = this._terminal.cols;
        var wraparoundMode = this._terminal.wraparoundMode;
        var insertMode = this._terminal.insertMode;
        var curAttr = this._terminal.curAttr;
        var bufferRow = buffer.lines.get(buffer.y + buffer.ybase);
        this._terminal.updateRange(buffer.y);
        for (var stringPosition = start; stringPosition < end; ++stringPosition) {
            char = data.charAt(stringPosition);
            code = data.charCodeAt(stringPosition);
            if (0xD800 <= code && code <= 0xDBFF) {
                low = data.charCodeAt(stringPosition + 1);
                if (isNaN(low)) {
                    this._surrogateHigh = char;
                    continue;
                }
                code = ((code - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
                char += data.charAt(stringPosition + 1);
            }
            if (0xDC00 <= code && code <= 0xDFFF) {
                continue;
            }
            chWidth = CharWidth_1.wcwidth(code);
            if (charset) {
                char = charset[char] || char;
                code = char.charCodeAt(0);
            }
            if (screenReaderMode) {
                this._terminal.emit('a11y.char', char);
            }
            if (!chWidth && buffer.x) {
                var chMinusOne = bufferRow.get(buffer.x - 1);
                if (chMinusOne) {
                    if (!chMinusOne[Buffer_1.CHAR_DATA_WIDTH_INDEX]) {
                        var chMinusTwo = bufferRow.get(buffer.x - 2);
                        if (chMinusTwo) {
                            chMinusTwo[Buffer_1.CHAR_DATA_CHAR_INDEX] += char;
                            chMinusTwo[Buffer_1.CHAR_DATA_CODE_INDEX] = code;
                        }
                    }
                    else {
                        chMinusOne[Buffer_1.CHAR_DATA_CHAR_INDEX] += char;
                        chMinusOne[Buffer_1.CHAR_DATA_CODE_INDEX] = code;
                    }
                }
                continue;
            }
            if (buffer.x + chWidth - 1 >= cols) {
                if (wraparoundMode) {
                    buffer.x = 0;
                    buffer.y++;
                    if (buffer.y > buffer.scrollBottom) {
                        buffer.y--;
                        this._terminal.scroll(true);
                    }
                    else {
                        buffer.lines.get(buffer.y).isWrapped = true;
                    }
                    bufferRow = buffer.lines.get(buffer.y + buffer.ybase);
                }
                else {
                    if (chWidth === 2) {
                        continue;
                    }
                }
            }
            if (insertMode) {
                for (var moves = 0; moves < chWidth; ++moves) {
                    var removed = bufferRow.pop();
                    var chMinusTwo = bufferRow.get(buffer.x - 2);
                    if (removed[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0
                        && chMinusTwo
                        && chMinusTwo[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 2) {
                        bufferRow.set(this._terminal.cols - 2, [curAttr, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
                    }
                    bufferRow.splice(buffer.x, 0, [curAttr, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
                }
            }
            bufferRow.set(buffer.x++, [curAttr, char, chWidth, code]);
            if (chWidth === 2) {
                bufferRow.set(buffer.x++, [curAttr, '', 0, undefined]);
            }
        }
        this._terminal.updateRange(buffer.y);
    };
    InputHandler.prototype.bell = function () {
        this._terminal.bell();
    };
    InputHandler.prototype.lineFeed = function () {
        var buffer = this._terminal.buffer;
        if (this._terminal.options.convertEol) {
            buffer.x = 0;
        }
        buffer.y++;
        if (buffer.y > buffer.scrollBottom) {
            buffer.y--;
            this._terminal.scroll();
        }
        if (buffer.x >= this._terminal.cols) {
            buffer.x--;
        }
        this._terminal.emit('linefeed');
    };
    InputHandler.prototype.carriageReturn = function () {
        this._terminal.buffer.x = 0;
    };
    InputHandler.prototype.backspace = function () {
        if (this._terminal.buffer.x > 0) {
            this._terminal.buffer.x--;
        }
    };
    InputHandler.prototype.tab = function () {
        var originalX = this._terminal.buffer.x;
        this._terminal.buffer.x = this._terminal.buffer.nextStop();
        if (this._terminal.options.screenReaderMode) {
            this._terminal.emit('a11y.tab', this._terminal.buffer.x - originalX);
        }
    };
    InputHandler.prototype.shiftOut = function () {
        this._terminal.setgLevel(1);
    };
    InputHandler.prototype.shiftIn = function () {
        this._terminal.setgLevel(0);
    };
    InputHandler.prototype.insertChars = function (params) {
        this._terminal.buffer.lines.get(this._terminal.buffer.y + this._terminal.buffer.ybase).insertCells(this._terminal.buffer.x, params[0] || 1, [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        this._terminal.updateRange(this._terminal.buffer.y);
    };
    InputHandler.prototype.cursorUp = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y -= param;
        if (this._terminal.buffer.y < 0) {
            this._terminal.buffer.y = 0;
        }
    };
    InputHandler.prototype.cursorDown = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y += param;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x--;
        }
    };
    InputHandler.prototype.cursorForward = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x += param;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.cursorBackward = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x--;
        }
        this._terminal.buffer.x -= param;
        if (this._terminal.buffer.x < 0) {
            this._terminal.buffer.x = 0;
        }
    };
    InputHandler.prototype.cursorNextLine = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y += param;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        this._terminal.buffer.x = 0;
    };
    InputHandler.prototype.cursorPrecedingLine = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y -= param;
        if (this._terminal.buffer.y < 0) {
            this._terminal.buffer.y = 0;
        }
        this._terminal.buffer.x = 0;
    };
    InputHandler.prototype.cursorCharAbsolute = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x = param - 1;
    };
    InputHandler.prototype.cursorPosition = function (params) {
        var col;
        var row = params[0] - 1;
        if (params.length >= 2) {
            col = params[1] - 1;
        }
        else {
            col = 0;
        }
        if (row < 0) {
            row = 0;
        }
        else if (row >= this._terminal.rows) {
            row = this._terminal.rows - 1;
        }
        if (col < 0) {
            col = 0;
        }
        else if (col >= this._terminal.cols) {
            col = this._terminal.cols - 1;
        }
        this._terminal.buffer.x = col;
        this._terminal.buffer.y = row;
    };
    InputHandler.prototype.cursorForwardTab = function (params) {
        var param = params[0] || 1;
        while (param--) {
            this._terminal.buffer.x = this._terminal.buffer.nextStop();
        }
    };
    InputHandler.prototype._eraseInBufferLine = function (y, start, end) {
        this._terminal.buffer.lines.get(this._terminal.buffer.ybase + y).replaceCells(start, end, [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
    };
    InputHandler.prototype.eraseInDisplay = function (params) {
        var j;
        switch (params[0]) {
            case 0:
                j = this._terminal.buffer.y;
                this._terminal.updateRange(j);
                this._eraseInBufferLine(j++, this._terminal.buffer.x, this._terminal.cols);
                for (; j < this._terminal.rows; j++) {
                    this._eraseInBufferLine(j, 0, this._terminal.cols);
                }
                this._terminal.updateRange(j);
                break;
            case 1:
                j = this._terminal.buffer.y;
                this._terminal.updateRange(j);
                this._eraseInBufferLine(j, 0, this._terminal.buffer.x + 1);
                while (j--) {
                    this._eraseInBufferLine(j, 0, this._terminal.cols);
                }
                this._terminal.updateRange(0);
                break;
            case 2:
                j = this._terminal.rows;
                this._terminal.updateRange(j - 1);
                while (j--) {
                    this._eraseInBufferLine(j, 0, this._terminal.cols);
                }
                this._terminal.updateRange(0);
                break;
            case 3:
                var scrollBackSize = this._terminal.buffer.lines.length - this._terminal.rows;
                if (scrollBackSize > 0) {
                    this._terminal.buffer.lines.trimStart(scrollBackSize);
                    this._terminal.buffer.ybase = Math.max(this._terminal.buffer.ybase - scrollBackSize, 0);
                    this._terminal.buffer.ydisp = Math.max(this._terminal.buffer.ydisp - scrollBackSize, 0);
                    this._terminal.emit('scroll', 0);
                }
                break;
        }
    };
    InputHandler.prototype.eraseInLine = function (params) {
        switch (params[0]) {
            case 0:
                this._eraseInBufferLine(this._terminal.buffer.y, this._terminal.buffer.x, this._terminal.cols);
                break;
            case 1:
                this._eraseInBufferLine(this._terminal.buffer.y, 0, this._terminal.buffer.x + 1);
                break;
            case 2:
                this._eraseInBufferLine(this._terminal.buffer.y, 0, this._terminal.cols);
                break;
        }
        this._terminal.updateRange(this._terminal.buffer.y);
    };
    InputHandler.prototype.insertLines = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        var buffer = this._terminal.buffer;
        var row = buffer.y + buffer.ybase;
        var scrollBottomRowsOffset = this._terminal.rows - 1 - buffer.scrollBottom;
        var scrollBottomAbsolute = this._terminal.rows - 1 + buffer.ybase - scrollBottomRowsOffset + 1;
        while (param--) {
            buffer.lines.splice(scrollBottomAbsolute - 1, 1);
            buffer.lines.splice(row, 0, BufferLine_1.BufferLine.blankLine(this._terminal.cols, this._terminal.eraseAttr()));
        }
        this._terminal.updateRange(buffer.y);
        this._terminal.updateRange(buffer.scrollBottom);
    };
    InputHandler.prototype.deleteLines = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        var buffer = this._terminal.buffer;
        var row = buffer.y + buffer.ybase;
        var j;
        j = this._terminal.rows - 1 - buffer.scrollBottom;
        j = this._terminal.rows - 1 + buffer.ybase - j;
        while (param--) {
            buffer.lines.splice(row, 1);
            buffer.lines.splice(j, 0, BufferLine_1.BufferLine.blankLine(this._terminal.cols, this._terminal.eraseAttr()));
        }
        this._terminal.updateRange(buffer.y);
        this._terminal.updateRange(buffer.scrollBottom);
    };
    InputHandler.prototype.deleteChars = function (params) {
        this._terminal.buffer.lines.get(this._terminal.buffer.y + this._terminal.buffer.ybase).deleteCells(this._terminal.buffer.x, params[0] || 1, [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        this._terminal.updateRange(this._terminal.buffer.y);
    };
    InputHandler.prototype.scrollUp = function (params) {
        var param = params[0] || 1;
        var buffer = this._terminal.buffer;
        while (param--) {
            buffer.lines.splice(buffer.ybase + buffer.scrollTop, 1);
            buffer.lines.splice(buffer.ybase + buffer.scrollBottom, 0, BufferLine_1.BufferLine.blankLine(this._terminal.cols, Buffer_1.DEFAULT_ATTR));
        }
        this._terminal.updateRange(buffer.scrollTop);
        this._terminal.updateRange(buffer.scrollBottom);
    };
    InputHandler.prototype.scrollDown = function (params, collect) {
        if (params.length < 2 && !collect) {
            var param = params[0] || 1;
            var buffer = this._terminal.buffer;
            while (param--) {
                buffer.lines.splice(buffer.ybase + buffer.scrollBottom, 1);
                buffer.lines.splice(buffer.ybase + buffer.scrollBottom, 0, BufferLine_1.BufferLine.blankLine(this._terminal.cols, Buffer_1.DEFAULT_ATTR));
            }
            this._terminal.updateRange(buffer.scrollTop);
            this._terminal.updateRange(buffer.scrollBottom);
        }
    };
    InputHandler.prototype.eraseChars = function (params) {
        this._terminal.buffer.lines.get(this._terminal.buffer.y + this._terminal.buffer.ybase).replaceCells(this._terminal.buffer.x, this._terminal.buffer.x + (params[0] || 1), [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
    };
    InputHandler.prototype.cursorBackwardTab = function (params) {
        var param = params[0] || 1;
        var buffer = this._terminal.buffer;
        while (param--) {
            buffer.x = buffer.prevStop();
        }
    };
    InputHandler.prototype.charPosAbsolute = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x = param - 1;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.hPositionRelative = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x += param;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.repeatPrecedingCharacter = function (params) {
        var buffer = this._terminal.buffer;
        var line = buffer.lines.get(buffer.ybase + buffer.y);
        line.replaceCells(buffer.x, buffer.x + (params[0] || 1), line.get(buffer.x - 1) || [Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
    };
    InputHandler.prototype.sendDeviceAttributes = function (params, collect) {
        if (params[0] > 0) {
            return;
        }
        if (!collect) {
            if (this._terminal.is('xterm') || this._terminal.is('rxvt-unicode') || this._terminal.is('screen')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[?1;2c');
            }
            else if (this._terminal.is('linux')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[?6c');
            }
        }
        else if (collect === '>') {
            if (this._terminal.is('xterm')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[>0;276;0c');
            }
            else if (this._terminal.is('rxvt-unicode')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[>85;95;0c');
            }
            else if (this._terminal.is('linux')) {
                this._terminal.handler(params[0] + 'c');
            }
            else if (this._terminal.is('screen')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[>83;40003;0c');
            }
        }
    };
    InputHandler.prototype.linePosAbsolute = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y = param - 1;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
    };
    InputHandler.prototype.vPositionRelative = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y += param;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x--;
        }
    };
    InputHandler.prototype.hVPosition = function (params) {
        if (params[0] < 1)
            params[0] = 1;
        if (params[1] < 1)
            params[1] = 1;
        this._terminal.buffer.y = params[0] - 1;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        this._terminal.buffer.x = params[1] - 1;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.tabClear = function (params) {
        var param = params[0];
        if (param <= 0) {
            delete this._terminal.buffer.tabs[this._terminal.buffer.x];
        }
        else if (param === 3) {
            this._terminal.buffer.tabs = {};
        }
    };
    InputHandler.prototype.setMode = function (params, collect) {
        if (params.length > 1) {
            for (var i = 0; i < params.length; i++) {
                this.setMode([params[i]]);
            }
            return;
        }
        if (!collect) {
            switch (params[0]) {
                case 4:
                    this._terminal.insertMode = true;
                    break;
                case 20:
                    break;
            }
        }
        else if (collect === '?') {
            switch (params[0]) {
                case 1:
                    this._terminal.applicationCursor = true;
                    break;
                case 2:
                    this._terminal.setgCharset(0, Charsets_1.DEFAULT_CHARSET);
                    this._terminal.setgCharset(1, Charsets_1.DEFAULT_CHARSET);
                    this._terminal.setgCharset(2, Charsets_1.DEFAULT_CHARSET);
                    this._terminal.setgCharset(3, Charsets_1.DEFAULT_CHARSET);
                    break;
                case 3:
                    this._terminal.savedCols = this._terminal.cols;
                    this._terminal.resize(132, this._terminal.rows);
                    break;
                case 6:
                    this._terminal.originMode = true;
                    break;
                case 7:
                    this._terminal.wraparoundMode = true;
                    break;
                case 12:
                    break;
                case 66:
                    this._terminal.log('Serial port requested application keypad.');
                    this._terminal.applicationKeypad = true;
                    this._terminal.viewport.syncScrollArea();
                    break;
                case 9:
                case 1000:
                case 1002:
                case 1003:
                    this._terminal.x10Mouse = params[0] === 9;
                    this._terminal.vt200Mouse = params[0] === 1000;
                    this._terminal.normalMouse = params[0] > 1000;
                    this._terminal.mouseEvents = true;
                    this._terminal.element.classList.add('enable-mouse-events');
                    this._terminal.selectionManager.disable();
                    this._terminal.log('Binding to mouse events.');
                    break;
                case 1004:
                    this._terminal.sendFocus = true;
                    break;
                case 1005:
                    this._terminal.utfMouse = true;
                    break;
                case 1006:
                    this._terminal.sgrMouse = true;
                    break;
                case 1015:
                    this._terminal.urxvtMouse = true;
                    break;
                case 25:
                    this._terminal.cursorHidden = false;
                    break;
                case 1049:
                case 47:
                case 1047:
                    this._terminal.buffers.activateAltBuffer();
                    this._terminal.viewport.syncScrollArea();
                    this._terminal.showCursor();
                    break;
                case 2004:
                    this._terminal.bracketedPasteMode = true;
                    break;
            }
        }
    };
    InputHandler.prototype.resetMode = function (params, collect) {
        if (params.length > 1) {
            for (var i = 0; i < params.length; i++) {
                this.resetMode([params[i]]);
            }
            return;
        }
        if (!collect) {
            switch (params[0]) {
                case 4:
                    this._terminal.insertMode = false;
                    break;
                case 20:
                    break;
            }
        }
        else if (collect === '?') {
            switch (params[0]) {
                case 1:
                    this._terminal.applicationCursor = false;
                    break;
                case 3:
                    if (this._terminal.cols === 132 && this._terminal.savedCols) {
                        this._terminal.resize(this._terminal.savedCols, this._terminal.rows);
                    }
                    delete this._terminal.savedCols;
                    break;
                case 6:
                    this._terminal.originMode = false;
                    break;
                case 7:
                    this._terminal.wraparoundMode = false;
                    break;
                case 12:
                    break;
                case 66:
                    this._terminal.log('Switching back to normal keypad.');
                    this._terminal.applicationKeypad = false;
                    this._terminal.viewport.syncScrollArea();
                    break;
                case 9:
                case 1000:
                case 1002:
                case 1003:
                    this._terminal.x10Mouse = false;
                    this._terminal.vt200Mouse = false;
                    this._terminal.normalMouse = false;
                    this._terminal.mouseEvents = false;
                    this._terminal.element.classList.remove('enable-mouse-events');
                    this._terminal.selectionManager.enable();
                    break;
                case 1004:
                    this._terminal.sendFocus = false;
                    break;
                case 1005:
                    this._terminal.utfMouse = false;
                    break;
                case 1006:
                    this._terminal.sgrMouse = false;
                    break;
                case 1015:
                    this._terminal.urxvtMouse = false;
                    break;
                case 25:
                    this._terminal.cursorHidden = true;
                    break;
                case 1049:
                case 47:
                case 1047:
                    this._terminal.buffers.activateNormalBuffer();
                    this._terminal.refresh(0, this._terminal.rows - 1);
                    this._terminal.viewport.syncScrollArea();
                    this._terminal.showCursor();
                    break;
                case 2004:
                    this._terminal.bracketedPasteMode = false;
                    break;
            }
        }
    };
    InputHandler.prototype.charAttributes = function (params) {
        if (params.length === 1 && params[0] === 0) {
            this._terminal.curAttr = Buffer_1.DEFAULT_ATTR;
            return;
        }
        var l = params.length;
        var flags = this._terminal.curAttr >> 18;
        var fg = (this._terminal.curAttr >> 9) & 0x1ff;
        var bg = this._terminal.curAttr & 0x1ff;
        var p;
        for (var i = 0; i < l; i++) {
            p = params[i];
            if (p >= 30 && p <= 37) {
                fg = p - 30;
            }
            else if (p >= 40 && p <= 47) {
                bg = p - 40;
            }
            else if (p >= 90 && p <= 97) {
                p += 8;
                fg = p - 90;
            }
            else if (p >= 100 && p <= 107) {
                p += 8;
                bg = p - 100;
            }
            else if (p === 0) {
                flags = Buffer_1.DEFAULT_ATTR >> 18;
                fg = (Buffer_1.DEFAULT_ATTR >> 9) & 0x1ff;
                bg = Buffer_1.DEFAULT_ATTR & 0x1ff;
            }
            else if (p === 1) {
                flags |= 1;
            }
            else if (p === 3) {
                flags |= 64;
            }
            else if (p === 4) {
                flags |= 2;
            }
            else if (p === 5) {
                flags |= 4;
            }
            else if (p === 7) {
                flags |= 8;
            }
            else if (p === 8) {
                flags |= 16;
            }
            else if (p === 2) {
                flags |= 32;
            }
            else if (p === 22) {
                flags &= ~1;
                flags &= ~32;
            }
            else if (p === 23) {
                flags &= ~64;
            }
            else if (p === 24) {
                flags &= ~2;
            }
            else if (p === 25) {
                flags &= ~4;
            }
            else if (p === 27) {
                flags &= ~8;
            }
            else if (p === 28) {
                flags &= ~16;
            }
            else if (p === 39) {
                fg = (Buffer_1.DEFAULT_ATTR >> 9) & 0x1ff;
            }
            else if (p === 49) {
                bg = Buffer_1.DEFAULT_ATTR & 0x1ff;
            }
            else if (p === 38) {
                if (params[i + 1] === 2) {
                    i += 2;
                    fg = this._terminal.matchColor(params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff);
                    if (fg === -1)
                        fg = 0x1ff;
                    i += 2;
                }
                else if (params[i + 1] === 5) {
                    i += 2;
                    p = params[i] & 0xff;
                    fg = p;
                }
            }
            else if (p === 48) {
                if (params[i + 1] === 2) {
                    i += 2;
                    bg = this._terminal.matchColor(params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff);
                    if (bg === -1)
                        bg = 0x1ff;
                    i += 2;
                }
                else if (params[i + 1] === 5) {
                    i += 2;
                    p = params[i] & 0xff;
                    bg = p;
                }
            }
            else if (p === 100) {
                fg = (Buffer_1.DEFAULT_ATTR >> 9) & 0x1ff;
                bg = Buffer_1.DEFAULT_ATTR & 0x1ff;
            }
            else {
                this._terminal.error('Unknown SGR attribute: %d.', p);
            }
        }
        this._terminal.curAttr = (flags << 18) | (fg << 9) | bg;
    };
    InputHandler.prototype.deviceStatus = function (params, collect) {
        if (!collect) {
            switch (params[0]) {
                case 5:
                    this._terminal.emit('data', EscapeSequences_1.C0.ESC + "[0n");
                    break;
                case 6:
                    var y = this._terminal.buffer.y + 1;
                    var x = this._terminal.buffer.x + 1;
                    this._terminal.emit('data', EscapeSequences_1.C0.ESC + "[" + y + ";" + x + "R");
                    break;
            }
        }
        else if (collect === '?') {
            switch (params[0]) {
                case 6:
                    var y = this._terminal.buffer.y + 1;
                    var x = this._terminal.buffer.x + 1;
                    this._terminal.emit('data', EscapeSequences_1.C0.ESC + "[?" + y + ";" + x + "R");
                    break;
                case 15:
                    break;
                case 25:
                    break;
                case 26:
                    break;
                case 53:
                    break;
            }
        }
    };
    InputHandler.prototype.softReset = function (params, collect) {
        if (collect === '!') {
            this._terminal.cursorHidden = false;
            this._terminal.insertMode = false;
            this._terminal.originMode = false;
            this._terminal.wraparoundMode = true;
            this._terminal.applicationKeypad = false;
            this._terminal.viewport.syncScrollArea();
            this._terminal.applicationCursor = false;
            this._terminal.buffer.scrollTop = 0;
            this._terminal.buffer.scrollBottom = this._terminal.rows - 1;
            this._terminal.curAttr = Buffer_1.DEFAULT_ATTR;
            this._terminal.buffer.x = this._terminal.buffer.y = 0;
            this._terminal.charset = null;
            this._terminal.glevel = 0;
            this._terminal.charsets = [null];
        }
    };
    InputHandler.prototype.setCursorStyle = function (params, collect) {
        if (collect === ' ') {
            var param = params[0] < 1 ? 1 : params[0];
            switch (param) {
                case 1:
                case 2:
                    this._terminal.setOption('cursorStyle', 'block');
                    break;
                case 3:
                case 4:
                    this._terminal.setOption('cursorStyle', 'underline');
                    break;
                case 5:
                case 6:
                    this._terminal.setOption('cursorStyle', 'bar');
                    break;
            }
            var isBlinking = param % 2 === 1;
            this._terminal.setOption('cursorBlink', isBlinking);
        }
    };
    InputHandler.prototype.setScrollRegion = function (params, collect) {
        if (collect)
            return;
        this._terminal.buffer.scrollTop = (params[0] || 1) - 1;
        this._terminal.buffer.scrollBottom = (params[1] && params[1] <= this._terminal.rows ? params[1] : this._terminal.rows) - 1;
        this._terminal.buffer.x = 0;
        this._terminal.buffer.y = 0;
    };
    InputHandler.prototype.saveCursor = function (params) {
        this._terminal.buffer.savedX = this._terminal.buffer.x;
        this._terminal.buffer.savedY = this._terminal.buffer.y;
        this._terminal.savedCurAttr = this._terminal.curAttr;
    };
    InputHandler.prototype.restoreCursor = function (params) {
        this._terminal.buffer.x = this._terminal.buffer.savedX || 0;
        this._terminal.buffer.y = this._terminal.buffer.savedY || 0;
        this._terminal.curAttr = this._terminal.savedCurAttr || Buffer_1.DEFAULT_ATTR;
    };
    InputHandler.prototype.setTitle = function (data) {
        this._terminal.handleTitle(data);
    };
    InputHandler.prototype.nextLine = function () {
        this._terminal.buffer.x = 0;
        this.index();
    };
    InputHandler.prototype.keypadApplicationMode = function () {
        this._terminal.log('Serial port requested application keypad.');
        this._terminal.applicationKeypad = true;
        if (this._terminal.viewport) {
            this._terminal.viewport.syncScrollArea();
        }
    };
    InputHandler.prototype.keypadNumericMode = function () {
        this._terminal.log('Switching back to normal keypad.');
        this._terminal.applicationKeypad = false;
        if (this._terminal.viewport) {
            this._terminal.viewport.syncScrollArea();
        }
    };
    InputHandler.prototype.selectDefaultCharset = function () {
        this._terminal.setgLevel(0);
        this._terminal.setgCharset(0, Charsets_1.DEFAULT_CHARSET);
    };
    InputHandler.prototype.selectCharset = function (collectAndFlag) {
        if (collectAndFlag.length !== 2)
            return this.selectDefaultCharset();
        if (collectAndFlag[0] === '/')
            return;
        this._terminal.setgCharset(GLEVEL[collectAndFlag[0]], Charsets_1.CHARSETS[collectAndFlag[1]] || Charsets_1.DEFAULT_CHARSET);
    };
    InputHandler.prototype.index = function () {
        this._terminal.index();
    };
    InputHandler.prototype.tabSet = function () {
        this._terminal.tabSet();
    };
    InputHandler.prototype.reverseIndex = function () {
        this._terminal.reverseIndex();
    };
    InputHandler.prototype.reset = function () {
        this._parser.reset();
        this._terminal.reset();
    };
    InputHandler.prototype.setgLevel = function (level) {
        this._terminal.setgLevel(level);
    };
    return InputHandler;
}(Lifecycle_1.Disposable));
exports.InputHandler = InputHandler;

},{"./Buffer":13,"./BufferLine":14,"./CharWidth":16,"./EscapeSequenceParser":18,"./common/Lifecycle":29,"./common/data/EscapeSequences":30,"./core/data/Charsets":31}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var MouseZoneManager_1 = require("./ui/MouseZoneManager");
var EventEmitter_1 = require("./common/EventEmitter");
var Buffer_1 = require("./Buffer");
var CharWidth_1 = require("./CharWidth");
var Linkifier = (function (_super) {
    __extends(Linkifier, _super);
    function Linkifier(_terminal) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._linkMatchers = [];
        _this._nextLinkMatcherId = 0;
        _this._rowsToLinkify = {
            start: null,
            end: null
        };
        return _this;
    }
    Linkifier.prototype.attachToDom = function (mouseZoneManager) {
        this._mouseZoneManager = mouseZoneManager;
    };
    Linkifier.prototype.linkifyRows = function (start, end) {
        var _this = this;
        if (!this._mouseZoneManager) {
            return;
        }
        if (this._rowsToLinkify.start === null) {
            this._rowsToLinkify.start = start;
            this._rowsToLinkify.end = end;
        }
        else {
            this._rowsToLinkify.start = Math.min(this._rowsToLinkify.start, start);
            this._rowsToLinkify.end = Math.max(this._rowsToLinkify.end, end);
        }
        this._mouseZoneManager.clearAll(start, end);
        if (this._rowsTimeoutId) {
            clearTimeout(this._rowsTimeoutId);
        }
        this._rowsTimeoutId = setTimeout(function () { return _this._linkifyRows(); }, Linkifier.TIME_BEFORE_LINKIFY);
    };
    Linkifier.prototype._linkifyRows = function () {
        this._rowsTimeoutId = null;
        var buffer = this._terminal.buffer;
        var absoluteRowIndexStart = buffer.ydisp + this._rowsToLinkify.start;
        if (absoluteRowIndexStart >= buffer.lines.length) {
            return;
        }
        var absoluteRowIndexEnd = buffer.ydisp + Math.min(this._rowsToLinkify.end, this._terminal.rows) + 1;
        var overscanLineLimit = Math.ceil(Linkifier.OVERSCAN_CHAR_LIMIT / this._terminal.cols);
        var iterator = this._terminal.buffer.iterator(false, absoluteRowIndexStart, absoluteRowIndexEnd, overscanLineLimit, overscanLineLimit);
        while (iterator.hasNext()) {
            var lineData = iterator.next();
            for (var i = 0; i < this._linkMatchers.length; i++) {
                this._doLinkifyRow(lineData.range.first, lineData.content, this._linkMatchers[i]);
            }
        }
        this._rowsToLinkify.start = null;
        this._rowsToLinkify.end = null;
    };
    Linkifier.prototype.registerLinkMatcher = function (regex, handler, options) {
        if (options === void 0) { options = {}; }
        if (!handler) {
            throw new Error('handler must be defined');
        }
        var matcher = {
            id: this._nextLinkMatcherId++,
            regex: regex,
            handler: handler,
            matchIndex: options.matchIndex,
            validationCallback: options.validationCallback,
            hoverTooltipCallback: options.tooltipCallback,
            hoverLeaveCallback: options.leaveCallback,
            willLinkActivate: options.willLinkActivate,
            priority: options.priority || 0
        };
        this._addLinkMatcherToList(matcher);
        return matcher.id;
    };
    Linkifier.prototype._addLinkMatcherToList = function (matcher) {
        if (this._linkMatchers.length === 0) {
            this._linkMatchers.push(matcher);
            return;
        }
        for (var i = this._linkMatchers.length - 1; i >= 0; i--) {
            if (matcher.priority <= this._linkMatchers[i].priority) {
                this._linkMatchers.splice(i + 1, 0, matcher);
                return;
            }
        }
        this._linkMatchers.splice(0, 0, matcher);
    };
    Linkifier.prototype.deregisterLinkMatcher = function (matcherId) {
        for (var i = 0; i < this._linkMatchers.length; i++) {
            if (this._linkMatchers[i].id === matcherId) {
                this._linkMatchers.splice(i, 1);
                return true;
            }
        }
        return false;
    };
    Linkifier.prototype._doLinkifyRow = function (rowIndex, text, matcher) {
        var _this = this;
        var rex = new RegExp(matcher.regex.source, matcher.regex.flags + 'g');
        var match;
        var stringIndex = -1;
        var _loop_1 = function () {
            var uri = match[typeof matcher.matchIndex !== 'number' ? 0 : matcher.matchIndex];
            if (!uri) {
                if (this_1._terminal.debug) {
                    console.log({ match: match, matcher: matcher });
                    throw new Error('match found without corresponding matchIndex');
                }
                return "break";
            }
            stringIndex = text.indexOf(uri, stringIndex + 1);
            rex.lastIndex = stringIndex + uri.length;
            var bufferIndex = this_1._terminal.buffer.stringIndexToBufferIndex(rowIndex, stringIndex);
            var line = this_1._terminal.buffer.lines.get(bufferIndex[0]);
            var char = line.get(bufferIndex[1]);
            var fg;
            if (char) {
                var attr = char[Buffer_1.CHAR_DATA_ATTR_INDEX];
                fg = (attr >> 9) & 0x1ff;
            }
            if (matcher.validationCallback) {
                matcher.validationCallback(uri, function (isValid) {
                    if (_this._rowsTimeoutId) {
                        return;
                    }
                    if (isValid) {
                        _this._addLink(bufferIndex[1], bufferIndex[0] - _this._terminal.buffer.ydisp, uri, matcher, fg);
                    }
                });
            }
            else {
                this_1._addLink(bufferIndex[1], bufferIndex[0] - this_1._terminal.buffer.ydisp, uri, matcher, fg);
            }
        };
        var this_1 = this;
        while ((match = rex.exec(text)) !== null) {
            var state_1 = _loop_1();
            if (state_1 === "break")
                break;
        }
    };
    Linkifier.prototype._addLink = function (x, y, uri, matcher, fg) {
        var _this = this;
        var width = CharWidth_1.getStringCellWidth(uri);
        var x1 = x % this._terminal.cols;
        var y1 = y + Math.floor(x / this._terminal.cols);
        var x2 = (x1 + width) % this._terminal.cols;
        var y2 = y1 + Math.floor((x1 + width) / this._terminal.cols);
        if (x2 === 0) {
            x2 = this._terminal.cols;
            y2--;
        }
        this._mouseZoneManager.add(new MouseZoneManager_1.MouseZone(x1 + 1, y1 + 1, x2 + 1, y2 + 1, function (e) {
            if (matcher.handler) {
                return matcher.handler(e, uri);
            }
            window.open(uri, '_blank');
        }, function (e) {
            _this.emit("linkhover", _this._createLinkHoverEvent(x1, y1, x2, y2, fg));
            _this._terminal.element.classList.add('xterm-cursor-pointer');
        }, function (e) {
            _this.emit("linktooltip", _this._createLinkHoverEvent(x1, y1, x2, y2, fg));
            if (matcher.hoverTooltipCallback) {
                matcher.hoverTooltipCallback(e, uri);
            }
        }, function () {
            _this.emit("linkleave", _this._createLinkHoverEvent(x1, y1, x2, y2, fg));
            _this._terminal.element.classList.remove('xterm-cursor-pointer');
            if (matcher.hoverLeaveCallback) {
                matcher.hoverLeaveCallback();
            }
        }, function (e) {
            if (matcher.willLinkActivate) {
                return matcher.willLinkActivate(e, uri);
            }
            return true;
        }));
    };
    Linkifier.prototype._createLinkHoverEvent = function (x1, y1, x2, y2, fg) {
        return { x1: x1, y1: y1, x2: x2, y2: y2, cols: this._terminal.cols, fg: fg };
    };
    Linkifier.TIME_BEFORE_LINKIFY = 200;
    Linkifier.OVERSCAN_CHAR_LIMIT = 2000;
    return Linkifier;
}(EventEmitter_1.EventEmitter));
exports.Linkifier = Linkifier;

},{"./Buffer":13,"./CharWidth":16,"./common/EventEmitter":28,"./ui/MouseZoneManager":60}],21:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var MouseHelper_1 = require("./utils/MouseHelper");
var Browser = require("./shared/utils/Browser");
var EventEmitter_1 = require("./common/EventEmitter");
var SelectionModel_1 = require("./SelectionModel");
var Buffer_1 = require("./Buffer");
var AltClickHandler_1 = require("./handlers/AltClickHandler");
var DRAG_SCROLL_MAX_THRESHOLD = 50;
var DRAG_SCROLL_MAX_SPEED = 15;
var DRAG_SCROLL_INTERVAL = 50;
var ALT_CLICK_MOVE_CURSOR_TIME = 500;
var WORD_SEPARATORS = ' ()[]{}\'"';
var NON_BREAKING_SPACE_CHAR = String.fromCharCode(160);
var ALL_NON_BREAKING_SPACE_REGEX = new RegExp(NON_BREAKING_SPACE_CHAR, 'g');
var SelectionManager = (function (_super) {
    __extends(SelectionManager, _super);
    function SelectionManager(_terminal, _charMeasure) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._charMeasure = _charMeasure;
        _this._enabled = true;
        _this._initListeners();
        _this.enable();
        _this._model = new SelectionModel_1.SelectionModel(_terminal);
        _this._activeSelectionMode = 0;
        return _this;
    }
    SelectionManager.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._removeMouseDownListeners();
    };
    Object.defineProperty(SelectionManager.prototype, "_buffer", {
        get: function () {
            return this._terminal.buffers.active;
        },
        enumerable: true,
        configurable: true
    });
    SelectionManager.prototype._initListeners = function () {
        var _this = this;
        this._mouseMoveListener = function (event) { return _this._onMouseMove(event); };
        this._mouseUpListener = function (event) { return _this._onMouseUp(event); };
        this._trimListener = function (amount) { return _this._onTrim(amount); };
        this.initBuffersListeners();
    };
    SelectionManager.prototype.initBuffersListeners = function () {
        var _this = this;
        this._terminal.buffer.lines.on('trim', this._trimListener);
        this._terminal.buffers.on('activate', function (e) { return _this._onBufferActivate(e); });
    };
    SelectionManager.prototype.disable = function () {
        this.clearSelection();
        this._enabled = false;
    };
    SelectionManager.prototype.enable = function () {
        this._enabled = true;
    };
    Object.defineProperty(SelectionManager.prototype, "selectionStart", {
        get: function () { return this._model.finalSelectionStart; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectionManager.prototype, "selectionEnd", {
        get: function () { return this._model.finalSelectionEnd; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectionManager.prototype, "hasSelection", {
        get: function () {
            var start = this._model.finalSelectionStart;
            var end = this._model.finalSelectionEnd;
            if (!start || !end) {
                return false;
            }
            return start[0] !== end[0] || start[1] !== end[1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectionManager.prototype, "selectionText", {
        get: function () {
            var start = this._model.finalSelectionStart;
            var end = this._model.finalSelectionEnd;
            if (!start || !end) {
                return '';
            }
            var result = [];
            if (this._activeSelectionMode === 3) {
                if (start[0] === end[0]) {
                    return '';
                }
                for (var i = start[1]; i <= end[1]; i++) {
                    var lineText = this._buffer.translateBufferLineToString(i, true, start[0], end[0]);
                    result.push(lineText);
                }
            }
            else {
                var startRowEndCol = start[1] === end[1] ? end[0] : null;
                result.push(this._buffer.translateBufferLineToString(start[1], true, start[0], startRowEndCol));
                for (var i = start[1] + 1; i <= end[1] - 1; i++) {
                    var bufferLine = this._buffer.lines.get(i);
                    var lineText = this._buffer.translateBufferLineToString(i, true);
                    if (bufferLine.isWrapped) {
                        result[result.length - 1] += lineText;
                    }
                    else {
                        result.push(lineText);
                    }
                }
                if (start[1] !== end[1]) {
                    var bufferLine = this._buffer.lines.get(end[1]);
                    var lineText = this._buffer.translateBufferLineToString(end[1], true, 0, end[0]);
                    if (bufferLine.isWrapped) {
                        result[result.length - 1] += lineText;
                    }
                    else {
                        result.push(lineText);
                    }
                }
            }
            var formattedResult = result.map(function (line) {
                return line.replace(ALL_NON_BREAKING_SPACE_REGEX, ' ');
            }).join(Browser.isMSWindows ? '\r\n' : '\n');
            return formattedResult;
        },
        enumerable: true,
        configurable: true
    });
    SelectionManager.prototype.clearSelection = function () {
        this._model.clearSelection();
        this._removeMouseDownListeners();
        this.refresh();
    };
    SelectionManager.prototype.refresh = function (isNewSelection) {
        var _this = this;
        if (!this._refreshAnimationFrame) {
            this._refreshAnimationFrame = window.requestAnimationFrame(function () { return _this._refresh(); });
        }
        if (Browser.isLinux && isNewSelection) {
            var selectionText = this.selectionText;
            if (selectionText.length) {
                this.emit('newselection', this.selectionText);
            }
        }
    };
    SelectionManager.prototype._refresh = function () {
        this._refreshAnimationFrame = null;
        this.emit('refresh', {
            start: this._model.finalSelectionStart,
            end: this._model.finalSelectionEnd,
            columnSelectMode: this._activeSelectionMode === 3
        });
    };
    SelectionManager.prototype.isClickInSelection = function (event) {
        var coords = this._getMouseBufferCoords(event);
        var start = this._model.finalSelectionStart;
        var end = this._model.finalSelectionEnd;
        if (!start || !end) {
            return false;
        }
        return (coords[1] > start[1] && coords[1] < end[1]) ||
            (start[1] === end[1] && coords[1] === start[1] && coords[0] > start[0] && coords[0] < end[0]) ||
            (start[1] < end[1] && coords[1] === end[1] && coords[0] < end[0]);
    };
    SelectionManager.prototype.selectWordAtCursor = function (event) {
        var coords = this._getMouseBufferCoords(event);
        if (coords) {
            this._selectWordAt(coords, false);
            this._model.selectionEnd = null;
            this.refresh(true);
        }
    };
    SelectionManager.prototype.selectAll = function () {
        this._model.isSelectAllActive = true;
        this.refresh();
        this._terminal.emit('selection');
    };
    SelectionManager.prototype.selectLines = function (start, end) {
        this._model.clearSelection();
        start = Math.max(start, 0);
        end = Math.min(end, this._terminal.buffer.lines.length - 1);
        this._model.selectionStart = [0, start];
        this._model.selectionEnd = [this._terminal.cols, end];
        this.refresh();
        this._terminal.emit('selection');
    };
    SelectionManager.prototype._onTrim = function (amount) {
        var needsRefresh = this._model.onTrim(amount);
        if (needsRefresh) {
            this.refresh();
        }
    };
    SelectionManager.prototype._getMouseBufferCoords = function (event) {
        var coords = this._terminal.mouseHelper.getCoords(event, this._terminal.screenElement, this._charMeasure, this._terminal.options.lineHeight, this._terminal.cols, this._terminal.rows, true);
        if (!coords) {
            return null;
        }
        coords[0]--;
        coords[1]--;
        coords[1] += this._terminal.buffer.ydisp;
        return coords;
    };
    SelectionManager.prototype._getMouseEventScrollAmount = function (event) {
        var offset = MouseHelper_1.MouseHelper.getCoordsRelativeToElement(event, this._terminal.screenElement)[1];
        var terminalHeight = this._terminal.rows * Math.ceil(this._charMeasure.height * this._terminal.options.lineHeight);
        if (offset >= 0 && offset <= terminalHeight) {
            return 0;
        }
        if (offset > terminalHeight) {
            offset -= terminalHeight;
        }
        offset = Math.min(Math.max(offset, -DRAG_SCROLL_MAX_THRESHOLD), DRAG_SCROLL_MAX_THRESHOLD);
        offset /= DRAG_SCROLL_MAX_THRESHOLD;
        return (offset / Math.abs(offset)) + Math.round(offset * (DRAG_SCROLL_MAX_SPEED - 1));
    };
    SelectionManager.prototype.shouldForceSelection = function (event) {
        if (Browser.isMac) {
            return event.altKey && this._terminal.options.macOptionClickForcesSelection;
        }
        return event.shiftKey;
    };
    SelectionManager.prototype.onMouseDown = function (event) {
        this._mouseDownTimeStamp = event.timeStamp;
        if (event.button === 2 && this.hasSelection) {
            return;
        }
        if (event.button !== 0) {
            return;
        }
        if (!this._enabled) {
            if (!this.shouldForceSelection(event)) {
                return;
            }
            event.stopPropagation();
        }
        event.preventDefault();
        this._dragScrollAmount = 0;
        if (this._enabled && event.shiftKey) {
            this._onIncrementalClick(event);
        }
        else {
            if (event.detail === 1) {
                this._onSingleClick(event);
            }
            else if (event.detail === 2) {
                this._onDoubleClick(event);
            }
            else if (event.detail === 3) {
                this._onTripleClick(event);
            }
        }
        this._addMouseDownListeners();
        this.refresh(true);
    };
    SelectionManager.prototype._addMouseDownListeners = function () {
        var _this = this;
        this._terminal.element.ownerDocument.addEventListener('mousemove', this._mouseMoveListener);
        this._terminal.element.ownerDocument.addEventListener('mouseup', this._mouseUpListener);
        this._dragScrollIntervalTimer = setInterval(function () { return _this._dragScroll(); }, DRAG_SCROLL_INTERVAL);
    };
    SelectionManager.prototype._removeMouseDownListeners = function () {
        if (this._terminal.element.ownerDocument) {
            this._terminal.element.ownerDocument.removeEventListener('mousemove', this._mouseMoveListener);
            this._terminal.element.ownerDocument.removeEventListener('mouseup', this._mouseUpListener);
        }
        clearInterval(this._dragScrollIntervalTimer);
        this._dragScrollIntervalTimer = null;
    };
    SelectionManager.prototype._onIncrementalClick = function (event) {
        if (this._model.selectionStart) {
            this._model.selectionEnd = this._getMouseBufferCoords(event);
        }
    };
    SelectionManager.prototype._onSingleClick = function (event) {
        this._model.selectionStartLength = 0;
        this._model.isSelectAllActive = false;
        this._activeSelectionMode = this.shouldColumnSelect(event) ? 3 : 0;
        this._model.selectionStart = this._getMouseBufferCoords(event);
        if (!this._model.selectionStart) {
            return;
        }
        this._model.selectionEnd = null;
        var line = this._buffer.lines.get(this._model.selectionStart[1]);
        if (!line) {
            return;
        }
        if (line.length >= this._model.selectionStart[0]) {
            return;
        }
        var char = line.get(this._model.selectionStart[0]);
        if (char[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0) {
            this._model.selectionStart[0]++;
        }
    };
    SelectionManager.prototype._onDoubleClick = function (event) {
        var coords = this._getMouseBufferCoords(event);
        if (coords) {
            this._activeSelectionMode = 1;
            this._selectWordAt(coords, true);
        }
    };
    SelectionManager.prototype._onTripleClick = function (event) {
        var coords = this._getMouseBufferCoords(event);
        if (coords) {
            this._activeSelectionMode = 2;
            this._selectLineAt(coords[1]);
        }
    };
    SelectionManager.prototype.shouldColumnSelect = function (event) {
        return event.altKey && !(Browser.isMac && this._terminal.options.macOptionClickForcesSelection);
    };
    SelectionManager.prototype._onMouseMove = function (event) {
        event.stopImmediatePropagation();
        var previousSelectionEnd = this._model.selectionEnd ? [this._model.selectionEnd[0], this._model.selectionEnd[1]] : null;
        this._model.selectionEnd = this._getMouseBufferCoords(event);
        if (!this._model.selectionEnd) {
            this.refresh(true);
            return;
        }
        if (this._activeSelectionMode === 2) {
            if (this._model.selectionEnd[1] < this._model.selectionStart[1]) {
                this._model.selectionEnd[0] = 0;
            }
            else {
                this._model.selectionEnd[0] = this._terminal.cols;
            }
        }
        else if (this._activeSelectionMode === 1) {
            this._selectToWordAt(this._model.selectionEnd);
        }
        this._dragScrollAmount = this._getMouseEventScrollAmount(event);
        if (this._activeSelectionMode !== 3) {
            if (this._dragScrollAmount > 0) {
                this._model.selectionEnd[0] = this._terminal.cols;
            }
            else if (this._dragScrollAmount < 0) {
                this._model.selectionEnd[0] = 0;
            }
        }
        if (this._model.selectionEnd[1] < this._buffer.lines.length) {
            var char = this._buffer.lines.get(this._model.selectionEnd[1]).get(this._model.selectionEnd[0]);
            if (char && char[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0) {
                this._model.selectionEnd[0]++;
            }
        }
        if (!previousSelectionEnd ||
            previousSelectionEnd[0] !== this._model.selectionEnd[0] ||
            previousSelectionEnd[1] !== this._model.selectionEnd[1]) {
            this.refresh(true);
        }
    };
    SelectionManager.prototype._dragScroll = function () {
        if (this._dragScrollAmount) {
            this._terminal.scrollLines(this._dragScrollAmount, false);
            if (this._dragScrollAmount > 0) {
                if (this._activeSelectionMode !== 3) {
                    this._model.selectionEnd[0] = this._terminal.cols;
                }
                this._model.selectionEnd[1] = Math.min(this._terminal.buffer.ydisp + this._terminal.rows, this._terminal.buffer.lines.length - 1);
            }
            else {
                if (this._activeSelectionMode !== 3) {
                    this._model.selectionEnd[0] = 0;
                }
                this._model.selectionEnd[1] = this._terminal.buffer.ydisp;
            }
            this.refresh();
        }
    };
    SelectionManager.prototype._onMouseUp = function (event) {
        var timeElapsed = event.timeStamp - this._mouseDownTimeStamp;
        this._removeMouseDownListeners();
        if (this.selectionText.length <= 1 && timeElapsed < ALT_CLICK_MOVE_CURSOR_TIME) {
            (new AltClickHandler_1.AltClickHandler(event, this._terminal)).move();
        }
        else if (this.hasSelection) {
            this._terminal.emit('selection');
        }
    };
    SelectionManager.prototype._onBufferActivate = function (e) {
        this.clearSelection();
        e.inactiveBuffer.lines.off('trim', this._trimListener);
        e.activeBuffer.lines.on('trim', this._trimListener);
    };
    SelectionManager.prototype._convertViewportColToCharacterIndex = function (bufferLine, coords) {
        var charIndex = coords[0];
        for (var i = 0; coords[0] >= i; i++) {
            var char = bufferLine.get(i);
            if (char[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0) {
                charIndex--;
            }
            else if (char[Buffer_1.CHAR_DATA_CHAR_INDEX].length > 1 && coords[0] !== i) {
                charIndex += char[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
            }
        }
        return charIndex;
    };
    SelectionManager.prototype.setSelection = function (col, row, length) {
        this._model.clearSelection();
        this._removeMouseDownListeners();
        this._model.selectionStart = [col, row];
        this._model.selectionStartLength = length;
        this.refresh();
    };
    SelectionManager.prototype._getWordAt = function (coords, allowWhitespaceOnlySelection, followWrappedLinesAbove, followWrappedLinesBelow) {
        if (followWrappedLinesAbove === void 0) { followWrappedLinesAbove = true; }
        if (followWrappedLinesBelow === void 0) { followWrappedLinesBelow = true; }
        if (coords[0] >= this._terminal.cols) {
            return null;
        }
        var bufferLine = this._buffer.lines.get(coords[1]);
        if (!bufferLine) {
            return null;
        }
        var line = this._buffer.translateBufferLineToString(coords[1], false);
        var startIndex = this._convertViewportColToCharacterIndex(bufferLine, coords);
        var endIndex = startIndex;
        var charOffset = coords[0] - startIndex;
        var leftWideCharCount = 0;
        var rightWideCharCount = 0;
        var leftLongCharOffset = 0;
        var rightLongCharOffset = 0;
        if (line.charAt(startIndex) === ' ') {
            while (startIndex > 0 && line.charAt(startIndex - 1) === ' ') {
                startIndex--;
            }
            while (endIndex < line.length && line.charAt(endIndex + 1) === ' ') {
                endIndex++;
            }
        }
        else {
            var startCol = coords[0];
            var endCol = coords[0];
            if (bufferLine.get(startCol)[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0) {
                leftWideCharCount++;
                startCol--;
            }
            if (bufferLine.get(endCol)[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 2) {
                rightWideCharCount++;
                endCol++;
            }
            if (bufferLine.get(endCol)[Buffer_1.CHAR_DATA_CHAR_INDEX].length > 1) {
                rightLongCharOffset += bufferLine.get(endCol)[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
                endIndex += bufferLine.get(endCol)[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
            }
            while (startCol > 0 && startIndex > 0 && !this._isCharWordSeparator(bufferLine.get(startCol - 1))) {
                var char = bufferLine.get(startCol - 1);
                if (char[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0) {
                    leftWideCharCount++;
                    startCol--;
                }
                else if (char[Buffer_1.CHAR_DATA_CHAR_INDEX].length > 1) {
                    leftLongCharOffset += char[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
                    startIndex -= char[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
                }
                startIndex--;
                startCol--;
            }
            while (endCol < bufferLine.length && endIndex + 1 < line.length && !this._isCharWordSeparator(bufferLine.get(endCol + 1))) {
                var char = bufferLine.get(endCol + 1);
                if (char[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 2) {
                    rightWideCharCount++;
                    endCol++;
                }
                else if (char[Buffer_1.CHAR_DATA_CHAR_INDEX].length > 1) {
                    rightLongCharOffset += char[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
                    endIndex += char[Buffer_1.CHAR_DATA_CHAR_INDEX].length - 1;
                }
                endIndex++;
                endCol++;
            }
        }
        endIndex++;
        var start = startIndex
            + charOffset
            - leftWideCharCount
            + leftLongCharOffset;
        var length = Math.min(this._terminal.cols, endIndex
            - startIndex
            + leftWideCharCount
            + rightWideCharCount
            - leftLongCharOffset
            - rightLongCharOffset);
        if (!allowWhitespaceOnlySelection && line.slice(startIndex, endIndex).trim() === '') {
            return null;
        }
        if (followWrappedLinesAbove) {
            if (start === 0 && bufferLine.get(0)[Buffer_1.CHAR_DATA_CODE_INDEX] !== 32) {
                var previousBufferLine = this._buffer.lines.get(coords[1] - 1);
                if (previousBufferLine && bufferLine.isWrapped && previousBufferLine.get(this._terminal.cols - 1)[Buffer_1.CHAR_DATA_CODE_INDEX] !== 32) {
                    var previousLineWordPosition = this._getWordAt([this._terminal.cols - 1, coords[1] - 1], false, true, false);
                    if (previousLineWordPosition) {
                        var offset = this._terminal.cols - previousLineWordPosition.start;
                        start -= offset;
                        length += offset;
                    }
                }
            }
        }
        if (followWrappedLinesBelow) {
            if (start + length === this._terminal.cols && bufferLine.get(this._terminal.cols - 1)[Buffer_1.CHAR_DATA_CODE_INDEX] !== 32) {
                var nextBufferLine = this._buffer.lines.get(coords[1] + 1);
                if (nextBufferLine && nextBufferLine.isWrapped && nextBufferLine.get(0)[Buffer_1.CHAR_DATA_CODE_INDEX] !== 32) {
                    var nextLineWordPosition = this._getWordAt([0, coords[1] + 1], false, false, true);
                    if (nextLineWordPosition) {
                        length += nextLineWordPosition.length;
                    }
                }
            }
        }
        return { start: start, length: length };
    };
    SelectionManager.prototype._selectWordAt = function (coords, allowWhitespaceOnlySelection) {
        var wordPosition = this._getWordAt(coords, allowWhitespaceOnlySelection);
        if (wordPosition) {
            while (wordPosition.start < 0) {
                wordPosition.start += this._terminal.cols;
                coords[1]--;
            }
            this._model.selectionStart = [wordPosition.start, coords[1]];
            this._model.selectionStartLength = wordPosition.length;
        }
    };
    SelectionManager.prototype._selectToWordAt = function (coords) {
        var wordPosition = this._getWordAt(coords, true);
        if (wordPosition) {
            var endRow = coords[1];
            while (wordPosition.start < 0) {
                wordPosition.start += this._terminal.cols;
                endRow--;
            }
            if (!this._model.areSelectionValuesReversed()) {
                while (wordPosition.start + wordPosition.length > this._terminal.cols) {
                    wordPosition.length -= this._terminal.cols;
                    endRow++;
                }
            }
            this._model.selectionEnd = [this._model.areSelectionValuesReversed() ? wordPosition.start : wordPosition.start + wordPosition.length, endRow];
        }
    };
    SelectionManager.prototype._isCharWordSeparator = function (charData) {
        if (charData[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 0) {
            return false;
        }
        return WORD_SEPARATORS.indexOf(charData[Buffer_1.CHAR_DATA_CHAR_INDEX]) >= 0;
    };
    SelectionManager.prototype._selectLineAt = function (line) {
        var wrappedRange = this._buffer.getWrappedRangeForLine(line);
        this._model.selectionStart = [0, wrappedRange.first];
        this._model.selectionEnd = [this._terminal.cols, wrappedRange.last];
        this._model.selectionStartLength = 0;
    };
    return SelectionManager;
}(EventEmitter_1.EventEmitter));
exports.SelectionManager = SelectionManager;

},{"./Buffer":13,"./SelectionModel":22,"./common/EventEmitter":28,"./handlers/AltClickHandler":33,"./shared/utils/Browser":57,"./utils/MouseHelper":64}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SelectionModel = (function () {
    function SelectionModel(_terminal) {
        this._terminal = _terminal;
        this.clearSelection();
    }
    SelectionModel.prototype.clearSelection = function () {
        this.selectionStart = null;
        this.selectionEnd = null;
        this.isSelectAllActive = false;
        this.selectionStartLength = 0;
    };
    Object.defineProperty(SelectionModel.prototype, "finalSelectionStart", {
        get: function () {
            if (this.isSelectAllActive) {
                return [0, 0];
            }
            if (!this.selectionEnd || !this.selectionStart) {
                return this.selectionStart;
            }
            return this.areSelectionValuesReversed() ? this.selectionEnd : this.selectionStart;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectionModel.prototype, "finalSelectionEnd", {
        get: function () {
            if (this.isSelectAllActive) {
                return [this._terminal.cols, this._terminal.buffer.ybase + this._terminal.rows - 1];
            }
            if (!this.selectionStart) {
                return null;
            }
            if (!this.selectionEnd || this.areSelectionValuesReversed()) {
                var startPlusLength = this.selectionStart[0] + this.selectionStartLength;
                if (startPlusLength > this._terminal.cols) {
                    return [startPlusLength % this._terminal.cols, this.selectionStart[1] + Math.floor(startPlusLength / this._terminal.cols)];
                }
                return [startPlusLength, this.selectionStart[1]];
            }
            if (this.selectionStartLength) {
                if (this.selectionEnd[1] === this.selectionStart[1]) {
                    return [Math.max(this.selectionStart[0] + this.selectionStartLength, this.selectionEnd[0]), this.selectionEnd[1]];
                }
            }
            return this.selectionEnd;
        },
        enumerable: true,
        configurable: true
    });
    SelectionModel.prototype.areSelectionValuesReversed = function () {
        var start = this.selectionStart;
        var end = this.selectionEnd;
        if (!start || !end) {
            return false;
        }
        return start[1] > end[1] || (start[1] === end[1] && start[0] > end[0]);
    };
    SelectionModel.prototype.onTrim = function (amount) {
        if (this.selectionStart) {
            this.selectionStart[1] -= amount;
        }
        if (this.selectionEnd) {
            this.selectionEnd[1] -= amount;
        }
        if (this.selectionEnd && this.selectionEnd[1] < 0) {
            this.clearSelection();
            return true;
        }
        if (this.selectionStart && this.selectionStart[1] < 0) {
            this.selectionStart[1] = 0;
        }
        return false;
    };
    return SelectionModel;
}());
exports.SelectionModel = SelectionModel;

},{}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BELL_SOUND = 'data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAADpAFgCwAMlBZoG/wdmCcoKRAypDQ8PbRDBEQQTOxRtFYcWlBePGIUZXhoiG88bcBz7HHIdzh0WHlMeZx51HmkeUx4WHs8dah0AHXwc3hs9G4saxRnyGBIYGBcQFv8U4RPAEoYRQBACD70NWwwHC6gJOwjWBloF7gOBAhABkf8b/qv8R/ve+Xf4Ife79W/0JfPZ8Z/wde9N7ijtE+wU6xvqM+lb6H7nw+YX5mrlxuQz5Mzje+Ma49fioeKD4nXiYeJy4pHitOL04j/jn+MN5IPkFOWs5U3mDefM55/ogOl36m7rdOyE7abuyu8D8Unyj/Pg9D/2qfcb+Yn6/vuK/Qj/lAAlAg==';
var SoundManager = (function () {
    function SoundManager(_terminal) {
        this._terminal = _terminal;
    }
    SoundManager.prototype.playBellSound = function () {
        var audioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!this._audioContext && audioContextCtor) {
            this._audioContext = new audioContextCtor();
        }
        if (this._audioContext) {
            var bellAudioSource_1 = this._audioContext.createBufferSource();
            var context_1 = this._audioContext;
            this._audioContext.decodeAudioData(this._base64ToArrayBuffer(this._removeMimeType(this._terminal.options.bellSound)), function (buffer) {
                bellAudioSource_1.buffer = buffer;
                bellAudioSource_1.connect(context_1.destination);
                bellAudioSource_1.start(0);
            });
        }
        else {
            console.warn('Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version');
        }
    };
    SoundManager.prototype._base64ToArrayBuffer = function (base64) {
        var binaryString = window.atob(base64);
        var len = binaryString.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };
    SoundManager.prototype._removeMimeType = function (dataURI) {
        var splitUri = dataURI.split(',');
        return splitUri[1];
    };
    return SoundManager;
}());
exports.SoundManager = SoundManager;

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blankLine = 'Blank line';
exports.promptLabel = 'Terminal input';
exports.tooMuchOutput = 'Too much output to announce, navigate to rows manually to read';

},{}],25:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BufferSet_1 = require("./BufferSet");
var Buffer_1 = require("./Buffer");
var CompositionHelper_1 = require("./CompositionHelper");
var EventEmitter_1 = require("./common/EventEmitter");
var Viewport_1 = require("./Viewport");
var Clipboard_1 = require("./handlers/Clipboard");
var EscapeSequences_1 = require("./common/data/EscapeSequences");
var InputHandler_1 = require("./InputHandler");
var Renderer_1 = require("./renderer/Renderer");
var Linkifier_1 = require("./Linkifier");
var SelectionManager_1 = require("./SelectionManager");
var CharMeasure_1 = require("./ui/CharMeasure");
var Browser = require("./shared/utils/Browser");
var Lifecycle_1 = require("./ui/Lifecycle");
var Strings = require("./Strings");
var MouseHelper_1 = require("./utils/MouseHelper");
var Clone_1 = require("./utils/Clone");
var SoundManager_1 = require("./SoundManager");
var ColorManager_1 = require("./renderer/ColorManager");
var MouseZoneManager_1 = require("./ui/MouseZoneManager");
var AccessibilityManager_1 = require("./AccessibilityManager");
var ScreenDprMonitor_1 = require("./ui/ScreenDprMonitor");
var CharAtlasCache_1 = require("./renderer/atlas/CharAtlasCache");
var DomRenderer_1 = require("./renderer/dom/DomRenderer");
var Keyboard_1 = require("./core/input/Keyboard");
var BufferLine_1 = require("./BufferLine");
var document = (typeof window !== 'undefined') ? window.document : null;
var WRITE_BUFFER_PAUSE_THRESHOLD = 5;
var WRITE_BATCH_SIZE = 300;
var CONSTRUCTOR_ONLY_OPTIONS = ['cols', 'rows'];
var DEFAULT_OPTIONS = {
    cols: 80,
    rows: 24,
    convertEol: false,
    termName: 'xterm',
    cursorBlink: false,
    cursorStyle: 'block',
    bellSound: SoundManager_1.DEFAULT_BELL_SOUND,
    bellStyle: 'none',
    drawBoldTextInBrightColors: true,
    enableBold: true,
    experimentalCharAtlas: 'static',
    fontFamily: 'courier-new, courier, monospace',
    fontSize: 15,
    fontWeight: 'normal',
    fontWeightBold: 'bold',
    lineHeight: 1.0,
    letterSpacing: 0,
    scrollback: 1000,
    screenKeys: false,
    screenReaderMode: false,
    debug: false,
    macOptionIsMeta: false,
    macOptionClickForcesSelection: false,
    cancelEvents: false,
    disableStdin: false,
    useFlowControl: false,
    allowTransparency: false,
    tabStopWidth: 8,
    theme: null,
    rightClickSelectsWord: Browser.isMac,
    rendererType: 'canvas'
};
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.browser = Browser;
        _this.options = Clone_1.clone(options);
        _this._setup();
        return _this;
    }
    Terminal.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._customKeyEventHandler = null;
        CharAtlasCache_1.removeTerminalFromCache(this);
        this.handler = function () { };
        this.write = function () { };
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    };
    Terminal.prototype.destroy = function () {
        this.dispose();
    };
    Terminal.prototype._setup = function () {
        var _this = this;
        Object.keys(DEFAULT_OPTIONS).forEach(function (key) {
            if (_this.options[key] === null || _this.options[key] === undefined) {
                _this.options[key] = DEFAULT_OPTIONS[key];
            }
        });
        this._parent = document ? document.body : null;
        this.cols = this.options.cols;
        this.rows = this.options.rows;
        if (this.options.handler) {
            this.on('data', this.options.handler);
        }
        this.cursorState = 0;
        this.cursorHidden = false;
        this._customKeyEventHandler = null;
        this.applicationKeypad = false;
        this.applicationCursor = false;
        this.originMode = false;
        this.insertMode = false;
        this.wraparoundMode = true;
        this.bracketedPasteMode = false;
        this.charset = null;
        this.gcharset = null;
        this.glevel = 0;
        this.charsets = [null];
        this.curAttr = Buffer_1.DEFAULT_ATTR;
        this.params = [];
        this.currentParam = 0;
        this.writeBuffer = [];
        this._writeInProgress = false;
        this._xoffSentToCatchUp = false;
        this._userScrolling = false;
        this._inputHandler = new InputHandler_1.InputHandler(this);
        this.register(this._inputHandler);
        this.renderer = this.renderer || null;
        this.selectionManager = this.selectionManager || null;
        this.linkifier = this.linkifier || new Linkifier_1.Linkifier(this);
        this._mouseZoneManager = this._mouseZoneManager || null;
        this.soundManager = this.soundManager || new SoundManager_1.SoundManager(this);
        this.buffers = new BufferSet_1.BufferSet(this);
        if (this.selectionManager) {
            this.selectionManager.clearSelection();
            this.selectionManager.initBuffersListeners();
        }
    };
    Object.defineProperty(Terminal.prototype, "buffer", {
        get: function () {
            return this.buffers.active;
        },
        enumerable: true,
        configurable: true
    });
    Terminal.prototype.eraseAttr = function () {
        return (Buffer_1.DEFAULT_ATTR & ~0x1ff) | (this.curAttr & 0x1ff);
    };
    Terminal.prototype.focus = function () {
        if (this.textarea) {
            this.textarea.focus();
        }
    };
    Object.defineProperty(Terminal.prototype, "isFocused", {
        get: function () {
            return document.activeElement === this.textarea;
        },
        enumerable: true,
        configurable: true
    });
    Terminal.prototype.getOption = function (key) {
        if (!(key in DEFAULT_OPTIONS)) {
            throw new Error('No option with key "' + key + '"');
        }
        return this.options[key];
    };
    Terminal.prototype.setOption = function (key, value) {
        if (!(key in DEFAULT_OPTIONS)) {
            throw new Error('No option with key "' + key + '"');
        }
        if (CONSTRUCTOR_ONLY_OPTIONS.indexOf(key) !== -1) {
            console.error("Option \"" + key + "\" can only be set in the constructor");
        }
        if (this.options[key] === value) {
            return;
        }
        switch (key) {
            case 'bellStyle':
                if (!value) {
                    value = 'none';
                }
                break;
            case 'cursorStyle':
                if (!value) {
                    value = 'block';
                }
                break;
            case 'fontWeight':
                if (!value) {
                    value = 'normal';
                }
                break;
            case 'fontWeightBold':
                if (!value) {
                    value = 'bold';
                }
                break;
            case 'lineHeight':
                if (value < 1) {
                    console.warn(key + " cannot be less than 1, value: " + value);
                    return;
                }
            case 'rendererType':
                if (!value) {
                    value = 'canvas';
                }
                break;
            case 'tabStopWidth':
                if (value < 1) {
                    console.warn(key + " cannot be less than 1, value: " + value);
                    return;
                }
                break;
            case 'theme':
                if (this.renderer) {
                    this._setTheme(value);
                    return;
                }
                break;
            case 'scrollback':
                value = Math.min(value, Buffer_1.MAX_BUFFER_SIZE);
                if (value < 0) {
                    console.warn(key + " cannot be less than 0, value: " + value);
                    return;
                }
                if (this.options[key] !== value) {
                    var newBufferLength = this.rows + value;
                    if (this.buffer.lines.length > newBufferLength) {
                        var amountToTrim = this.buffer.lines.length - newBufferLength;
                        var needsRefresh = (this.buffer.ydisp - amountToTrim < 0);
                        this.buffer.lines.trimStart(amountToTrim);
                        this.buffer.ybase = Math.max(this.buffer.ybase - amountToTrim, 0);
                        this.buffer.ydisp = Math.max(this.buffer.ydisp - amountToTrim, 0);
                        if (needsRefresh) {
                            this.refresh(0, this.rows - 1);
                        }
                    }
                }
                break;
        }
        this.options[key] = value;
        switch (key) {
            case 'fontFamily':
            case 'fontSize':
                if (this.renderer) {
                    this.renderer.clear();
                    this.charMeasure.measure(this.options);
                }
                break;
            case 'drawBoldTextInBrightColors':
            case 'experimentalCharAtlas':
            case 'enableBold':
            case 'letterSpacing':
            case 'lineHeight':
            case 'fontWeight':
            case 'fontWeightBold':
                if (this.renderer) {
                    this.renderer.clear();
                    this.renderer.onResize(this.cols, this.rows);
                    this.refresh(0, this.rows - 1);
                }
            case 'rendererType':
                if (this.renderer) {
                    this.unregister(this.renderer);
                    this.renderer.dispose();
                    this.renderer = null;
                }
                this._setupRenderer();
                this.renderer.onCharSizeChanged();
                if (this._theme) {
                    this.renderer.setTheme(this._theme);
                }
                break;
            case 'scrollback':
                this.buffers.resize(this.cols, this.rows);
                if (this.viewport) {
                    this.viewport.syncScrollArea();
                }
                break;
            case 'screenReaderMode':
                if (value) {
                    if (!this._accessibilityManager) {
                        this._accessibilityManager = new AccessibilityManager_1.AccessibilityManager(this);
                    }
                }
                else {
                    if (this._accessibilityManager) {
                        this._accessibilityManager.dispose();
                        this._accessibilityManager = null;
                    }
                }
                break;
            case 'tabStopWidth':
                this.buffers.setupTabStops();
                break;
        }
        if (this.renderer) {
            this.renderer.onOptionsChanged();
        }
    };
    Terminal.prototype._onTextAreaFocus = function (ev) {
        if (this.sendFocus) {
            this.handler(EscapeSequences_1.C0.ESC + '[I');
        }
        this.updateCursorStyle(ev);
        this.element.classList.add('focus');
        this.showCursor();
        this.emit('focus');
    };
    Terminal.prototype.blur = function () {
        return this.textarea.blur();
    };
    Terminal.prototype._onTextAreaBlur = function () {
        this.textarea.value = '';
        this.refresh(this.buffer.y, this.buffer.y);
        if (this.sendFocus) {
            this.handler(EscapeSequences_1.C0.ESC + '[O');
        }
        this.element.classList.remove('focus');
        this.emit('blur');
    };
    Terminal.prototype._initGlobal = function () {
        var _this = this;
        this._bindKeys();
        this.register(Lifecycle_1.addDisposableDomListener(this.element, 'copy', function (event) {
            if (!_this.hasSelection()) {
                return;
            }
            Clipboard_1.copyHandler(event, _this, _this.selectionManager);
        }));
        var pasteHandlerWrapper = function (event) { return Clipboard_1.pasteHandler(event, _this); };
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'paste', pasteHandlerWrapper));
        this.register(Lifecycle_1.addDisposableDomListener(this.element, 'paste', pasteHandlerWrapper));
        if (Browser.isFirefox) {
            this.register(Lifecycle_1.addDisposableDomListener(this.element, 'mousedown', function (event) {
                if (event.button === 2) {
                    Clipboard_1.rightClickHandler(event, _this.textarea, _this.selectionManager, _this.options.rightClickSelectsWord);
                }
            }));
        }
        else {
            this.register(Lifecycle_1.addDisposableDomListener(this.element, 'contextmenu', function (event) {
                Clipboard_1.rightClickHandler(event, _this.textarea, _this.selectionManager, _this.options.rightClickSelectsWord);
            }));
        }
        if (Browser.isLinux) {
            this.register(Lifecycle_1.addDisposableDomListener(this.element, 'auxclick', function (event) {
                if (event.button === 1) {
                    Clipboard_1.moveTextAreaUnderMouseCursor(event, _this.textarea);
                }
            }));
        }
    };
    Terminal.prototype._bindKeys = function () {
        var _this = this;
        var self = this;
        this.register(Lifecycle_1.addDisposableDomListener(this.element, 'keydown', function (ev) {
            if (document.activeElement !== this) {
                return;
            }
            self._keyDown(ev);
        }, true));
        this.register(Lifecycle_1.addDisposableDomListener(this.element, 'keypress', function (ev) {
            if (document.activeElement !== this) {
                return;
            }
            self._keyPress(ev);
        }, true));
        this.register(Lifecycle_1.addDisposableDomListener(this.element, 'keyup', function (ev) {
            if (!wasModifierKeyOnlyEvent(ev)) {
                _this.focus();
            }
            self._keyUp(ev);
        }, true));
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'keydown', function (ev) { return _this._keyDown(ev); }, true));
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'keypress', function (ev) { return _this._keyPress(ev); }, true));
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'compositionstart', function () { return _this._compositionHelper.compositionstart(); }));
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'compositionupdate', function (e) { return _this._compositionHelper.compositionupdate(e); }));
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'compositionend', function () { return _this._compositionHelper.compositionend(); }));
        this.register(this.addDisposableListener('refresh', function () { return _this._compositionHelper.updateCompositionElements(); }));
        this.register(this.addDisposableListener('refresh', function (data) { return _this._queueLinkification(data.start, data.end); }));
    };
    Terminal.prototype.open = function (parent) {
        var _this = this;
        this._parent = parent || this._parent;
        if (!this._parent) {
            throw new Error('Terminal requires a parent element.');
        }
        this._context = this._parent.ownerDocument.defaultView;
        this._document = this._parent.ownerDocument;
        this._screenDprMonitor = new ScreenDprMonitor_1.ScreenDprMonitor();
        this._screenDprMonitor.setListener(function () { return _this.emit('dprchange', window.devicePixelRatio); });
        this.register(this._screenDprMonitor);
        this.element = this._document.createElement('div');
        this.element.dir = 'ltr';
        this.element.classList.add('terminal');
        this.element.classList.add('xterm');
        this.element.setAttribute('tabindex', '0');
        this._parent.appendChild(this.element);
        var fragment = document.createDocumentFragment();
        this._viewportElement = document.createElement('div');
        this._viewportElement.classList.add('xterm-viewport');
        fragment.appendChild(this._viewportElement);
        this._viewportScrollArea = document.createElement('div');
        this._viewportScrollArea.classList.add('xterm-scroll-area');
        this._viewportElement.appendChild(this._viewportScrollArea);
        this.screenElement = document.createElement('div');
        this.screenElement.classList.add('xterm-screen');
        this._helperContainer = document.createElement('div');
        this._helperContainer.classList.add('xterm-helpers');
        this.screenElement.appendChild(this._helperContainer);
        fragment.appendChild(this.screenElement);
        this._mouseZoneManager = new MouseZoneManager_1.MouseZoneManager(this);
        this.register(this._mouseZoneManager);
        this.register(this.addDisposableListener('scroll', function () { return _this._mouseZoneManager.clearAll(); }));
        this.linkifier.attachToDom(this._mouseZoneManager);
        this.textarea = document.createElement('textarea');
        this.textarea.classList.add('xterm-helper-textarea');
        this.textarea.setAttribute('aria-label', Strings.promptLabel);
        this.textarea.setAttribute('aria-multiline', 'false');
        this.textarea.setAttribute('autocorrect', 'off');
        this.textarea.setAttribute('autocapitalize', 'off');
        this.textarea.setAttribute('spellcheck', 'false');
        this.textarea.tabIndex = 0;
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'focus', function (ev) { return _this._onTextAreaFocus(ev); }));
        this.register(Lifecycle_1.addDisposableDomListener(this.textarea, 'blur', function () { return _this._onTextAreaBlur(); }));
        this._helperContainer.appendChild(this.textarea);
        this._compositionView = document.createElement('div');
        this._compositionView.classList.add('composition-view');
        this._compositionHelper = new CompositionHelper_1.CompositionHelper(this.textarea, this._compositionView, this);
        this._helperContainer.appendChild(this._compositionView);
        this.charMeasure = new CharMeasure_1.CharMeasure(document, this._helperContainer);
        this.element.appendChild(fragment);
        this._setupRenderer();
        this._theme = this.options.theme;
        this.options.theme = null;
        this.viewport = new Viewport_1.Viewport(this, this._viewportElement, this._viewportScrollArea, this.charMeasure);
        this.viewport.onThemeChanged(this.renderer.colorManager.colors);
        this.register(this.viewport);
        this.register(this.addDisposableListener('cursormove', function () { return _this.renderer.onCursorMove(); }));
        this.register(this.addDisposableListener('resize', function () { return _this.renderer.onResize(_this.cols, _this.rows); }));
        this.register(this.addDisposableListener('blur', function () { return _this.renderer.onBlur(); }));
        this.register(this.addDisposableListener('focus', function () { return _this.renderer.onFocus(); }));
        this.register(this.addDisposableListener('dprchange', function () { return _this.renderer.onWindowResize(window.devicePixelRatio); }));
        this.register(Lifecycle_1.addDisposableDomListener(window, 'resize', function () { return _this.renderer.onWindowResize(window.devicePixelRatio); }));
        this.register(this.charMeasure.addDisposableListener('charsizechanged', function () { return _this.renderer.onCharSizeChanged(); }));
        this.register(this.renderer.addDisposableListener('resize', function (dimensions) { return _this.viewport.syncScrollArea(); }));
        this.selectionManager = new SelectionManager_1.SelectionManager(this, this.charMeasure);
        this.register(Lifecycle_1.addDisposableDomListener(this.element, 'mousedown', function (e) { return _this.selectionManager.onMouseDown(e); }));
        this.register(this.selectionManager.addDisposableListener('refresh', function (data) { return _this.renderer.onSelectionChanged(data.start, data.end, data.columnSelectMode); }));
        this.register(this.selectionManager.addDisposableListener('newselection', function (text) {
            _this.textarea.value = text;
            _this.textarea.focus();
            _this.textarea.select();
        }));
        this.register(this.addDisposableListener('scroll', function () {
            _this.viewport.syncScrollArea();
            _this.selectionManager.refresh();
        }));
        this.register(Lifecycle_1.addDisposableDomListener(this._viewportElement, 'scroll', function () { return _this.selectionManager.refresh(); }));
        this.mouseHelper = new MouseHelper_1.MouseHelper(this.renderer);
        if (this.options.screenReaderMode) {
            this._accessibilityManager = new AccessibilityManager_1.AccessibilityManager(this);
        }
        this.charMeasure.measure(this.options);
        this.refresh(0, this.rows - 1);
        this._initGlobal();
        this.bindMouse();
    };
    Terminal.prototype._setupRenderer = function () {
        switch (this.options.rendererType) {
            case 'canvas':
                this.renderer = new Renderer_1.Renderer(this, this.options.theme);
                break;
            case 'dom':
                this.renderer = new DomRenderer_1.DomRenderer(this, this.options.theme);
                break;
            default: throw new Error("Unrecognized rendererType \"" + this.options.rendererType + "\"");
        }
        this.register(this.renderer);
    };
    Terminal.prototype._setTheme = function (theme) {
        this._theme = theme;
        var colors = this.renderer.setTheme(theme);
        if (this.viewport) {
            this.viewport.onThemeChanged(colors);
        }
    };
    Terminal.prototype.bindMouse = function () {
        var _this = this;
        var el = this.element;
        var self = this;
        var pressed = 32;
        function sendButton(ev) {
            var button;
            var pos;
            button = getButton(ev);
            pos = self.mouseHelper.getRawByteCoords(ev, self.screenElement, self.charMeasure, self.options.lineHeight, self.cols, self.rows);
            if (!pos)
                return;
            sendEvent(button, pos);
            switch (ev.overrideType || ev.type) {
                case 'mousedown':
                    pressed = button;
                    break;
                case 'mouseup':
                    pressed = 32;
                    break;
                case 'wheel':
                    break;
            }
        }
        function sendMove(ev) {
            var button = pressed;
            var pos = self.mouseHelper.getRawByteCoords(ev, self.screenElement, self.charMeasure, self.options.lineHeight, self.cols, self.rows);
            if (!pos)
                return;
            button += 32;
            sendEvent(button, pos);
        }
        function encode(data, ch) {
            if (!self.utfMouse) {
                if (ch === 255) {
                    data.push(0);
                    return;
                }
                if (ch > 127)
                    ch = 127;
                data.push(ch);
            }
            else {
                if (ch === 2047) {
                    data.push(0);
                    return;
                }
                if (ch < 127) {
                    data.push(ch);
                }
                else {
                    if (ch > 2047)
                        ch = 2047;
                    data.push(0xC0 | (ch >> 6));
                    data.push(0x80 | (ch & 0x3F));
                }
            }
        }
        function sendEvent(button, pos) {
            if (self._vt300Mouse) {
                button &= 3;
                pos.x -= 32;
                pos.y -= 32;
                var data_1 = EscapeSequences_1.C0.ESC + '[24';
                if (button === 0)
                    data_1 += '1';
                else if (button === 1)
                    data_1 += '3';
                else if (button === 2)
                    data_1 += '5';
                else if (button === 3)
                    return;
                else
                    data_1 += '0';
                data_1 += '~[' + pos.x + ',' + pos.y + ']\r';
                self.handler(data_1);
                return;
            }
            if (self._decLocator) {
                button &= 3;
                pos.x -= 32;
                pos.y -= 32;
                if (button === 0)
                    button = 2;
                else if (button === 1)
                    button = 4;
                else if (button === 2)
                    button = 6;
                else if (button === 3)
                    button = 3;
                self.handler(EscapeSequences_1.C0.ESC + '['
                    + button
                    + ';'
                    + (button === 3 ? 4 : 0)
                    + ';'
                    + pos.y
                    + ';'
                    + pos.x
                    + ';'
                    + pos.page || 0
                    + '&w');
                return;
            }
            if (self.urxvtMouse) {
                pos.x -= 32;
                pos.y -= 32;
                pos.x++;
                pos.y++;
                self.handler(EscapeSequences_1.C0.ESC + '[' + button + ';' + pos.x + ';' + pos.y + 'M');
                return;
            }
            if (self.sgrMouse) {
                pos.x -= 32;
                pos.y -= 32;
                self.handler(EscapeSequences_1.C0.ESC + '[<'
                    + (((button & 3) === 3 ? button & ~3 : button) - 32)
                    + ';'
                    + pos.x
                    + ';'
                    + pos.y
                    + ((button & 3) === 3 ? 'm' : 'M'));
                return;
            }
            var data = [];
            encode(data, button);
            encode(data, pos.x);
            encode(data, pos.y);
            self.handler(EscapeSequences_1.C0.ESC + '[M' + String.fromCharCode.apply(String, data));
        }
        function getButton(ev) {
            var button;
            var shift;
            var meta;
            var ctrl;
            var mod;
            switch (ev.overrideType || ev.type) {
                case 'mousedown':
                    button = ev.button !== null && ev.button !== undefined
                        ? +ev.button
                        : ev.which !== null && ev.which !== undefined
                            ? ev.which - 1
                            : null;
                    if (Browser.isMSIE) {
                        button = button === 1 ? 0 : button === 4 ? 1 : button;
                    }
                    break;
                case 'mouseup':
                    button = 3;
                    break;
                case 'DOMMouseScroll':
                    button = ev.detail < 0
                        ? 64
                        : 65;
                    break;
                case 'wheel':
                    button = ev.wheelDeltaY > 0
                        ? 64
                        : 65;
                    break;
            }
            shift = ev.shiftKey ? 4 : 0;
            meta = ev.metaKey ? 8 : 0;
            ctrl = ev.ctrlKey ? 16 : 0;
            mod = shift | meta | ctrl;
            if (self.vt200Mouse) {
                mod &= ctrl;
            }
            else if (!self.normalMouse) {
                mod = 0;
            }
            button = (32 + (mod << 2)) + button;
            return button;
        }
        this.register(Lifecycle_1.addDisposableDomListener(el, 'mousedown', function (ev) {
            ev.preventDefault();
            _this.focus();
            if (!_this.mouseEvents || _this.selectionManager.shouldForceSelection(ev)) {
                return;
            }
            sendButton(ev);
            if (_this.vt200Mouse) {
                ev.overrideType = 'mouseup';
                sendButton(ev);
                return _this.cancel(ev);
            }
            var moveHandler;
            if (_this.normalMouse) {
                moveHandler = function (event) {
                    if (!_this.normalMouse) {
                        return;
                    }
                    sendMove(event);
                };
                _this._document.addEventListener('mousemove', moveHandler);
            }
            var handler = function (ev) {
                if (_this.normalMouse && !_this.x10Mouse) {
                    sendButton(ev);
                }
                if (moveHandler) {
                    _this._document.removeEventListener('mousemove', moveHandler);
                    moveHandler = null;
                }
                _this._document.removeEventListener('mouseup', handler);
                return _this.cancel(ev);
            };
            _this._document.addEventListener('mouseup', handler);
            return _this.cancel(ev);
        }));
        this.register(Lifecycle_1.addDisposableDomListener(el, 'wheel', function (ev) {
            if (!_this.mouseEvents) {
                if (!_this.buffer.hasScrollback) {
                    var amount = _this.viewport.getLinesScrolled(ev);
                    if (amount === 0) {
                        return;
                    }
                    var sequence = EscapeSequences_1.C0.ESC + (_this.applicationCursor ? 'O' : '[') + (ev.deltaY < 0 ? 'A' : 'B');
                    var data = '';
                    for (var i = 0; i < Math.abs(amount); i++) {
                        data += sequence;
                    }
                    _this.handler(data);
                }
                return;
            }
            if (_this.x10Mouse || _this._vt300Mouse || _this._decLocator)
                return;
            sendButton(ev);
            ev.preventDefault();
        }));
        this.register(Lifecycle_1.addDisposableDomListener(el, 'wheel', function (ev) {
            if (_this.mouseEvents)
                return;
            _this.viewport.onWheel(ev);
            return _this.cancel(ev);
        }));
        this.register(Lifecycle_1.addDisposableDomListener(el, 'touchstart', function (ev) {
            if (_this.mouseEvents)
                return;
            _this.viewport.onTouchStart(ev);
            return _this.cancel(ev);
        }));
        this.register(Lifecycle_1.addDisposableDomListener(el, 'touchmove', function (ev) {
            if (_this.mouseEvents)
                return;
            _this.viewport.onTouchMove(ev);
            return _this.cancel(ev);
        }));
    };
    Terminal.prototype.refresh = function (start, end) {
        if (this.renderer) {
            this.renderer.refreshRows(start, end);
        }
    };
    Terminal.prototype._queueLinkification = function (start, end) {
        if (this.linkifier) {
            this.linkifier.linkifyRows(start, end);
        }
    };
    Terminal.prototype.updateCursorStyle = function (ev) {
        if (this.selectionManager && this.selectionManager.shouldColumnSelect(ev)) {
            this.element.classList.add('xterm-cursor-crosshair');
        }
        else {
            this.element.classList.remove('xterm-cursor-crosshair');
        }
    };
    Terminal.prototype.showCursor = function () {
        if (!this.cursorState) {
            this.cursorState = 1;
            this.refresh(this.buffer.y, this.buffer.y);
        }
    };
    Terminal.prototype.scroll = function (isWrapped) {
        var newLine = BufferLine_1.BufferLine.blankLine(this.cols, Buffer_1.DEFAULT_ATTR, isWrapped);
        var topRow = this.buffer.ybase + this.buffer.scrollTop;
        var bottomRow = this.buffer.ybase + this.buffer.scrollBottom;
        if (this.buffer.scrollTop === 0) {
            var willBufferBeTrimmed = this.buffer.lines.length === this.buffer.lines.maxLength;
            if (bottomRow === this.buffer.lines.length - 1) {
                this.buffer.lines.push(newLine);
            }
            else {
                this.buffer.lines.splice(bottomRow + 1, 0, newLine);
            }
            if (!willBufferBeTrimmed) {
                this.buffer.ybase++;
                if (!this._userScrolling) {
                    this.buffer.ydisp++;
                }
            }
            else {
                if (this._userScrolling) {
                    this.buffer.ydisp = Math.max(this.buffer.ydisp - 1, 0);
                }
            }
        }
        else {
            var scrollRegionHeight = bottomRow - topRow + 1;
            this.buffer.lines.shiftElements(topRow + 1, scrollRegionHeight - 1, -1);
            this.buffer.lines.set(bottomRow, newLine);
        }
        if (!this._userScrolling) {
            this.buffer.ydisp = this.buffer.ybase;
        }
        this.updateRange(this.buffer.scrollTop);
        this.updateRange(this.buffer.scrollBottom);
        this.emit('scroll', this.buffer.ydisp);
    };
    Terminal.prototype.scrollLines = function (disp, suppressScrollEvent) {
        if (disp < 0) {
            if (this.buffer.ydisp === 0) {
                return;
            }
            this._userScrolling = true;
        }
        else if (disp + this.buffer.ydisp >= this.buffer.ybase) {
            this._userScrolling = false;
        }
        var oldYdisp = this.buffer.ydisp;
        this.buffer.ydisp = Math.max(Math.min(this.buffer.ydisp + disp, this.buffer.ybase), 0);
        if (oldYdisp === this.buffer.ydisp) {
            return;
        }
        if (!suppressScrollEvent) {
            this.emit('scroll', this.buffer.ydisp);
        }
        this.refresh(0, this.rows - 1);
    };
    Terminal.prototype.scrollPages = function (pageCount) {
        this.scrollLines(pageCount * (this.rows - 1));
    };
    Terminal.prototype.scrollToTop = function () {
        this.scrollLines(-this.buffer.ydisp);
    };
    Terminal.prototype.scrollToBottom = function () {
        this.scrollLines(this.buffer.ybase - this.buffer.ydisp);
    };
    Terminal.prototype.scrollToLine = function (line) {
        var scrollAmount = line - this.buffer.ydisp;
        if (scrollAmount !== 0) {
            this.scrollLines(scrollAmount);
        }
    };
    Terminal.prototype.write = function (data) {
        var _this = this;
        if (this._isDisposed) {
            return;
        }
        if (!data) {
            return;
        }
        this.writeBuffer.push(data);
        if (this.options.useFlowControl && !this._xoffSentToCatchUp && this.writeBuffer.length >= WRITE_BUFFER_PAUSE_THRESHOLD) {
            this.handler(EscapeSequences_1.C0.DC3);
            this._xoffSentToCatchUp = true;
        }
        if (!this._writeInProgress && this.writeBuffer.length > 0) {
            this._writeInProgress = true;
            setTimeout(function () {
                _this._innerWrite();
            });
        }
    };
    Terminal.prototype._innerWrite = function () {
        var _this = this;
        if (this._isDisposed) {
            this.writeBuffer = [];
        }
        var writeBatch = this.writeBuffer.splice(0, WRITE_BATCH_SIZE);
        while (writeBatch.length > 0) {
            var data = writeBatch.shift();
            if (this._xoffSentToCatchUp && writeBatch.length === 0 && this.writeBuffer.length === 0) {
                this.handler(EscapeSequences_1.C0.DC1);
                this._xoffSentToCatchUp = false;
            }
            this._refreshStart = this.buffer.y;
            this._refreshEnd = this.buffer.y;
            this._inputHandler.parse(data);
            this.updateRange(this.buffer.y);
            this.refresh(this._refreshStart, this._refreshEnd);
        }
        if (this.writeBuffer.length > 0) {
            setTimeout(function () { return _this._innerWrite(); }, 0);
        }
        else {
            this._writeInProgress = false;
        }
    };
    Terminal.prototype.writeln = function (data) {
        this.write(data + '\r\n');
    };
    Terminal.prototype.attachCustomKeyEventHandler = function (customKeyEventHandler) {
        this._customKeyEventHandler = customKeyEventHandler;
    };
    Terminal.prototype.registerLinkMatcher = function (regex, handler, options) {
        var matcherId = this.linkifier.registerLinkMatcher(regex, handler, options);
        this.refresh(0, this.rows - 1);
        return matcherId;
    };
    Terminal.prototype.deregisterLinkMatcher = function (matcherId) {
        if (this.linkifier.deregisterLinkMatcher(matcherId)) {
            this.refresh(0, this.rows - 1);
        }
    };
    Terminal.prototype.registerCharacterJoiner = function (handler) {
        var joinerId = this.renderer.registerCharacterJoiner(handler);
        this.refresh(0, this.rows - 1);
        return joinerId;
    };
    Terminal.prototype.deregisterCharacterJoiner = function (joinerId) {
        if (this.renderer.deregisterCharacterJoiner(joinerId)) {
            this.refresh(0, this.rows - 1);
        }
    };
    Object.defineProperty(Terminal.prototype, "markers", {
        get: function () {
            return this.buffer.markers;
        },
        enumerable: true,
        configurable: true
    });
    Terminal.prototype.addMarker = function (cursorYOffset) {
        if (this.buffer !== this.buffers.normal) {
            return;
        }
        return this.buffer.addMarker(this.buffer.ybase + this.buffer.y + cursorYOffset);
    };
    Terminal.prototype.hasSelection = function () {
        return this.selectionManager ? this.selectionManager.hasSelection : false;
    };
    Terminal.prototype.getSelection = function () {
        return this.selectionManager ? this.selectionManager.selectionText : '';
    };
    Terminal.prototype.clearSelection = function () {
        if (this.selectionManager) {
            this.selectionManager.clearSelection();
        }
    };
    Terminal.prototype.selectAll = function () {
        if (this.selectionManager) {
            this.selectionManager.selectAll();
        }
    };
    Terminal.prototype.selectLines = function (start, end) {
        if (this.selectionManager) {
            this.selectionManager.selectLines(start, end);
        }
    };
    Terminal.prototype._keyDown = function (event) {
        if (this._customKeyEventHandler && this._customKeyEventHandler(event) === false) {
            return false;
        }
        if (!this._compositionHelper.keydown(event)) {
            if (this.buffer.ybase !== this.buffer.ydisp) {
                this.scrollToBottom();
            }
            return false;
        }
        var result = Keyboard_1.evaluateKeyboardEvent(event, this.applicationCursor, this.browser.isMac, this.options.macOptionIsMeta);
        this.updateCursorStyle(event);
        if (result.type === 3 || result.type === 2) {
            var scrollCount = this.rows - 1;
            this.scrollLines(result.type === 2 ? -scrollCount : scrollCount);
            return this.cancel(event, true);
        }
        if (result.type === 1) {
            this.selectAll();
        }
        if (this._isThirdLevelShift(this.browser, event)) {
            return true;
        }
        if (result.cancel) {
            this.cancel(event, true);
        }
        if (!result.key) {
            return true;
        }
        this.emit('keydown', event);
        this.emit('key', result.key, event);
        this.showCursor();
        this.handler(result.key);
        return this.cancel(event, true);
    };
    Terminal.prototype._isThirdLevelShift = function (browser, ev) {
        var thirdLevelKey = (browser.isMac && !this.options.macOptionIsMeta && ev.altKey && !ev.ctrlKey && !ev.metaKey) ||
            (browser.isMSWindows && ev.altKey && ev.ctrlKey && !ev.metaKey);
        if (ev.type === 'keypress') {
            return thirdLevelKey;
        }
        return thirdLevelKey && (!ev.keyCode || ev.keyCode > 47);
    };
    Terminal.prototype.setgLevel = function (g) {
        this.glevel = g;
        this.charset = this.charsets[g];
    };
    Terminal.prototype.setgCharset = function (g, charset) {
        this.charsets[g] = charset;
        if (this.glevel === g) {
            this.charset = charset;
        }
    };
    Terminal.prototype._keyUp = function (ev) {
        this.updateCursorStyle(ev);
    };
    Terminal.prototype._keyPress = function (ev) {
        var key;
        if (this._customKeyEventHandler && this._customKeyEventHandler(ev) === false) {
            return false;
        }
        this.cancel(ev);
        if (ev.charCode) {
            key = ev.charCode;
        }
        else if (ev.which === null || ev.which === undefined) {
            key = ev.keyCode;
        }
        else if (ev.which !== 0 && ev.charCode !== 0) {
            key = ev.which;
        }
        else {
            return false;
        }
        if (!key || ((ev.altKey || ev.ctrlKey || ev.metaKey) && !this._isThirdLevelShift(this.browser, ev))) {
            return false;
        }
        key = String.fromCharCode(key);
        this.emit('keypress', key, ev);
        this.emit('key', key, ev);
        this.showCursor();
        this.handler(key);
        return true;
    };
    Terminal.prototype.bell = function () {
        var _this = this;
        this.emit('bell');
        if (this._soundBell()) {
            this.soundManager.playBellSound();
        }
        if (this._visualBell()) {
            this.element.classList.add('visual-bell-active');
            clearTimeout(this._visualBellTimer);
            this._visualBellTimer = window.setTimeout(function () {
                _this.element.classList.remove('visual-bell-active');
            }, 200);
        }
    };
    Terminal.prototype.log = function (text, data) {
        if (!this.options.debug)
            return;
        if (!this._context.console || !this._context.console.log)
            return;
        this._context.console.log(text, data);
    };
    Terminal.prototype.error = function (text, data) {
        if (!this.options.debug)
            return;
        if (!this._context.console || !this._context.console.error)
            return;
        this._context.console.error(text, data);
    };
    Terminal.prototype.resize = function (x, y) {
        if (isNaN(x) || isNaN(y)) {
            return;
        }
        if (x === this.cols && y === this.rows) {
            if (this.charMeasure && (!this.charMeasure.width || !this.charMeasure.height)) {
                this.charMeasure.measure(this.options);
            }
            return;
        }
        if (x < 1)
            x = 1;
        if (y < 1)
            y = 1;
        this.buffers.resize(x, y);
        this.cols = x;
        this.rows = y;
        this.buffers.setupTabStops(this.cols);
        if (this.charMeasure) {
            this.charMeasure.measure(this.options);
        }
        this.refresh(0, this.rows - 1);
        this.emit('resize', { cols: x, rows: y });
    };
    Terminal.prototype.updateRange = function (y) {
        if (y < this._refreshStart)
            this._refreshStart = y;
        if (y > this._refreshEnd)
            this._refreshEnd = y;
    };
    Terminal.prototype.maxRange = function () {
        this._refreshStart = 0;
        this._refreshEnd = this.rows - 1;
    };
    Terminal.prototype.clear = function () {
        if (this.buffer.ybase === 0 && this.buffer.y === 0) {
            return;
        }
        this.buffer.lines.set(0, this.buffer.lines.get(this.buffer.ybase + this.buffer.y));
        this.buffer.lines.length = 1;
        this.buffer.ydisp = 0;
        this.buffer.ybase = 0;
        this.buffer.y = 0;
        for (var i = 1; i < this.rows; i++) {
            this.buffer.lines.push(BufferLine_1.BufferLine.blankLine(this.cols, Buffer_1.DEFAULT_ATTR));
        }
        this.refresh(0, this.rows - 1);
        this.emit('scroll', this.buffer.ydisp);
    };
    Terminal.prototype.ch = function (cur) {
        if (cur) {
            return [this.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE];
        }
        return [Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE];
    };
    Terminal.prototype.is = function (term) {
        return (this.options.termName + '').indexOf(term) === 0;
    };
    Terminal.prototype.handler = function (data) {
        if (this.options.disableStdin) {
            return;
        }
        if (this.selectionManager && this.selectionManager.hasSelection) {
            this.selectionManager.clearSelection();
        }
        if (this.buffer.ybase !== this.buffer.ydisp) {
            this.scrollToBottom();
        }
        this.emit('data', data);
    };
    Terminal.prototype.handleTitle = function (title) {
        this.emit('title', title);
    };
    Terminal.prototype.index = function () {
        this.buffer.y++;
        if (this.buffer.y > this.buffer.scrollBottom) {
            this.buffer.y--;
            this.scroll();
        }
        if (this.buffer.x >= this.cols) {
            this.buffer.x--;
        }
    };
    Terminal.prototype.reverseIndex = function () {
        if (this.buffer.y === this.buffer.scrollTop) {
            var scrollRegionHeight = this.buffer.scrollBottom - this.buffer.scrollTop;
            this.buffer.lines.shiftElements(this.buffer.y + this.buffer.ybase, scrollRegionHeight, 1);
            this.buffer.lines.set(this.buffer.y + this.buffer.ybase, BufferLine_1.BufferLine.blankLine(this.cols, this.eraseAttr()));
            this.updateRange(this.buffer.scrollTop);
            this.updateRange(this.buffer.scrollBottom);
        }
        else {
            this.buffer.y--;
        }
    };
    Terminal.prototype.reset = function () {
        this.options.rows = this.rows;
        this.options.cols = this.cols;
        var customKeyEventHandler = this._customKeyEventHandler;
        var inputHandler = this._inputHandler;
        var cursorState = this.cursorState;
        this._setup();
        this._customKeyEventHandler = customKeyEventHandler;
        this._inputHandler = inputHandler;
        this.cursorState = cursorState;
        this.refresh(0, this.rows - 1);
        if (this.viewport) {
            this.viewport.syncScrollArea();
        }
    };
    Terminal.prototype.tabSet = function () {
        this.buffer.tabs[this.buffer.x] = true;
    };
    Terminal.prototype.cancel = function (ev, force) {
        if (!this.options.cancelEvents && !force) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    };
    Terminal.prototype.matchColor = function (r1, g1, b1) {
        var hash = (r1 << 16) | (g1 << 8) | b1;
        if (matchColorCache[hash] !== null && matchColorCache[hash] !== undefined) {
            return matchColorCache[hash];
        }
        var ldiff = Infinity;
        var li = -1;
        var i = 0;
        var c;
        var r2;
        var g2;
        var b2;
        var diff;
        for (; i < ColorManager_1.DEFAULT_ANSI_COLORS.length; i++) {
            c = ColorManager_1.DEFAULT_ANSI_COLORS[i].rgba;
            r2 = c >>> 24;
            g2 = c >>> 16 & 0xFF;
            b2 = c >>> 8 & 0xFF;
            diff = matchColorDistance(r1, g1, b1, r2, g2, b2);
            if (diff === 0) {
                li = i;
                break;
            }
            if (diff < ldiff) {
                ldiff = diff;
                li = i;
            }
        }
        return matchColorCache[hash] = li;
    };
    Terminal.prototype._visualBell = function () {
        return false;
    };
    Terminal.prototype._soundBell = function () {
        return this.options.bellStyle === 'sound';
    };
    return Terminal;
}(EventEmitter_1.EventEmitter));
exports.Terminal = Terminal;
function wasModifierKeyOnlyEvent(ev) {
    return ev.keyCode === 16 ||
        ev.keyCode === 17 ||
        ev.keyCode === 18;
}
var matchColorCache = {};
function matchColorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.pow(30 * (r1 - r2), 2)
        + Math.pow(59 * (g1 - g2), 2)
        + Math.pow(11 * (b1 - b2), 2);
}

},{"./AccessibilityManager":12,"./Buffer":13,"./BufferLine":14,"./BufferSet":15,"./CompositionHelper":17,"./InputHandler":19,"./Linkifier":20,"./SelectionManager":21,"./SoundManager":23,"./Strings":24,"./Viewport":26,"./common/EventEmitter":28,"./common/data/EscapeSequences":30,"./core/input/Keyboard":32,"./handlers/Clipboard":34,"./renderer/ColorManager":38,"./renderer/Renderer":42,"./renderer/atlas/CharAtlasCache":46,"./renderer/dom/DomRenderer":53,"./shared/utils/Browser":57,"./ui/CharMeasure":58,"./ui/Lifecycle":59,"./ui/MouseZoneManager":60,"./ui/ScreenDprMonitor":62,"./utils/Clone":63,"./utils/MouseHelper":64}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Lifecycle_1 = require("./common/Lifecycle");
var Lifecycle_2 = require("./ui/Lifecycle");
var FALLBACK_SCROLL_BAR_WIDTH = 15;
var Viewport = (function (_super) {
    __extends(Viewport, _super);
    function Viewport(_terminal, _viewportElement, _scrollArea, _charMeasure) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._viewportElement = _viewportElement;
        _this._scrollArea = _scrollArea;
        _this._charMeasure = _charMeasure;
        _this.scrollBarWidth = 0;
        _this._currentRowHeight = 0;
        _this._lastRecordedBufferLength = 0;
        _this._lastRecordedViewportHeight = 0;
        _this._lastRecordedBufferHeight = 0;
        _this._lastScrollTop = 0;
        _this._wheelPartialScroll = 0;
        _this._refreshAnimationFrame = null;
        _this._ignoreNextScrollEvent = false;
        _this.scrollBarWidth = (_this._viewportElement.offsetWidth - _this._scrollArea.offsetWidth) || FALLBACK_SCROLL_BAR_WIDTH;
        _this.register(Lifecycle_2.addDisposableDomListener(_this._viewportElement, 'scroll', _this._onScroll.bind(_this)));
        setTimeout(function () { return _this.syncScrollArea(); }, 0);
        return _this;
    }
    Viewport.prototype.onThemeChanged = function (colors) {
        this._viewportElement.style.backgroundColor = colors.background.css;
    };
    Viewport.prototype._refresh = function () {
        var _this = this;
        if (this._refreshAnimationFrame === null) {
            this._refreshAnimationFrame = requestAnimationFrame(function () { return _this._innerRefresh(); });
        }
    };
    Viewport.prototype._innerRefresh = function () {
        if (this._charMeasure.height > 0) {
            this._currentRowHeight = this._terminal.renderer.dimensions.scaledCellHeight / window.devicePixelRatio;
            this._lastRecordedViewportHeight = this._viewportElement.offsetHeight;
            var newBufferHeight = Math.round(this._currentRowHeight * this._lastRecordedBufferLength) + (this._lastRecordedViewportHeight - this._terminal.renderer.dimensions.canvasHeight);
            if (this._lastRecordedBufferHeight !== newBufferHeight) {
                this._lastRecordedBufferHeight = newBufferHeight;
                this._scrollArea.style.height = this._lastRecordedBufferHeight + 'px';
            }
        }
        var scrollTop = this._terminal.buffer.ydisp * this._currentRowHeight;
        if (this._viewportElement.scrollTop !== scrollTop) {
            this._ignoreNextScrollEvent = true;
            this._viewportElement.scrollTop = scrollTop;
        }
        this._refreshAnimationFrame = null;
    };
    Viewport.prototype.syncScrollArea = function () {
        if (this._lastRecordedBufferLength !== this._terminal.buffer.lines.length) {
            this._lastRecordedBufferLength = this._terminal.buffer.lines.length;
            this._refresh();
            return;
        }
        if (this._lastRecordedViewportHeight !== this._terminal.renderer.dimensions.canvasHeight) {
            this._refresh();
            return;
        }
        var newScrollTop = this._terminal.buffer.ydisp * this._currentRowHeight;
        if (this._lastScrollTop !== newScrollTop) {
            this._refresh();
            return;
        }
        if (this._lastScrollTop !== this._viewportElement.scrollTop) {
            this._refresh();
            return;
        }
        if (this._terminal.renderer.dimensions.scaledCellHeight / window.devicePixelRatio !== this._currentRowHeight) {
            this._refresh();
            return;
        }
    };
    Viewport.prototype._onScroll = function (ev) {
        this._lastScrollTop = this._viewportElement.scrollTop;
        if (!this._viewportElement.offsetParent) {
            return;
        }
        if (this._ignoreNextScrollEvent) {
            this._ignoreNextScrollEvent = false;
            return;
        }
        var newRow = Math.round(this._lastScrollTop / this._currentRowHeight);
        var diff = newRow - this._terminal.buffer.ydisp;
        this._terminal.scrollLines(diff, true);
    };
    Viewport.prototype.onWheel = function (ev) {
        var amount = this._getPixelsScrolled(ev);
        if (amount === 0) {
            return;
        }
        this._viewportElement.scrollTop += amount;
        ev.preventDefault();
    };
    Viewport.prototype._getPixelsScrolled = function (ev) {
        if (ev.deltaY === 0) {
            return 0;
        }
        var amount = ev.deltaY;
        if (ev.deltaMode === WheelEvent.DOM_DELTA_LINE) {
            amount *= this._currentRowHeight;
        }
        else if (ev.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            amount *= this._currentRowHeight * this._terminal.rows;
        }
        return amount;
    };
    Viewport.prototype.getLinesScrolled = function (ev) {
        if (ev.deltaY === 0) {
            return 0;
        }
        var amount = ev.deltaY;
        if (ev.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
            amount /= this._currentRowHeight + 0.0;
            this._wheelPartialScroll += amount;
            amount = Math.floor(Math.abs(this._wheelPartialScroll)) * (this._wheelPartialScroll > 0 ? 1 : -1);
            this._wheelPartialScroll %= 1;
        }
        else if (ev.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            amount *= this._terminal.rows;
        }
        return amount;
    };
    Viewport.prototype.onTouchStart = function (ev) {
        this._lastTouchY = ev.touches[0].pageY;
    };
    Viewport.prototype.onTouchMove = function (ev) {
        var deltaY = this._lastTouchY - ev.touches[0].pageY;
        this._lastTouchY = ev.touches[0].pageY;
        if (deltaY === 0) {
            return;
        }
        this._viewportElement.scrollTop += deltaY;
        ev.preventDefault();
    };
    return Viewport;
}(Lifecycle_1.Disposable));
exports.Viewport = Viewport;

},{"./common/Lifecycle":29,"./ui/Lifecycle":59}],27:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter_1 = require("./EventEmitter");
var CircularList = (function (_super) {
    __extends(CircularList, _super);
    function CircularList(_maxLength) {
        var _this = _super.call(this) || this;
        _this._maxLength = _maxLength;
        _this._array = new Array(_this._maxLength);
        _this._startIndex = 0;
        _this._length = 0;
        return _this;
    }
    Object.defineProperty(CircularList.prototype, "maxLength", {
        get: function () {
            return this._maxLength;
        },
        set: function (newMaxLength) {
            if (this._maxLength === newMaxLength) {
                return;
            }
            var newArray = new Array(newMaxLength);
            for (var i = 0; i < Math.min(newMaxLength, this.length); i++) {
                newArray[i] = this._array[this._getCyclicIndex(i)];
            }
            this._array = newArray;
            this._maxLength = newMaxLength;
            this._startIndex = 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CircularList.prototype, "length", {
        get: function () {
            return this._length;
        },
        set: function (newLength) {
            if (newLength > this._length) {
                for (var i = this._length; i < newLength; i++) {
                    this._array[i] = undefined;
                }
            }
            this._length = newLength;
        },
        enumerable: true,
        configurable: true
    });
    CircularList.prototype.get = function (index) {
        return this._array[this._getCyclicIndex(index)];
    };
    CircularList.prototype.set = function (index, value) {
        this._array[this._getCyclicIndex(index)] = value;
    };
    CircularList.prototype.push = function (value) {
        this._array[this._getCyclicIndex(this._length)] = value;
        if (this._length === this._maxLength) {
            this._startIndex++;
            if (this._startIndex === this._maxLength) {
                this._startIndex = 0;
            }
            this.emit('trim', 1);
        }
        else {
            this._length++;
        }
    };
    CircularList.prototype.pop = function () {
        return this._array[this._getCyclicIndex(this._length-- - 1)];
    };
    CircularList.prototype.splice = function (start, deleteCount) {
        var items = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            items[_i - 2] = arguments[_i];
        }
        if (deleteCount) {
            for (var i = start; i < this._length - deleteCount; i++) {
                this._array[this._getCyclicIndex(i)] = this._array[this._getCyclicIndex(i + deleteCount)];
            }
            this._length -= deleteCount;
        }
        if (items && items.length) {
            for (var i = this._length - 1; i >= start; i--) {
                this._array[this._getCyclicIndex(i + items.length)] = this._array[this._getCyclicIndex(i)];
            }
            for (var i = 0; i < items.length; i++) {
                this._array[this._getCyclicIndex(start + i)] = items[i];
            }
            if (this._length + items.length > this.maxLength) {
                var countToTrim = (this._length + items.length) - this.maxLength;
                this._startIndex += countToTrim;
                this._length = this.maxLength;
                this.emit('trim', countToTrim);
            }
            else {
                this._length += items.length;
            }
        }
    };
    CircularList.prototype.trimStart = function (count) {
        if (count > this._length) {
            count = this._length;
        }
        this._startIndex += count;
        this._length -= count;
        this.emit('trim', count);
    };
    CircularList.prototype.shiftElements = function (start, count, offset) {
        if (count <= 0) {
            return;
        }
        if (start < 0 || start >= this._length) {
            throw new Error('start argument out of range');
        }
        if (start + offset < 0) {
            throw new Error('Cannot shift elements in list beyond index 0');
        }
        if (offset > 0) {
            for (var i = count - 1; i >= 0; i--) {
                this.set(start + i + offset, this.get(start + i));
            }
            var expandListBy = (start + count + offset) - this._length;
            if (expandListBy > 0) {
                this._length += expandListBy;
                while (this._length > this.maxLength) {
                    this._length--;
                    this._startIndex++;
                    this.emit('trim', 1);
                }
            }
        }
        else {
            for (var i = 0; i < count; i++) {
                this.set(start + i + offset, this.get(start + i));
            }
        }
    };
    CircularList.prototype._getCyclicIndex = function (index) {
        return (this._startIndex + index) % this.maxLength;
    };
    return CircularList;
}(EventEmitter_1.EventEmitter));
exports.CircularList = CircularList;

},{"./EventEmitter":28}],28:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Lifecycle_1 = require("./Lifecycle");
var EventEmitter = (function (_super) {
    __extends(EventEmitter, _super);
    function EventEmitter() {
        var _this = _super.call(this) || this;
        _this._events = _this._events || {};
        return _this;
    }
    EventEmitter.prototype.on = function (type, listener) {
        this._events[type] = this._events[type] || [];
        this._events[type].push(listener);
    };
    EventEmitter.prototype.addDisposableListener = function (type, handler) {
        var _this = this;
        this.on(type, handler);
        var disposed = false;
        return {
            dispose: function () {
                if (disposed) {
                    return;
                }
                _this.off(type, handler);
                disposed = true;
            }
        };
    };
    EventEmitter.prototype.off = function (type, listener) {
        if (!this._events[type]) {
            return;
        }
        var obj = this._events[type];
        var i = obj.length;
        while (i--) {
            if (obj[i] === listener) {
                obj.splice(i, 1);
                return;
            }
        }
    };
    EventEmitter.prototype.removeAllListeners = function (type) {
        if (this._events[type]) {
            delete this._events[type];
        }
    };
    EventEmitter.prototype.emit = function (type) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this._events[type]) {
            return;
        }
        var obj = this._events[type];
        for (var i = 0; i < obj.length; i++) {
            obj[i].apply(this, args);
        }
    };
    EventEmitter.prototype.listeners = function (type) {
        return this._events[type] || [];
    };
    EventEmitter.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._events = {};
    };
    return EventEmitter;
}(Lifecycle_1.Disposable));
exports.EventEmitter = EventEmitter;

},{"./Lifecycle":29}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Disposable = (function () {
    function Disposable() {
        this._disposables = [];
        this._isDisposed = false;
    }
    Disposable.prototype.dispose = function () {
        this._isDisposed = true;
        this._disposables.forEach(function (d) { return d.dispose(); });
        this._disposables.length = 0;
    };
    Disposable.prototype.register = function (d) {
        this._disposables.push(d);
    };
    Disposable.prototype.unregister = function (d) {
        var index = this._disposables.indexOf(d);
        if (index !== -1) {
            this._disposables.splice(index, 1);
        }
    };
    return Disposable;
}());
exports.Disposable = Disposable;

},{}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var C0;
(function (C0) {
    C0.NUL = '\x00';
    C0.SOH = '\x01';
    C0.STX = '\x02';
    C0.ETX = '\x03';
    C0.EOT = '\x04';
    C0.ENQ = '\x05';
    C0.ACK = '\x06';
    C0.BEL = '\x07';
    C0.BS = '\x08';
    C0.HT = '\x09';
    C0.LF = '\x0a';
    C0.VT = '\x0b';
    C0.FF = '\x0c';
    C0.CR = '\x0d';
    C0.SO = '\x0e';
    C0.SI = '\x0f';
    C0.DLE = '\x10';
    C0.DC1 = '\x11';
    C0.DC2 = '\x12';
    C0.DC3 = '\x13';
    C0.DC4 = '\x14';
    C0.NAK = '\x15';
    C0.SYN = '\x16';
    C0.ETB = '\x17';
    C0.CAN = '\x18';
    C0.EM = '\x19';
    C0.SUB = '\x1a';
    C0.ESC = '\x1b';
    C0.FS = '\x1c';
    C0.GS = '\x1d';
    C0.RS = '\x1e';
    C0.US = '\x1f';
    C0.SP = '\x20';
    C0.DEL = '\x7f';
})(C0 = exports.C0 || (exports.C0 = {}));
var C1;
(function (C1) {
    C1.PAD = '\x80';
    C1.HOP = '\x81';
    C1.BPH = '\x82';
    C1.NBH = '\x83';
    C1.IND = '\x84';
    C1.NEL = '\x85';
    C1.SSA = '\x86';
    C1.ESA = '\x87';
    C1.HTS = '\x88';
    C1.HTJ = '\x89';
    C1.VTS = '\x8a';
    C1.PLD = '\x8b';
    C1.PLU = '\x8c';
    C1.RI = '\x8d';
    C1.SS2 = '\x8e';
    C1.SS3 = '\x8f';
    C1.DCS = '\x90';
    C1.PU1 = '\x91';
    C1.PU2 = '\x92';
    C1.STS = '\x93';
    C1.CCH = '\x94';
    C1.MW = '\x95';
    C1.SPA = '\x96';
    C1.EPA = '\x97';
    C1.SOS = '\x98';
    C1.SGCI = '\x99';
    C1.SCI = '\x9a';
    C1.CSI = '\x9b';
    C1.ST = '\x9c';
    C1.OSC = '\x9d';
    C1.PM = '\x9e';
    C1.APC = '\x9f';
})(C1 = exports.C1 || (exports.C1 = {}));

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHARSETS = {};
exports.DEFAULT_CHARSET = exports.CHARSETS['B'];
exports.CHARSETS['0'] = {
    '`': '\u25c6',
    'a': '\u2592',
    'b': '\u0009',
    'c': '\u000c',
    'd': '\u000d',
    'e': '\u000a',
    'f': '\u00b0',
    'g': '\u00b1',
    'h': '\u2424',
    'i': '\u000b',
    'j': '\u2518',
    'k': '\u2510',
    'l': '\u250c',
    'm': '\u2514',
    'n': '\u253c',
    'o': '\u23ba',
    'p': '\u23bb',
    'q': '\u2500',
    'r': '\u23bc',
    's': '\u23bd',
    't': '\u251c',
    'u': '\u2524',
    'v': '\u2534',
    'w': '\u252c',
    'x': '\u2502',
    'y': '\u2264',
    'z': '\u2265',
    '{': '\u03c0',
    '|': '\u2260',
    '}': '\u00a3',
    '~': '\u00b7'
};
exports.CHARSETS['A'] = {
    '#': '£'
};
exports.CHARSETS['B'] = null;
exports.CHARSETS['4'] = {
    '#': '£',
    '@': '¾',
    '[': 'ij',
    '\\': '½',
    ']': '|',
    '{': '¨',
    '|': 'f',
    '}': '¼',
    '~': '´'
};
exports.CHARSETS['C'] =
    exports.CHARSETS['5'] = {
        '[': 'Ä',
        '\\': 'Ö',
        ']': 'Å',
        '^': 'Ü',
        '`': 'é',
        '{': 'ä',
        '|': 'ö',
        '}': 'å',
        '~': 'ü'
    };
exports.CHARSETS['R'] = {
    '#': '£',
    '@': 'à',
    '[': '°',
    '\\': 'ç',
    ']': '§',
    '{': 'é',
    '|': 'ù',
    '}': 'è',
    '~': '¨'
};
exports.CHARSETS['Q'] = {
    '@': 'à',
    '[': 'â',
    '\\': 'ç',
    ']': 'ê',
    '^': 'î',
    '`': 'ô',
    '{': 'é',
    '|': 'ù',
    '}': 'è',
    '~': 'û'
};
exports.CHARSETS['K'] = {
    '@': '§',
    '[': 'Ä',
    '\\': 'Ö',
    ']': 'Ü',
    '{': 'ä',
    '|': 'ö',
    '}': 'ü',
    '~': 'ß'
};
exports.CHARSETS['Y'] = {
    '#': '£',
    '@': '§',
    '[': '°',
    '\\': 'ç',
    ']': 'é',
    '`': 'ù',
    '{': 'à',
    '|': 'ò',
    '}': 'è',
    '~': 'ì'
};
exports.CHARSETS['E'] =
    exports.CHARSETS['6'] = {
        '@': 'Ä',
        '[': 'Æ',
        '\\': 'Ø',
        ']': 'Å',
        '^': 'Ü',
        '`': 'ä',
        '{': 'æ',
        '|': 'ø',
        '}': 'å',
        '~': 'ü'
    };
exports.CHARSETS['Z'] = {
    '#': '£',
    '@': '§',
    '[': '¡',
    '\\': 'Ñ',
    ']': '¿',
    '{': '°',
    '|': 'ñ',
    '}': 'ç'
};
exports.CHARSETS['H'] =
    exports.CHARSETS['7'] = {
        '@': 'É',
        '[': 'Ä',
        '\\': 'Ö',
        ']': 'Å',
        '^': 'Ü',
        '`': 'é',
        '{': 'ä',
        '|': 'ö',
        '}': 'å',
        '~': 'ü'
    };
exports.CHARSETS['='] = {
    '#': 'ù',
    '@': 'à',
    '[': 'é',
    '\\': 'ç',
    ']': 'ê',
    '^': 'î',
    '_': 'è',
    '`': 'ô',
    '{': 'ä',
    '|': 'ö',
    '}': 'ü',
    '~': 'û'
};

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EscapeSequences_1 = require("../../common/data/EscapeSequences");
var KEYCODE_KEY_MAPPINGS = {
    48: ['0', ')'],
    49: ['1', '!'],
    50: ['2', '@'],
    51: ['3', '#'],
    52: ['4', '$'],
    53: ['5', '%'],
    54: ['6', '^'],
    55: ['7', '&'],
    56: ['8', '*'],
    57: ['9', '('],
    186: [';', ':'],
    187: ['=', '+'],
    188: [',', '<'],
    189: ['-', '_'],
    190: ['.', '>'],
    191: ['/', '?'],
    192: ['`', '~'],
    219: ['[', '{'],
    220: ['\\', '|'],
    221: [']', '}'],
    222: ['\'', '"']
};
function evaluateKeyboardEvent(ev, applicationCursorMode, isMac, macOptionIsMeta) {
    var result = {
        type: 0,
        cancel: false,
        key: undefined
    };
    var modifiers = (ev.shiftKey ? 1 : 0) | (ev.altKey ? 2 : 0) | (ev.ctrlKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
    switch (ev.keyCode) {
        case 0:
            if (ev.key === 'UIKeyInputUpArrow') {
                if (applicationCursorMode) {
                    result.key = EscapeSequences_1.C0.ESC + 'OA';
                }
                else {
                    result.key = EscapeSequences_1.C0.ESC + '[A';
                }
            }
            else if (ev.key === 'UIKeyInputLeftArrow') {
                if (applicationCursorMode) {
                    result.key = EscapeSequences_1.C0.ESC + 'OD';
                }
                else {
                    result.key = EscapeSequences_1.C0.ESC + '[D';
                }
            }
            else if (ev.key === 'UIKeyInputRightArrow') {
                if (applicationCursorMode) {
                    result.key = EscapeSequences_1.C0.ESC + 'OC';
                }
                else {
                    result.key = EscapeSequences_1.C0.ESC + '[C';
                }
            }
            else if (ev.key === 'UIKeyInputDownArrow') {
                if (applicationCursorMode) {
                    result.key = EscapeSequences_1.C0.ESC + 'OB';
                }
                else {
                    result.key = EscapeSequences_1.C0.ESC + '[B';
                }
            }
            break;
        case 8:
            if (ev.shiftKey) {
                result.key = EscapeSequences_1.C0.BS;
                break;
            }
            else if (ev.altKey) {
                result.key = EscapeSequences_1.C0.ESC + EscapeSequences_1.C0.DEL;
                break;
            }
            result.key = EscapeSequences_1.C0.DEL;
            break;
        case 9:
            if (ev.shiftKey) {
                result.key = EscapeSequences_1.C0.ESC + '[Z';
                break;
            }
            result.key = EscapeSequences_1.C0.HT;
            result.cancel = true;
            break;
        case 13:
            result.key = EscapeSequences_1.C0.CR;
            result.cancel = true;
            break;
        case 27:
            result.key = EscapeSequences_1.C0.ESC;
            result.cancel = true;
            break;
        case 37:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'D';
                if (result.key === EscapeSequences_1.C0.ESC + '[1;3D') {
                    result.key = isMac ? EscapeSequences_1.C0.ESC + 'b' : EscapeSequences_1.C0.ESC + '[1;5D';
                }
            }
            else if (applicationCursorMode) {
                result.key = EscapeSequences_1.C0.ESC + 'OD';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[D';
            }
            break;
        case 39:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'C';
                if (result.key === EscapeSequences_1.C0.ESC + '[1;3C') {
                    result.key = isMac ? EscapeSequences_1.C0.ESC + 'f' : EscapeSequences_1.C0.ESC + '[1;5C';
                }
            }
            else if (applicationCursorMode) {
                result.key = EscapeSequences_1.C0.ESC + 'OC';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[C';
            }
            break;
        case 38:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'A';
                if (result.key === EscapeSequences_1.C0.ESC + '[1;3A') {
                    result.key = EscapeSequences_1.C0.ESC + '[1;5A';
                }
            }
            else if (applicationCursorMode) {
                result.key = EscapeSequences_1.C0.ESC + 'OA';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[A';
            }
            break;
        case 40:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'B';
                if (result.key === EscapeSequences_1.C0.ESC + '[1;3B') {
                    result.key = EscapeSequences_1.C0.ESC + '[1;5B';
                }
            }
            else if (applicationCursorMode) {
                result.key = EscapeSequences_1.C0.ESC + 'OB';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[B';
            }
            break;
        case 45:
            if (!ev.shiftKey && !ev.ctrlKey) {
                result.key = EscapeSequences_1.C0.ESC + '[2~';
            }
            break;
        case 46:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[3;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[3~';
            }
            break;
        case 36:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'H';
            }
            else if (applicationCursorMode) {
                result.key = EscapeSequences_1.C0.ESC + 'OH';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[H';
            }
            break;
        case 35:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'F';
            }
            else if (applicationCursorMode) {
                result.key = EscapeSequences_1.C0.ESC + 'OF';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[F';
            }
            break;
        case 33:
            if (ev.shiftKey) {
                result.type = 2;
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[5~';
            }
            break;
        case 34:
            if (ev.shiftKey) {
                result.type = 3;
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[6~';
            }
            break;
        case 112:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'P';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + 'OP';
            }
            break;
        case 113:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'Q';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + 'OQ';
            }
            break;
        case 114:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'R';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + 'OR';
            }
            break;
        case 115:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[1;' + (modifiers + 1) + 'S';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + 'OS';
            }
            break;
        case 116:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[15;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[15~';
            }
            break;
        case 117:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[17;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[17~';
            }
            break;
        case 118:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[18;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[18~';
            }
            break;
        case 119:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[19;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[19~';
            }
            break;
        case 120:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[20;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[20~';
            }
            break;
        case 121:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[21;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[21~';
            }
            break;
        case 122:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[23;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[23~';
            }
            break;
        case 123:
            if (modifiers) {
                result.key = EscapeSequences_1.C0.ESC + '[24;' + (modifiers + 1) + '~';
            }
            else {
                result.key = EscapeSequences_1.C0.ESC + '[24~';
            }
            break;
        default:
            if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey) {
                if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                    result.key = String.fromCharCode(ev.keyCode - 64);
                }
                else if (ev.keyCode === 32) {
                    result.key = String.fromCharCode(0);
                }
                else if (ev.keyCode >= 51 && ev.keyCode <= 55) {
                    result.key = String.fromCharCode(ev.keyCode - 51 + 27);
                }
                else if (ev.keyCode === 56) {
                    result.key = String.fromCharCode(127);
                }
                else if (ev.keyCode === 219) {
                    result.key = String.fromCharCode(27);
                }
                else if (ev.keyCode === 220) {
                    result.key = String.fromCharCode(28);
                }
                else if (ev.keyCode === 221) {
                    result.key = String.fromCharCode(29);
                }
            }
            else if ((!isMac || macOptionIsMeta) && ev.altKey && !ev.metaKey) {
                var keyMapping = KEYCODE_KEY_MAPPINGS[ev.keyCode];
                var key = keyMapping && keyMapping[!ev.shiftKey ? 0 : 1];
                if (key) {
                    result.key = EscapeSequences_1.C0.ESC + key;
                }
                else if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                    var keyCode = ev.ctrlKey ? ev.keyCode - 64 : ev.keyCode + 32;
                    result.key = EscapeSequences_1.C0.ESC + String.fromCharCode(keyCode);
                }
            }
            else if (isMac && !ev.altKey && !ev.ctrlKey && ev.metaKey) {
                if (ev.keyCode === 65) {
                    result.type = 1;
                }
            }
            break;
    }
    return result;
}
exports.evaluateKeyboardEvent = evaluateKeyboardEvent;

},{"../../common/data/EscapeSequences":30}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EscapeSequences_1 = require("../common/data/EscapeSequences");
var AltClickHandler = (function () {
    function AltClickHandler(_mouseEvent, _terminal) {
        var _a;
        this._mouseEvent = _mouseEvent;
        this._terminal = _terminal;
        this._lines = this._terminal.buffer.lines;
        this._startCol = this._terminal.buffer.x;
        this._startRow = this._terminal.buffer.y;
        var coordinates = this._terminal.mouseHelper.getCoords(this._mouseEvent, this._terminal.element, this._terminal.charMeasure, this._terminal.options.lineHeight, this._terminal.cols, this._terminal.rows, false);
        if (coordinates) {
            _a = coordinates.map(function (coordinate) {
                return coordinate - 1;
            }), this._endCol = _a[0], this._endRow = _a[1];
        }
    }
    AltClickHandler.prototype.move = function () {
        if (this._mouseEvent.altKey && this._endCol !== undefined && this._endRow !== undefined) {
            this._terminal.handler(this._arrowSequences());
        }
    };
    AltClickHandler.prototype._arrowSequences = function () {
        if (!this._terminal.buffer.hasScrollback) {
            return this._resetStartingRow() + this._moveToRequestedRow() + this._moveToRequestedCol();
        }
        return this._moveHorizontallyOnly();
    };
    AltClickHandler.prototype._resetStartingRow = function () {
        if (this._moveToRequestedRow().length === 0) {
            return '';
        }
        return repeat(this._bufferLine(this._startCol, this._startRow, this._startCol, this._startRow - this._wrappedRowsForRow(this._startRow), false).length, this._sequence("D"));
    };
    AltClickHandler.prototype._moveToRequestedRow = function () {
        var startRow = this._startRow - this._wrappedRowsForRow(this._startRow);
        var endRow = this._endRow - this._wrappedRowsForRow(this._endRow);
        var rowsToMove = Math.abs(startRow - endRow) - this._wrappedRowsCount();
        return repeat(rowsToMove, this._sequence(this._verticalDirection()));
    };
    AltClickHandler.prototype._moveToRequestedCol = function () {
        var startRow;
        if (this._moveToRequestedRow().length > 0) {
            startRow = this._endRow - this._wrappedRowsForRow(this._endRow);
        }
        else {
            startRow = this._startRow;
        }
        var endRow = this._endRow;
        var direction = this._horizontalDirection();
        return repeat(this._bufferLine(this._startCol, startRow, this._endCol, endRow, direction === "C").length, this._sequence(direction));
    };
    AltClickHandler.prototype._moveHorizontallyOnly = function () {
        var direction = this._horizontalDirection();
        return repeat(Math.abs(this._startCol - this._endCol), this._sequence(direction));
    };
    AltClickHandler.prototype._wrappedRowsCount = function () {
        var wrappedRows = 0;
        var startRow = this._startRow - this._wrappedRowsForRow(this._startRow);
        var endRow = this._endRow - this._wrappedRowsForRow(this._endRow);
        for (var i = 0; i < Math.abs(startRow - endRow); i++) {
            var direction = this._verticalDirection() === "A" ? -1 : 1;
            if (this._lines.get(startRow + (direction * i)).isWrapped) {
                wrappedRows++;
            }
        }
        return wrappedRows;
    };
    AltClickHandler.prototype._wrappedRowsForRow = function (currentRow) {
        var rowCount = 0;
        var lineWraps = this._lines.get(currentRow).isWrapped;
        while (lineWraps && currentRow >= 0 && currentRow < this._terminal.rows) {
            rowCount++;
            currentRow--;
            lineWraps = this._lines.get(currentRow).isWrapped;
        }
        return rowCount;
    };
    AltClickHandler.prototype._horizontalDirection = function () {
        var startRow;
        if (this._moveToRequestedRow().length > 0) {
            startRow = this._endRow - this._wrappedRowsForRow(this._endRow);
        }
        else {
            startRow = this._startRow;
        }
        if ((this._startCol < this._endCol &&
            startRow <= this._endRow) ||
            (this._startCol >= this._endCol &&
                startRow < this._endRow)) {
            return "C";
        }
        return "D";
    };
    AltClickHandler.prototype._verticalDirection = function () {
        if (this._startRow > this._endRow) {
            return "A";
        }
        return "B";
    };
    AltClickHandler.prototype._bufferLine = function (startCol, startRow, endCol, endRow, forward) {
        var currentCol = startCol;
        var currentRow = startRow;
        var bufferStr = '';
        while (currentCol !== endCol || currentRow !== endRow) {
            currentCol += forward ? 1 : -1;
            if (forward && currentCol > this._terminal.cols - 1) {
                bufferStr += this._terminal.buffer.translateBufferLineToString(currentRow, false, startCol, currentCol);
                currentCol = 0;
                startCol = 0;
                currentRow++;
            }
            else if (!forward && currentCol < 0) {
                bufferStr += this._terminal.buffer.translateBufferLineToString(currentRow, false, 0, startCol + 1);
                currentCol = this._terminal.cols - 1;
                startCol = currentCol;
                currentRow--;
            }
        }
        return bufferStr + this._terminal.buffer.translateBufferLineToString(currentRow, false, startCol, currentCol);
    };
    AltClickHandler.prototype._sequence = function (direction) {
        var mod = this._terminal.applicationCursor ? 'O' : '[';
        return EscapeSequences_1.C0.ESC + mod + direction;
    };
    return AltClickHandler;
}());
exports.AltClickHandler = AltClickHandler;
function repeat(count, str) {
    count = Math.floor(count);
    var rpt = '';
    for (var i = 0; i < count; i++) {
        rpt += str;
    }
    return rpt;
}

},{"../common/data/EscapeSequences":30}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function prepareTextForTerminal(text) {
    return text.replace(/\r?\n/g, '\r');
}
exports.prepareTextForTerminal = prepareTextForTerminal;
function bracketTextForPaste(text, bracketedPasteMode) {
    if (bracketedPasteMode) {
        return '\x1b[200~' + text + '\x1b[201~';
    }
    return text;
}
exports.bracketTextForPaste = bracketTextForPaste;
function copyHandler(ev, term, selectionManager) {
    if (term.browser.isMSIE) {
        window.clipboardData.setData('Text', selectionManager.selectionText);
    }
    else {
        ev.clipboardData.setData('text/plain', selectionManager.selectionText);
    }
    ev.preventDefault();
}
exports.copyHandler = copyHandler;
function pasteHandler(ev, term) {
    ev.stopPropagation();
    var text;
    var dispatchPaste = function (text) {
        text = prepareTextForTerminal(text);
        text = bracketTextForPaste(text, term.bracketedPasteMode);
        term.handler(text);
        term.textarea.value = '';
        term.emit('paste', text);
        term.cancel(ev);
    };
    if (term.browser.isMSIE) {
        if (window.clipboardData) {
            text = window.clipboardData.getData('Text');
            dispatchPaste(text);
        }
    }
    else {
        if (ev.clipboardData) {
            text = ev.clipboardData.getData('text/plain');
            dispatchPaste(text);
        }
    }
}
exports.pasteHandler = pasteHandler;
function moveTextAreaUnderMouseCursor(ev, textarea) {
    textarea.style.position = 'fixed';
    textarea.style.width = '20px';
    textarea.style.height = '20px';
    textarea.style.left = (ev.clientX - 10) + 'px';
    textarea.style.top = (ev.clientY - 10) + 'px';
    textarea.style.zIndex = '1000';
    textarea.focus();
    setTimeout(function () {
        textarea.style.position = null;
        textarea.style.width = null;
        textarea.style.height = null;
        textarea.style.left = null;
        textarea.style.top = null;
        textarea.style.zIndex = null;
    }, 200);
}
exports.moveTextAreaUnderMouseCursor = moveTextAreaUnderMouseCursor;
function rightClickHandler(ev, textarea, selectionManager, shouldSelectWord) {
    moveTextAreaUnderMouseCursor(ev, textarea);
    if (shouldSelectWord && !selectionManager.isClickInSelection(ev)) {
        selectionManager.selectWordAtCursor(ev);
    }
    textarea.value = selectionManager.selectionText;
    textarea.select();
}
exports.rightClickHandler = rightClickHandler;

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Terminal_1 = require("../Terminal");
var Strings = require("../Strings");
var Terminal = (function () {
    function Terminal(options) {
        this._core = new Terminal_1.Terminal(options);
    }
    Object.defineProperty(Terminal.prototype, "element", {
        get: function () { return this._core.element; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "textarea", {
        get: function () { return this._core.textarea; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "rows", {
        get: function () { return this._core.rows; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "cols", {
        get: function () { return this._core.cols; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "markers", {
        get: function () { return this._core.markers; },
        enumerable: true,
        configurable: true
    });
    Terminal.prototype.blur = function () {
        this._core.blur();
    };
    Terminal.prototype.focus = function () {
        this._core.focus();
    };
    Terminal.prototype.on = function (type, listener) {
        this._core.on(type, listener);
    };
    Terminal.prototype.off = function (type, listener) {
        this._core.off(type, listener);
    };
    Terminal.prototype.emit = function (type, data) {
        this._core.emit(type, data);
    };
    Terminal.prototype.addDisposableListener = function (type, handler) {
        return this._core.addDisposableListener(type, handler);
    };
    Terminal.prototype.resize = function (columns, rows) {
        this._core.resize(columns, rows);
    };
    Terminal.prototype.writeln = function (data) {
        this._core.writeln(data);
    };
    Terminal.prototype.open = function (parent) {
        this._core.open(parent);
    };
    Terminal.prototype.attachCustomKeyEventHandler = function (customKeyEventHandler) {
        this._core.attachCustomKeyEventHandler(customKeyEventHandler);
    };
    Terminal.prototype.registerLinkMatcher = function (regex, handler, options) {
        return this._core.registerLinkMatcher(regex, handler, options);
    };
    Terminal.prototype.deregisterLinkMatcher = function (matcherId) {
        this._core.deregisterLinkMatcher(matcherId);
    };
    Terminal.prototype.registerCharacterJoiner = function (handler) {
        return this._core.registerCharacterJoiner(handler);
    };
    Terminal.prototype.deregisterCharacterJoiner = function (joinerId) {
        this._core.deregisterCharacterJoiner(joinerId);
    };
    Terminal.prototype.addMarker = function (cursorYOffset) {
        return this._core.addMarker(cursorYOffset);
    };
    Terminal.prototype.hasSelection = function () {
        return this._core.hasSelection();
    };
    Terminal.prototype.getSelection = function () {
        return this._core.getSelection();
    };
    Terminal.prototype.clearSelection = function () {
        this._core.clearSelection();
    };
    Terminal.prototype.selectAll = function () {
        this._core.selectAll();
    };
    Terminal.prototype.selectLines = function (start, end) {
        this._core.selectLines(start, end);
    };
    Terminal.prototype.dispose = function () {
        this._core.dispose();
    };
    Terminal.prototype.destroy = function () {
        this._core.destroy();
    };
    Terminal.prototype.scrollLines = function (amount) {
        this._core.scrollLines(amount);
    };
    Terminal.prototype.scrollPages = function (pageCount) {
        this._core.scrollPages(pageCount);
    };
    Terminal.prototype.scrollToTop = function () {
        this._core.scrollToTop();
    };
    Terminal.prototype.scrollToBottom = function () {
        this._core.scrollToBottom();
    };
    Terminal.prototype.scrollToLine = function (line) {
        this._core.scrollToLine(line);
    };
    Terminal.prototype.clear = function () {
        this._core.clear();
    };
    Terminal.prototype.write = function (data) {
        this._core.write(data);
    };
    Terminal.prototype.getOption = function (key) {
        return this._core.getOption(key);
    };
    Terminal.prototype.setOption = function (key, value) {
        this._core.setOption(key, value);
    };
    Terminal.prototype.refresh = function (start, end) {
        this._core.refresh(start, end);
    };
    Terminal.prototype.reset = function () {
        this._core.reset();
    };
    Terminal.applyAddon = function (addon) {
        addon.apply(Terminal);
    };
    Object.defineProperty(Terminal, "strings", {
        get: function () {
            return Strings;
        },
        enumerable: true,
        configurable: true
    });
    return Terminal;
}());
exports.Terminal = Terminal;

},{"../Strings":24,"../Terminal":25}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Types_1 = require("./atlas/Types");
var CharAtlasCache_1 = require("./atlas/CharAtlasCache");
var Buffer_1 = require("../Buffer");
var BaseRenderLayer = (function () {
    function BaseRenderLayer(_container, id, zIndex, _alpha, _colors) {
        this._container = _container;
        this._alpha = _alpha;
        this._colors = _colors;
        this._scaledCharWidth = 0;
        this._scaledCharHeight = 0;
        this._scaledCellWidth = 0;
        this._scaledCellHeight = 0;
        this._scaledCharLeft = 0;
        this._scaledCharTop = 0;
        this._currentGlyphIdentifier = {
            chars: '',
            code: 0,
            bg: 0,
            fg: 0,
            bold: false,
            dim: false,
            italic: false
        };
        this._canvas = document.createElement('canvas');
        this._canvas.classList.add("xterm-" + id + "-layer");
        this._canvas.style.zIndex = zIndex.toString();
        this._initCanvas();
        this._container.appendChild(this._canvas);
    }
    BaseRenderLayer.prototype.dispose = function () {
        this._container.removeChild(this._canvas);
        if (this._charAtlas) {
            this._charAtlas.dispose();
        }
    };
    BaseRenderLayer.prototype._initCanvas = function () {
        this._ctx = this._canvas.getContext('2d', { alpha: this._alpha });
        if (!this._alpha) {
            this.clearAll();
        }
    };
    BaseRenderLayer.prototype.onOptionsChanged = function (terminal) { };
    BaseRenderLayer.prototype.onBlur = function (terminal) { };
    BaseRenderLayer.prototype.onFocus = function (terminal) { };
    BaseRenderLayer.prototype.onCursorMove = function (terminal) { };
    BaseRenderLayer.prototype.onGridChanged = function (terminal, startRow, endRow) { };
    BaseRenderLayer.prototype.onSelectionChanged = function (terminal, start, end, columnSelectMode) {
        if (columnSelectMode === void 0) { columnSelectMode = false; }
    };
    BaseRenderLayer.prototype.onThemeChanged = function (terminal, colorSet) {
        this._refreshCharAtlas(terminal, colorSet);
    };
    BaseRenderLayer.prototype.setTransparency = function (terminal, alpha) {
        if (alpha === this._alpha) {
            return;
        }
        var oldCanvas = this._canvas;
        this._alpha = alpha;
        this._canvas = this._canvas.cloneNode();
        this._initCanvas();
        this._container.replaceChild(this._canvas, oldCanvas);
        this._refreshCharAtlas(terminal, this._colors);
        this.onGridChanged(terminal, 0, terminal.rows - 1);
    };
    BaseRenderLayer.prototype._refreshCharAtlas = function (terminal, colorSet) {
        if (this._scaledCharWidth <= 0 && this._scaledCharHeight <= 0) {
            return;
        }
        this._charAtlas = CharAtlasCache_1.acquireCharAtlas(terminal, colorSet, this._scaledCharWidth, this._scaledCharHeight);
        this._charAtlas.warmUp();
    };
    BaseRenderLayer.prototype.resize = function (terminal, dim) {
        this._scaledCellWidth = dim.scaledCellWidth;
        this._scaledCellHeight = dim.scaledCellHeight;
        this._scaledCharWidth = dim.scaledCharWidth;
        this._scaledCharHeight = dim.scaledCharHeight;
        this._scaledCharLeft = dim.scaledCharLeft;
        this._scaledCharTop = dim.scaledCharTop;
        this._canvas.width = dim.scaledCanvasWidth;
        this._canvas.height = dim.scaledCanvasHeight;
        this._canvas.style.width = dim.canvasWidth + "px";
        this._canvas.style.height = dim.canvasHeight + "px";
        if (!this._alpha) {
            this.clearAll();
        }
        this._refreshCharAtlas(terminal, this._colors);
    };
    BaseRenderLayer.prototype.fillCells = function (x, y, width, height) {
        this._ctx.fillRect(x * this._scaledCellWidth, y * this._scaledCellHeight, width * this._scaledCellWidth, height * this._scaledCellHeight);
    };
    BaseRenderLayer.prototype.fillBottomLineAtCells = function (x, y, width) {
        if (width === void 0) { width = 1; }
        this._ctx.fillRect(x * this._scaledCellWidth, (y + 1) * this._scaledCellHeight - window.devicePixelRatio - 1, width * this._scaledCellWidth, window.devicePixelRatio);
    };
    BaseRenderLayer.prototype.fillLeftLineAtCell = function (x, y) {
        this._ctx.fillRect(x * this._scaledCellWidth, y * this._scaledCellHeight, window.devicePixelRatio, this._scaledCellHeight);
    };
    BaseRenderLayer.prototype.strokeRectAtCell = function (x, y, width, height) {
        this._ctx.lineWidth = window.devicePixelRatio;
        this._ctx.strokeRect(x * this._scaledCellWidth + window.devicePixelRatio / 2, y * this._scaledCellHeight + (window.devicePixelRatio / 2), width * this._scaledCellWidth - window.devicePixelRatio, (height * this._scaledCellHeight) - window.devicePixelRatio);
    };
    BaseRenderLayer.prototype.clearAll = function () {
        if (this._alpha) {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        else {
            this._ctx.fillStyle = this._colors.background.css;
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        }
    };
    BaseRenderLayer.prototype.clearCells = function (x, y, width, height) {
        if (this._alpha) {
            this._ctx.clearRect(x * this._scaledCellWidth, y * this._scaledCellHeight, width * this._scaledCellWidth, height * this._scaledCellHeight);
        }
        else {
            this._ctx.fillStyle = this._colors.background.css;
            this._ctx.fillRect(x * this._scaledCellWidth, y * this._scaledCellHeight, width * this._scaledCellWidth, height * this._scaledCellHeight);
        }
    };
    BaseRenderLayer.prototype.fillCharTrueColor = function (terminal, charData, x, y) {
        this._ctx.font = this._getFont(terminal, false, false);
        this._ctx.textBaseline = 'top';
        this._clipRow(terminal, y);
        this._ctx.fillText(charData[Buffer_1.CHAR_DATA_CHAR_INDEX], x * this._scaledCellWidth + this._scaledCharLeft, y * this._scaledCellHeight + this._scaledCharTop);
    };
    BaseRenderLayer.prototype.drawChars = function (terminal, chars, code, width, x, y, fg, bg, bold, dim, italic) {
        var drawInBrightColor = terminal.options.drawBoldTextInBrightColors && bold && fg < 8 && fg !== Types_1.INVERTED_DEFAULT_COLOR;
        fg += drawInBrightColor ? 8 : 0;
        this._currentGlyphIdentifier.chars = chars;
        this._currentGlyphIdentifier.code = code;
        this._currentGlyphIdentifier.bg = bg;
        this._currentGlyphIdentifier.fg = fg;
        this._currentGlyphIdentifier.bold = bold && terminal.options.enableBold;
        this._currentGlyphIdentifier.dim = dim;
        this._currentGlyphIdentifier.italic = italic;
        var atlasDidDraw = this._charAtlas && this._charAtlas.draw(this._ctx, this._currentGlyphIdentifier, x * this._scaledCellWidth + this._scaledCharLeft, y * this._scaledCellHeight + this._scaledCharTop);
        if (!atlasDidDraw) {
            this._drawUncachedChars(terminal, chars, width, fg, x, y, bold && terminal.options.enableBold, dim, italic);
        }
    };
    BaseRenderLayer.prototype._drawUncachedChars = function (terminal, chars, width, fg, x, y, bold, dim, italic) {
        this._ctx.save();
        this._ctx.font = this._getFont(terminal, bold, italic);
        this._ctx.textBaseline = 'top';
        if (fg === Types_1.INVERTED_DEFAULT_COLOR) {
            this._ctx.fillStyle = this._colors.background.css;
        }
        else if (fg < 256) {
            this._ctx.fillStyle = this._colors.ansi[fg].css;
        }
        else {
            this._ctx.fillStyle = this._colors.foreground.css;
        }
        this._clipRow(terminal, y);
        if (dim) {
            this._ctx.globalAlpha = Types_1.DIM_OPACITY;
        }
        this._ctx.fillText(chars, x * this._scaledCellWidth + this._scaledCharLeft, y * this._scaledCellHeight + this._scaledCharTop);
        this._ctx.restore();
    };
    BaseRenderLayer.prototype._clipRow = function (terminal, y) {
        this._ctx.beginPath();
        this._ctx.rect(0, y * this._scaledCellHeight, terminal.cols * this._scaledCellWidth, this._scaledCellHeight);
        this._ctx.clip();
    };
    BaseRenderLayer.prototype._getFont = function (terminal, isBold, isItalic) {
        var fontWeight = isBold ? terminal.options.fontWeightBold : terminal.options.fontWeight;
        var fontStyle = isItalic ? 'italic' : '';
        return fontStyle + " " + fontWeight + " " + terminal.options.fontSize * window.devicePixelRatio + "px " + terminal.options.fontFamily;
    };
    return BaseRenderLayer;
}());
exports.BaseRenderLayer = BaseRenderLayer;

},{"../Buffer":13,"./atlas/CharAtlasCache":46,"./atlas/Types":52}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("../Buffer");
var CharacterJoinerRegistry = (function () {
    function CharacterJoinerRegistry(_terminal) {
        this._terminal = _terminal;
        this._characterJoiners = [];
        this._nextCharacterJoinerId = 0;
    }
    CharacterJoinerRegistry.prototype.registerCharacterJoiner = function (handler) {
        var joiner = {
            id: this._nextCharacterJoinerId++,
            handler: handler
        };
        this._characterJoiners.push(joiner);
        return joiner.id;
    };
    CharacterJoinerRegistry.prototype.deregisterCharacterJoiner = function (joinerId) {
        for (var i = 0; i < this._characterJoiners.length; i++) {
            if (this._characterJoiners[i].id === joinerId) {
                this._characterJoiners.splice(i, 1);
                return true;
            }
        }
        return false;
    };
    CharacterJoinerRegistry.prototype.getJoinedCharacters = function (row) {
        if (this._characterJoiners.length === 0) {
            return [];
        }
        var line = this._terminal.buffer.lines.get(row);
        if (line.length === 0) {
            return [];
        }
        var ranges = [];
        var lineStr = this._terminal.buffer.translateBufferLineToString(row, true);
        var rangeStartColumn = 0;
        var currentStringIndex = 0;
        var rangeStartStringIndex = 0;
        var rangeAttr = line.get(0)[Buffer_1.CHAR_DATA_ATTR_INDEX] >> 9;
        for (var x = 0; x < this._terminal.cols; x++) {
            var charData = line.get(x);
            var chars = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
            var width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
            var attr = charData[Buffer_1.CHAR_DATA_ATTR_INDEX] >> 9;
            if (width === 0) {
                continue;
            }
            if (attr !== rangeAttr) {
                if (x - rangeStartColumn > 1) {
                    var joinedRanges = this._getJoinedRanges(lineStr, rangeStartStringIndex, currentStringIndex, line, rangeStartColumn);
                    for (var i = 0; i < joinedRanges.length; i++) {
                        ranges.push(joinedRanges[i]);
                    }
                }
                rangeStartColumn = x;
                rangeStartStringIndex = currentStringIndex;
                rangeAttr = attr;
            }
            currentStringIndex += chars.length;
        }
        if (this._terminal.cols - rangeStartColumn > 1) {
            var joinedRanges = this._getJoinedRanges(lineStr, rangeStartStringIndex, currentStringIndex, line, rangeStartColumn);
            for (var i = 0; i < joinedRanges.length; i++) {
                ranges.push(joinedRanges[i]);
            }
        }
        return ranges;
    };
    CharacterJoinerRegistry.prototype._getJoinedRanges = function (line, startIndex, endIndex, lineData, startCol) {
        var text = line.substring(startIndex, endIndex);
        var joinedRanges = this._characterJoiners[0].handler(text);
        for (var i = 1; i < this._characterJoiners.length; i++) {
            var joinerRanges = this._characterJoiners[i].handler(text);
            for (var j = 0; j < joinerRanges.length; j++) {
                CharacterJoinerRegistry._mergeRanges(joinedRanges, joinerRanges[j]);
            }
        }
        this._stringRangesToCellRanges(joinedRanges, lineData, startCol);
        return joinedRanges;
    };
    CharacterJoinerRegistry.prototype._stringRangesToCellRanges = function (ranges, line, startCol) {
        var currentRangeIndex = 0;
        var currentRangeStarted = false;
        var currentStringIndex = 0;
        var currentRange = ranges[currentRangeIndex];
        if (!currentRange) {
            return;
        }
        for (var x = startCol; x < this._terminal.cols; x++) {
            var charData = line.get(x);
            var width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
            var length_1 = charData[Buffer_1.CHAR_DATA_CHAR_INDEX].length;
            if (width === 0) {
                continue;
            }
            if (!currentRangeStarted && currentRange[0] <= currentStringIndex) {
                currentRange[0] = x;
                currentRangeStarted = true;
            }
            if (currentRange[1] <= currentStringIndex) {
                currentRange[1] = x;
                currentRange = ranges[++currentRangeIndex];
                if (!currentRange) {
                    break;
                }
                if (currentRange[0] <= currentStringIndex) {
                    currentRange[0] = x;
                    currentRangeStarted = true;
                }
                else {
                    currentRangeStarted = false;
                }
            }
            currentStringIndex += length_1;
        }
        if (currentRange) {
            currentRange[1] = this._terminal.cols;
        }
    };
    CharacterJoinerRegistry._mergeRanges = function (ranges, newRange) {
        var inRange = false;
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            if (!inRange) {
                if (newRange[1] <= range[0]) {
                    ranges.splice(i, 0, newRange);
                    return ranges;
                }
                if (newRange[1] <= range[1]) {
                    range[0] = Math.min(newRange[0], range[0]);
                    return ranges;
                }
                if (newRange[0] < range[1]) {
                    range[0] = Math.min(newRange[0], range[0]);
                    inRange = true;
                }
                continue;
            }
            else {
                if (newRange[1] <= range[0]) {
                    ranges[i - 1][1] = newRange[1];
                    return ranges;
                }
                if (newRange[1] <= range[1]) {
                    ranges[i - 1][1] = Math.max(newRange[1], range[1]);
                    ranges.splice(i, 1);
                    inRange = false;
                    return ranges;
                }
                ranges.splice(i, 1);
                i--;
            }
        }
        if (inRange) {
            ranges[ranges.length - 1][1] = newRange[1];
        }
        else {
            ranges.push(newRange);
        }
        return ranges;
    };
    return CharacterJoinerRegistry;
}());
exports.CharacterJoinerRegistry = CharacterJoinerRegistry;

},{"../Buffer":13}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DEFAULT_FOREGROUND = fromHex('#ffffff');
var DEFAULT_BACKGROUND = fromHex('#000000');
var DEFAULT_CURSOR = fromHex('#ffffff');
var DEFAULT_CURSOR_ACCENT = fromHex('#000000');
var DEFAULT_SELECTION = {
    css: 'rgba(255, 255, 255, 0.3)',
    rgba: 0xFFFFFF77
};
exports.DEFAULT_ANSI_COLORS = (function () {
    var colors = [
        fromHex('#2e3436'),
        fromHex('#cc0000'),
        fromHex('#4e9a06'),
        fromHex('#c4a000'),
        fromHex('#3465a4'),
        fromHex('#75507b'),
        fromHex('#06989a'),
        fromHex('#d3d7cf'),
        fromHex('#555753'),
        fromHex('#ef2929'),
        fromHex('#8ae234'),
        fromHex('#fce94f'),
        fromHex('#729fcf'),
        fromHex('#ad7fa8'),
        fromHex('#34e2e2'),
        fromHex('#eeeeec')
    ];
    var v = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];
    for (var i = 0; i < 216; i++) {
        var r = v[(i / 36) % 6 | 0];
        var g = v[(i / 6) % 6 | 0];
        var b = v[i % 6];
        colors.push({
            css: "#" + toPaddedHex(r) + toPaddedHex(g) + toPaddedHex(b),
            rgba: ((r << 24) | (g << 16) | (b << 8) | 0xFF) >>> 0
        });
    }
    for (var i = 0; i < 24; i++) {
        var c = 8 + i * 10;
        var ch = toPaddedHex(c);
        colors.push({
            css: "#" + ch + ch + ch,
            rgba: ((c << 24) | (c << 16) | (c << 8) | 0xFF) >>> 0
        });
    }
    return colors;
})();
function fromHex(css) {
    return {
        css: css,
        rgba: parseInt(css.slice(1), 16) << 8 | 0xFF
    };
}
function toPaddedHex(c) {
    var s = c.toString(16);
    return s.length < 2 ? '0' + s : s;
}
var ColorManager = (function () {
    function ColorManager(document, allowTransparency) {
        this.allowTransparency = allowTransparency;
        var canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        this._ctx = canvas.getContext('2d');
        this._ctx.globalCompositeOperation = 'copy';
        this._litmusColor = this._ctx.createLinearGradient(0, 0, 1, 1);
        this.colors = {
            foreground: DEFAULT_FOREGROUND,
            background: DEFAULT_BACKGROUND,
            cursor: DEFAULT_CURSOR,
            cursorAccent: DEFAULT_CURSOR_ACCENT,
            selection: DEFAULT_SELECTION,
            ansi: exports.DEFAULT_ANSI_COLORS.slice()
        };
    }
    ColorManager.prototype.setTheme = function (theme) {
        this.colors.foreground = this._parseColor(theme.foreground, DEFAULT_FOREGROUND);
        this.colors.background = this._parseColor(theme.background, DEFAULT_BACKGROUND);
        this.colors.cursor = this._parseColor(theme.cursor, DEFAULT_CURSOR, true);
        this.colors.cursorAccent = this._parseColor(theme.cursorAccent, DEFAULT_CURSOR_ACCENT, true);
        this.colors.selection = this._parseColor(theme.selection, DEFAULT_SELECTION, true);
        this.colors.ansi[0] = this._parseColor(theme.black, exports.DEFAULT_ANSI_COLORS[0]);
        this.colors.ansi[1] = this._parseColor(theme.red, exports.DEFAULT_ANSI_COLORS[1]);
        this.colors.ansi[2] = this._parseColor(theme.green, exports.DEFAULT_ANSI_COLORS[2]);
        this.colors.ansi[3] = this._parseColor(theme.yellow, exports.DEFAULT_ANSI_COLORS[3]);
        this.colors.ansi[4] = this._parseColor(theme.blue, exports.DEFAULT_ANSI_COLORS[4]);
        this.colors.ansi[5] = this._parseColor(theme.magenta, exports.DEFAULT_ANSI_COLORS[5]);
        this.colors.ansi[6] = this._parseColor(theme.cyan, exports.DEFAULT_ANSI_COLORS[6]);
        this.colors.ansi[7] = this._parseColor(theme.white, exports.DEFAULT_ANSI_COLORS[7]);
        this.colors.ansi[8] = this._parseColor(theme.brightBlack, exports.DEFAULT_ANSI_COLORS[8]);
        this.colors.ansi[9] = this._parseColor(theme.brightRed, exports.DEFAULT_ANSI_COLORS[9]);
        this.colors.ansi[10] = this._parseColor(theme.brightGreen, exports.DEFAULT_ANSI_COLORS[10]);
        this.colors.ansi[11] = this._parseColor(theme.brightYellow, exports.DEFAULT_ANSI_COLORS[11]);
        this.colors.ansi[12] = this._parseColor(theme.brightBlue, exports.DEFAULT_ANSI_COLORS[12]);
        this.colors.ansi[13] = this._parseColor(theme.brightMagenta, exports.DEFAULT_ANSI_COLORS[13]);
        this.colors.ansi[14] = this._parseColor(theme.brightCyan, exports.DEFAULT_ANSI_COLORS[14]);
        this.colors.ansi[15] = this._parseColor(theme.brightWhite, exports.DEFAULT_ANSI_COLORS[15]);
    };
    ColorManager.prototype._parseColor = function (css, fallback, allowTransparency) {
        if (allowTransparency === void 0) { allowTransparency = this.allowTransparency; }
        if (!css) {
            return fallback;
        }
        this._ctx.fillStyle = this._litmusColor;
        this._ctx.fillStyle = css;
        if (typeof this._ctx.fillStyle !== 'string') {
            console.warn("Color: " + css + " is invalid using fallback " + fallback.css);
            return fallback;
        }
        this._ctx.fillRect(0, 0, 1, 1);
        var data = this._ctx.getImageData(0, 0, 1, 1).data;
        if (!allowTransparency && data[3] !== 0xFF) {
            console.warn("Color: " + css + " is using transparency, but allowTransparency is false. " +
                ("Using fallback " + fallback.css + "."));
            return fallback;
        }
        return {
            css: css,
            rgba: (data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3]) >>> 0
        };
    };
    return ColorManager;
}());
exports.ColorManager = ColorManager;

},{}],39:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("../Buffer");
var BaseRenderLayer_1 = require("./BaseRenderLayer");
var BLINK_INTERVAL = 600;
var CursorRenderLayer = (function (_super) {
    __extends(CursorRenderLayer, _super);
    function CursorRenderLayer(container, zIndex, colors) {
        var _this = _super.call(this, container, 'cursor', zIndex, true, colors) || this;
        _this._state = {
            x: null,
            y: null,
            isFocused: null,
            style: null,
            width: null
        };
        _this._cursorRenderers = {
            'bar': _this._renderBarCursor.bind(_this),
            'block': _this._renderBlockCursor.bind(_this),
            'underline': _this._renderUnderlineCursor.bind(_this)
        };
        return _this;
    }
    CursorRenderLayer.prototype.resize = function (terminal, dim) {
        _super.prototype.resize.call(this, terminal, dim);
        this._state = {
            x: null,
            y: null,
            isFocused: null,
            style: null,
            width: null
        };
    };
    CursorRenderLayer.prototype.reset = function (terminal) {
        this._clearCursor();
        if (this._cursorBlinkStateManager) {
            this._cursorBlinkStateManager.dispose();
            this._cursorBlinkStateManager = null;
            this.onOptionsChanged(terminal);
        }
    };
    CursorRenderLayer.prototype.onBlur = function (terminal) {
        if (this._cursorBlinkStateManager) {
            this._cursorBlinkStateManager.pause();
        }
        terminal.refresh(terminal.buffer.y, terminal.buffer.y);
    };
    CursorRenderLayer.prototype.onFocus = function (terminal) {
        if (this._cursorBlinkStateManager) {
            this._cursorBlinkStateManager.resume(terminal);
        }
        else {
            terminal.refresh(terminal.buffer.y, terminal.buffer.y);
        }
    };
    CursorRenderLayer.prototype.onOptionsChanged = function (terminal) {
        var _this = this;
        if (terminal.options.cursorBlink) {
            if (!this._cursorBlinkStateManager) {
                this._cursorBlinkStateManager = new CursorBlinkStateManager(terminal, function () {
                    _this._render(terminal, true);
                });
            }
        }
        else {
            if (this._cursorBlinkStateManager) {
                this._cursorBlinkStateManager.dispose();
                this._cursorBlinkStateManager = null;
            }
            terminal.refresh(terminal.buffer.y, terminal.buffer.y);
        }
    };
    CursorRenderLayer.prototype.onCursorMove = function (terminal) {
        if (this._cursorBlinkStateManager) {
            this._cursorBlinkStateManager.restartBlinkAnimation(terminal);
        }
    };
    CursorRenderLayer.prototype.onGridChanged = function (terminal, startRow, endRow) {
        if (!this._cursorBlinkStateManager || this._cursorBlinkStateManager.isPaused) {
            this._render(terminal, false);
        }
        else {
            this._cursorBlinkStateManager.restartBlinkAnimation(terminal);
        }
    };
    CursorRenderLayer.prototype._render = function (terminal, triggeredByAnimationFrame) {
        if (!terminal.cursorState || terminal.cursorHidden) {
            this._clearCursor();
            return;
        }
        var cursorY = terminal.buffer.ybase + terminal.buffer.y;
        var viewportRelativeCursorY = cursorY - terminal.buffer.ydisp;
        if (viewportRelativeCursorY < 0 || viewportRelativeCursorY >= terminal.rows) {
            this._clearCursor();
            return;
        }
        var charData = terminal.buffer.lines.get(cursorY).get(terminal.buffer.x);
        if (!charData) {
            return;
        }
        if (!terminal.isFocused) {
            this._clearCursor();
            this._ctx.save();
            this._ctx.fillStyle = this._colors.cursor.css;
            this._renderBlurCursor(terminal, terminal.buffer.x, viewportRelativeCursorY, charData);
            this._ctx.restore();
            this._state.x = terminal.buffer.x;
            this._state.y = viewportRelativeCursorY;
            this._state.isFocused = false;
            this._state.style = terminal.options.cursorStyle;
            this._state.width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
            return;
        }
        if (this._cursorBlinkStateManager && !this._cursorBlinkStateManager.isCursorVisible) {
            this._clearCursor();
            return;
        }
        if (this._state) {
            if (this._state.x === terminal.buffer.x &&
                this._state.y === viewportRelativeCursorY &&
                this._state.isFocused === terminal.isFocused &&
                this._state.style === terminal.options.cursorStyle &&
                this._state.width === charData[Buffer_1.CHAR_DATA_WIDTH_INDEX]) {
                return;
            }
            this._clearCursor();
        }
        this._ctx.save();
        this._cursorRenderers[terminal.options.cursorStyle || 'block'](terminal, terminal.buffer.x, viewportRelativeCursorY, charData);
        this._ctx.restore();
        this._state.x = terminal.buffer.x;
        this._state.y = viewportRelativeCursorY;
        this._state.isFocused = false;
        this._state.style = terminal.options.cursorStyle;
        this._state.width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
    };
    CursorRenderLayer.prototype._clearCursor = function () {
        if (this._state) {
            this.clearCells(this._state.x, this._state.y, this._state.width, 1);
            this._state = {
                x: null,
                y: null,
                isFocused: null,
                style: null,
                width: null
            };
        }
    };
    CursorRenderLayer.prototype._renderBarCursor = function (terminal, x, y, charData) {
        this._ctx.save();
        this._ctx.fillStyle = this._colors.cursor.css;
        this.fillLeftLineAtCell(x, y);
        this._ctx.restore();
    };
    CursorRenderLayer.prototype._renderBlockCursor = function (terminal, x, y, charData) {
        this._ctx.save();
        this._ctx.fillStyle = this._colors.cursor.css;
        this.fillCells(x, y, charData[Buffer_1.CHAR_DATA_WIDTH_INDEX], 1);
        this._ctx.fillStyle = this._colors.cursorAccent.css;
        this.fillCharTrueColor(terminal, charData, x, y);
        this._ctx.restore();
    };
    CursorRenderLayer.prototype._renderUnderlineCursor = function (terminal, x, y, charData) {
        this._ctx.save();
        this._ctx.fillStyle = this._colors.cursor.css;
        this.fillBottomLineAtCells(x, y);
        this._ctx.restore();
    };
    CursorRenderLayer.prototype._renderBlurCursor = function (terminal, x, y, charData) {
        this._ctx.save();
        this._ctx.strokeStyle = this._colors.cursor.css;
        this.strokeRectAtCell(x, y, charData[Buffer_1.CHAR_DATA_WIDTH_INDEX], 1);
        this._ctx.restore();
    };
    return CursorRenderLayer;
}(BaseRenderLayer_1.BaseRenderLayer));
exports.CursorRenderLayer = CursorRenderLayer;
var CursorBlinkStateManager = (function () {
    function CursorBlinkStateManager(terminal, _renderCallback) {
        this._renderCallback = _renderCallback;
        this.isCursorVisible = true;
        if (terminal.isFocused) {
            this._restartInterval();
        }
    }
    Object.defineProperty(CursorBlinkStateManager.prototype, "isPaused", {
        get: function () { return !(this._blinkStartTimeout || this._blinkInterval); },
        enumerable: true,
        configurable: true
    });
    CursorBlinkStateManager.prototype.dispose = function () {
        if (this._blinkInterval) {
            window.clearInterval(this._blinkInterval);
            this._blinkInterval = null;
        }
        if (this._blinkStartTimeout) {
            window.clearTimeout(this._blinkStartTimeout);
            this._blinkStartTimeout = null;
        }
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    };
    CursorBlinkStateManager.prototype.restartBlinkAnimation = function (terminal) {
        var _this = this;
        if (this.isPaused) {
            return;
        }
        this._animationTimeRestarted = Date.now();
        this.isCursorVisible = true;
        if (!this._animationFrame) {
            this._animationFrame = window.requestAnimationFrame(function () {
                _this._renderCallback();
                _this._animationFrame = null;
            });
        }
    };
    CursorBlinkStateManager.prototype._restartInterval = function (timeToStart) {
        var _this = this;
        if (timeToStart === void 0) { timeToStart = BLINK_INTERVAL; }
        if (this._blinkInterval) {
            window.clearInterval(this._blinkInterval);
        }
        this._blinkStartTimeout = setTimeout(function () {
            if (_this._animationTimeRestarted) {
                var time = BLINK_INTERVAL - (Date.now() - _this._animationTimeRestarted);
                _this._animationTimeRestarted = null;
                if (time > 0) {
                    _this._restartInterval(time);
                    return;
                }
            }
            _this.isCursorVisible = false;
            _this._animationFrame = window.requestAnimationFrame(function () {
                _this._renderCallback();
                _this._animationFrame = null;
            });
            _this._blinkInterval = setInterval(function () {
                if (_this._animationTimeRestarted) {
                    var time = BLINK_INTERVAL - (Date.now() - _this._animationTimeRestarted);
                    _this._animationTimeRestarted = null;
                    _this._restartInterval(time);
                    return;
                }
                _this.isCursorVisible = !_this.isCursorVisible;
                _this._animationFrame = window.requestAnimationFrame(function () {
                    _this._renderCallback();
                    _this._animationFrame = null;
                });
            }, BLINK_INTERVAL);
        }, timeToStart);
    };
    CursorBlinkStateManager.prototype.pause = function () {
        this.isCursorVisible = true;
        if (this._blinkInterval) {
            window.clearInterval(this._blinkInterval);
            this._blinkInterval = null;
        }
        if (this._blinkStartTimeout) {
            window.clearTimeout(this._blinkStartTimeout);
            this._blinkStartTimeout = null;
        }
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    };
    CursorBlinkStateManager.prototype.resume = function (terminal) {
        this._animationTimeRestarted = null;
        this._restartInterval();
        this.restartBlinkAnimation(terminal);
    };
    return CursorBlinkStateManager;
}());

},{"../Buffer":13,"./BaseRenderLayer":36}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GridCache = (function () {
    function GridCache() {
        this.cache = [];
    }
    GridCache.prototype.resize = function (width, height) {
        for (var x = 0; x < width; x++) {
            if (this.cache.length <= x) {
                this.cache.push([]);
            }
            for (var y = this.cache[x].length; y < height; y++) {
                this.cache[x].push(null);
            }
            this.cache[x].length = height;
        }
        this.cache.length = width;
    };
    GridCache.prototype.clear = function () {
        for (var x = 0; x < this.cache.length; x++) {
            for (var y = 0; y < this.cache[x].length; y++) {
                this.cache[x][y] = null;
            }
        }
    };
    return GridCache;
}());
exports.GridCache = GridCache;

},{}],41:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BaseRenderLayer_1 = require("./BaseRenderLayer");
var Types_1 = require("./atlas/Types");
var LinkRenderLayer = (function (_super) {
    __extends(LinkRenderLayer, _super);
    function LinkRenderLayer(container, zIndex, colors, terminal) {
        var _this = _super.call(this, container, 'link', zIndex, true, colors) || this;
        _this._state = null;
        terminal.linkifier.on("linkhover", function (e) { return _this._onLinkHover(e); });
        terminal.linkifier.on("linkleave", function (e) { return _this._onLinkLeave(e); });
        return _this;
    }
    LinkRenderLayer.prototype.resize = function (terminal, dim) {
        _super.prototype.resize.call(this, terminal, dim);
        this._state = null;
    };
    LinkRenderLayer.prototype.reset = function (terminal) {
        this._clearCurrentLink();
    };
    LinkRenderLayer.prototype._clearCurrentLink = function () {
        if (this._state) {
            this.clearCells(this._state.x1, this._state.y1, this._state.cols - this._state.x1, 1);
            var middleRowCount = this._state.y2 - this._state.y1 - 1;
            if (middleRowCount > 0) {
                this.clearCells(0, this._state.y1 + 1, this._state.cols, middleRowCount);
            }
            this.clearCells(0, this._state.y2, this._state.x2, 1);
            this._state = null;
        }
    };
    LinkRenderLayer.prototype._onLinkHover = function (e) {
        if (e.fg === Types_1.INVERTED_DEFAULT_COLOR) {
            this._ctx.fillStyle = this._colors.background.css;
        }
        else if (e.fg < 256) {
            this._ctx.fillStyle = this._colors.ansi[e.fg].css;
        }
        else {
            this._ctx.fillStyle = this._colors.foreground.css;
        }
        if (e.y1 === e.y2) {
            this.fillBottomLineAtCells(e.x1, e.y1, e.x2 - e.x1);
        }
        else {
            this.fillBottomLineAtCells(e.x1, e.y1, e.cols - e.x1);
            for (var y = e.y1 + 1; y < e.y2; y++) {
                this.fillBottomLineAtCells(0, y, e.cols);
            }
            this.fillBottomLineAtCells(0, e.y2, e.x2);
        }
        this._state = e;
    };
    LinkRenderLayer.prototype._onLinkLeave = function (e) {
        this._clearCurrentLink();
    };
    return LinkRenderLayer;
}(BaseRenderLayer_1.BaseRenderLayer));
exports.LinkRenderLayer = LinkRenderLayer;

},{"./BaseRenderLayer":36,"./atlas/Types":52}],42:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var TextRenderLayer_1 = require("./TextRenderLayer");
var SelectionRenderLayer_1 = require("./SelectionRenderLayer");
var CursorRenderLayer_1 = require("./CursorRenderLayer");
var ColorManager_1 = require("./ColorManager");
var LinkRenderLayer_1 = require("./LinkRenderLayer");
var EventEmitter_1 = require("../common/EventEmitter");
var RenderDebouncer_1 = require("../ui/RenderDebouncer");
var ScreenDprMonitor_1 = require("../ui/ScreenDprMonitor");
var CharacterJoinerRegistry_1 = require("../renderer/CharacterJoinerRegistry");
var Renderer = (function (_super) {
    __extends(Renderer, _super);
    function Renderer(_terminal, theme) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._isPaused = false;
        _this._needsFullRefresh = false;
        var allowTransparency = _this._terminal.options.allowTransparency;
        _this.colorManager = new ColorManager_1.ColorManager(document, allowTransparency);
        _this._characterJoinerRegistry = new CharacterJoinerRegistry_1.CharacterJoinerRegistry(_terminal);
        if (theme) {
            _this.colorManager.setTheme(theme);
        }
        _this._renderLayers = [
            new TextRenderLayer_1.TextRenderLayer(_this._terminal.screenElement, 0, _this.colorManager.colors, _this._characterJoinerRegistry, allowTransparency),
            new SelectionRenderLayer_1.SelectionRenderLayer(_this._terminal.screenElement, 1, _this.colorManager.colors),
            new LinkRenderLayer_1.LinkRenderLayer(_this._terminal.screenElement, 2, _this.colorManager.colors, _this._terminal),
            new CursorRenderLayer_1.CursorRenderLayer(_this._terminal.screenElement, 3, _this.colorManager.colors)
        ];
        _this.dimensions = {
            scaledCharWidth: null,
            scaledCharHeight: null,
            scaledCellWidth: null,
            scaledCellHeight: null,
            scaledCharLeft: null,
            scaledCharTop: null,
            scaledCanvasWidth: null,
            scaledCanvasHeight: null,
            canvasWidth: null,
            canvasHeight: null,
            actualCellWidth: null,
            actualCellHeight: null
        };
        _this._devicePixelRatio = window.devicePixelRatio;
        _this._updateDimensions();
        _this.onOptionsChanged();
        _this._renderDebouncer = new RenderDebouncer_1.RenderDebouncer(_this._terminal, _this._renderRows.bind(_this));
        _this._screenDprMonitor = new ScreenDprMonitor_1.ScreenDprMonitor();
        _this._screenDprMonitor.setListener(function () { return _this.onWindowResize(window.devicePixelRatio); });
        _this.register(_this._screenDprMonitor);
        if ('IntersectionObserver' in window) {
            var observer_1 = new IntersectionObserver(function (e) { return _this.onIntersectionChange(e[0]); }, { threshold: 0 });
            observer_1.observe(_this._terminal.element);
            _this.register({ dispose: function () { return observer_1.disconnect(); } });
        }
        return _this;
    }
    Renderer.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._renderLayers.forEach(function (l) { return l.dispose(); });
    };
    Renderer.prototype.onIntersectionChange = function (entry) {
        this._isPaused = entry.intersectionRatio === 0;
        if (!this._isPaused && this._needsFullRefresh) {
            this._terminal.refresh(0, this._terminal.rows - 1);
        }
    };
    Renderer.prototype.onWindowResize = function (devicePixelRatio) {
        if (this._devicePixelRatio !== devicePixelRatio) {
            this._devicePixelRatio = devicePixelRatio;
            this.onResize(this._terminal.cols, this._terminal.rows);
        }
    };
    Renderer.prototype.setTheme = function (theme) {
        var _this = this;
        this.colorManager.setTheme(theme);
        this._renderLayers.forEach(function (l) {
            l.onThemeChanged(_this._terminal, _this.colorManager.colors);
            l.reset(_this._terminal);
        });
        if (this._isPaused) {
            this._needsFullRefresh = true;
        }
        else {
            this._terminal.refresh(0, this._terminal.rows - 1);
        }
        return this.colorManager.colors;
    };
    Renderer.prototype.onResize = function (cols, rows) {
        var _this = this;
        this._updateDimensions();
        this._renderLayers.forEach(function (l) { return l.resize(_this._terminal, _this.dimensions); });
        if (this._isPaused) {
            this._needsFullRefresh = true;
        }
        else {
            this._terminal.refresh(0, this._terminal.rows - 1);
        }
        this._terminal.screenElement.style.width = this.dimensions.canvasWidth + "px";
        this._terminal.screenElement.style.height = this.dimensions.canvasHeight + "px";
        this.emit('resize', {
            width: this.dimensions.canvasWidth,
            height: this.dimensions.canvasHeight
        });
    };
    Renderer.prototype.onCharSizeChanged = function () {
        this.onResize(this._terminal.cols, this._terminal.rows);
    };
    Renderer.prototype.onBlur = function () {
        var _this = this;
        this._runOperation(function (l) { return l.onBlur(_this._terminal); });
    };
    Renderer.prototype.onFocus = function () {
        var _this = this;
        this._runOperation(function (l) { return l.onFocus(_this._terminal); });
    };
    Renderer.prototype.onSelectionChanged = function (start, end, columnSelectMode) {
        var _this = this;
        if (columnSelectMode === void 0) { columnSelectMode = false; }
        this._runOperation(function (l) { return l.onSelectionChanged(_this._terminal, start, end, columnSelectMode); });
    };
    Renderer.prototype.onCursorMove = function () {
        var _this = this;
        this._runOperation(function (l) { return l.onCursorMove(_this._terminal); });
    };
    Renderer.prototype.onOptionsChanged = function () {
        var _this = this;
        this.colorManager.allowTransparency = this._terminal.options.allowTransparency;
        this._runOperation(function (l) { return l.onOptionsChanged(_this._terminal); });
    };
    Renderer.prototype.clear = function () {
        var _this = this;
        this._runOperation(function (l) { return l.reset(_this._terminal); });
    };
    Renderer.prototype._runOperation = function (operation) {
        if (this._isPaused) {
            this._needsFullRefresh = true;
        }
        else {
            this._renderLayers.forEach(function (l) { return operation(l); });
        }
    };
    Renderer.prototype.refreshRows = function (start, end) {
        if (this._isPaused) {
            this._needsFullRefresh = true;
            return;
        }
        this._renderDebouncer.refresh(start, end);
    };
    Renderer.prototype._renderRows = function (start, end) {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onGridChanged(_this._terminal, start, end); });
        this._terminal.emit('refresh', { start: start, end: end });
    };
    Renderer.prototype._updateDimensions = function () {
        if (!this._terminal.charMeasure.width || !this._terminal.charMeasure.height) {
            return;
        }
        this.dimensions.scaledCharWidth = Math.floor(this._terminal.charMeasure.width * window.devicePixelRatio);
        this.dimensions.scaledCharHeight = Math.ceil(this._terminal.charMeasure.height * window.devicePixelRatio);
        this.dimensions.scaledCellHeight = Math.floor(this.dimensions.scaledCharHeight * this._terminal.options.lineHeight);
        this.dimensions.scaledCharTop = this._terminal.options.lineHeight === 1 ? 0 : Math.round((this.dimensions.scaledCellHeight - this.dimensions.scaledCharHeight) / 2);
        this.dimensions.scaledCellWidth = this.dimensions.scaledCharWidth + Math.round(this._terminal.options.letterSpacing);
        this.dimensions.scaledCharLeft = Math.floor(this._terminal.options.letterSpacing / 2);
        this.dimensions.scaledCanvasHeight = this._terminal.rows * this.dimensions.scaledCellHeight;
        this.dimensions.scaledCanvasWidth = this._terminal.cols * this.dimensions.scaledCellWidth;
        this.dimensions.canvasHeight = Math.round(this.dimensions.scaledCanvasHeight / window.devicePixelRatio);
        this.dimensions.canvasWidth = Math.round(this.dimensions.scaledCanvasWidth / window.devicePixelRatio);
        this.dimensions.actualCellHeight = this.dimensions.canvasHeight / this._terminal.rows;
        this.dimensions.actualCellWidth = this.dimensions.canvasWidth / this._terminal.cols;
    };
    Renderer.prototype.registerCharacterJoiner = function (handler) {
        return this._characterJoinerRegistry.registerCharacterJoiner(handler);
    };
    Renderer.prototype.deregisterCharacterJoiner = function (joinerId) {
        return this._characterJoinerRegistry.deregisterCharacterJoiner(joinerId);
    };
    return Renderer;
}(EventEmitter_1.EventEmitter));
exports.Renderer = Renderer;

},{"../common/EventEmitter":28,"../renderer/CharacterJoinerRegistry":37,"../ui/RenderDebouncer":61,"../ui/ScreenDprMonitor":62,"./ColorManager":38,"./CursorRenderLayer":39,"./LinkRenderLayer":41,"./SelectionRenderLayer":43,"./TextRenderLayer":44}],43:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BaseRenderLayer_1 = require("./BaseRenderLayer");
var SelectionRenderLayer = (function (_super) {
    __extends(SelectionRenderLayer, _super);
    function SelectionRenderLayer(container, zIndex, colors) {
        var _this = _super.call(this, container, 'selection', zIndex, true, colors) || this;
        _this._clearState();
        return _this;
    }
    SelectionRenderLayer.prototype._clearState = function () {
        this._state = {
            start: null,
            end: null,
            columnSelectMode: null,
            ydisp: null
        };
    };
    SelectionRenderLayer.prototype.resize = function (terminal, dim) {
        _super.prototype.resize.call(this, terminal, dim);
        this._clearState();
    };
    SelectionRenderLayer.prototype.reset = function (terminal) {
        if (this._state.start && this._state.end) {
            this._clearState();
            this.clearAll();
        }
    };
    SelectionRenderLayer.prototype.onSelectionChanged = function (terminal, start, end, columnSelectMode) {
        if (!this._didStateChange(start, end, columnSelectMode, terminal.buffer.ydisp)) {
            return;
        }
        this.clearAll();
        if (!start || !end) {
            return;
        }
        var viewportStartRow = start[1] - terminal.buffer.ydisp;
        var viewportEndRow = end[1] - terminal.buffer.ydisp;
        var viewportCappedStartRow = Math.max(viewportStartRow, 0);
        var viewportCappedEndRow = Math.min(viewportEndRow, terminal.rows - 1);
        if (viewportCappedStartRow >= terminal.rows || viewportCappedEndRow < 0) {
            return;
        }
        this._ctx.fillStyle = this._colors.selection.css;
        if (columnSelectMode) {
            var startCol = start[0];
            var width = end[0] - startCol;
            var height = viewportCappedEndRow - viewportCappedStartRow + 1;
            this.fillCells(startCol, viewportCappedStartRow, width, height);
        }
        else {
            var startCol = viewportStartRow === viewportCappedStartRow ? start[0] : 0;
            var startRowEndCol = viewportCappedStartRow === viewportCappedEndRow ? end[0] : terminal.cols;
            this.fillCells(startCol, viewportCappedStartRow, startRowEndCol - startCol, 1);
            var middleRowsCount = Math.max(viewportCappedEndRow - viewportCappedStartRow - 1, 0);
            this.fillCells(0, viewportCappedStartRow + 1, terminal.cols, middleRowsCount);
            if (viewportCappedStartRow !== viewportCappedEndRow) {
                var endCol = viewportEndRow === viewportCappedEndRow ? end[0] : terminal.cols;
                this.fillCells(0, viewportCappedEndRow, endCol, 1);
            }
        }
        this._state.start = [start[0], start[1]];
        this._state.end = [end[0], end[1]];
        this._state.columnSelectMode = columnSelectMode;
        this._state.ydisp = terminal.buffer.ydisp;
    };
    SelectionRenderLayer.prototype._didStateChange = function (start, end, columnSelectMode, ydisp) {
        return !this._areCoordinatesEqual(start, this._state.start) ||
            !this._areCoordinatesEqual(end, this._state.end) ||
            columnSelectMode !== this._state.columnSelectMode ||
            ydisp !== this._state.ydisp;
    };
    SelectionRenderLayer.prototype._areCoordinatesEqual = function (coord1, coord2) {
        if (!coord1 || !coord2) {
            return false;
        }
        return coord1[0] === coord2[0] && coord1[1] === coord2[1];
    };
    return SelectionRenderLayer;
}(BaseRenderLayer_1.BaseRenderLayer));
exports.SelectionRenderLayer = SelectionRenderLayer;

},{"./BaseRenderLayer":36}],44:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("../Buffer");
var Types_1 = require("./atlas/Types");
var GridCache_1 = require("./GridCache");
var BaseRenderLayer_1 = require("./BaseRenderLayer");
var TextRenderLayer = (function (_super) {
    __extends(TextRenderLayer, _super);
    function TextRenderLayer(container, zIndex, colors, characterJoinerRegistry, alpha) {
        var _this = _super.call(this, container, 'text', zIndex, alpha, colors) || this;
        _this._characterOverlapCache = {};
        _this._state = new GridCache_1.GridCache();
        _this._characterJoinerRegistry = characterJoinerRegistry;
        return _this;
    }
    TextRenderLayer.prototype.resize = function (terminal, dim) {
        _super.prototype.resize.call(this, terminal, dim);
        var terminalFont = this._getFont(terminal, false, false);
        if (this._characterWidth !== dim.scaledCharWidth || this._characterFont !== terminalFont) {
            this._characterWidth = dim.scaledCharWidth;
            this._characterFont = terminalFont;
            this._characterOverlapCache = {};
        }
        this._state.clear();
        this._state.resize(terminal.cols, terminal.rows);
    };
    TextRenderLayer.prototype.reset = function (terminal) {
        this._state.clear();
        this.clearAll();
    };
    TextRenderLayer.prototype._forEachCell = function (terminal, firstRow, lastRow, joinerRegistry, callback) {
        for (var y = firstRow; y <= lastRow; y++) {
            var row = y + terminal.buffer.ydisp;
            var line = terminal.buffer.lines.get(row);
            var joinedRanges = joinerRegistry ? joinerRegistry.getJoinedCharacters(row) : [];
            for (var x = 0; x < terminal.cols; x++) {
                var charData = line.get(x);
                var code = charData[Buffer_1.CHAR_DATA_CODE_INDEX];
                var chars = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
                var attr = charData[Buffer_1.CHAR_DATA_ATTR_INDEX];
                var width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
                var isJoined = false;
                var lastCharX = x;
                if (width === 0) {
                    continue;
                }
                if (joinedRanges.length > 0 && x === joinedRanges[0][0]) {
                    isJoined = true;
                    var range = joinedRanges.shift();
                    chars = terminal.buffer.translateBufferLineToString(row, true, range[0], range[1]);
                    width = range[1] - range[0];
                    code = Infinity;
                    lastCharX = range[1] - 1;
                }
                if (!isJoined && this._isOverlapping(charData)) {
                    if (lastCharX < line.length - 1 && line.get(lastCharX + 1)[Buffer_1.CHAR_DATA_CODE_INDEX] === Buffer_1.NULL_CELL_CODE) {
                        width = 2;
                    }
                }
                var flags = attr >> 18;
                var bg = attr & 0x1ff;
                var fg = (attr >> 9) & 0x1ff;
                if (flags & 8) {
                    var temp = bg;
                    bg = fg;
                    fg = temp;
                    if (fg === 256) {
                        fg = Types_1.INVERTED_DEFAULT_COLOR;
                    }
                    if (bg === 257) {
                        bg = Types_1.INVERTED_DEFAULT_COLOR;
                    }
                }
                callback(code, chars, width, x, y, fg, bg, flags);
                x = lastCharX;
            }
        }
    };
    TextRenderLayer.prototype._drawBackground = function (terminal, firstRow, lastRow) {
        var _this = this;
        var ctx = this._ctx;
        var cols = terminal.cols;
        var startX = 0;
        var startY = 0;
        var prevFillStyle = null;
        ctx.save();
        this._forEachCell(terminal, firstRow, lastRow, null, function (code, chars, width, x, y, fg, bg, flags) {
            var nextFillStyle = null;
            if (bg === Types_1.INVERTED_DEFAULT_COLOR) {
                nextFillStyle = _this._colors.foreground.css;
            }
            else if (bg < 256) {
                nextFillStyle = _this._colors.ansi[bg].css;
            }
            if (prevFillStyle === null) {
                startX = x;
                startY = y;
            }
            if (y !== startY) {
                ctx.fillStyle = prevFillStyle;
                _this.fillCells(startX, startY, cols - startX, 1);
                startX = x;
                startY = y;
            }
            else if (prevFillStyle !== nextFillStyle) {
                ctx.fillStyle = prevFillStyle;
                _this.fillCells(startX, startY, x - startX, 1);
                startX = x;
                startY = y;
            }
            prevFillStyle = nextFillStyle;
        });
        if (prevFillStyle !== null) {
            ctx.fillStyle = prevFillStyle;
            this.fillCells(startX, startY, cols - startX, 1);
        }
        ctx.restore();
    };
    TextRenderLayer.prototype._drawForeground = function (terminal, firstRow, lastRow) {
        var _this = this;
        this._forEachCell(terminal, firstRow, lastRow, this._characterJoinerRegistry, function (code, chars, width, x, y, fg, bg, flags) {
            if (flags & 16) {
                return;
            }
            if (flags & 2) {
                _this._ctx.save();
                if (fg === Types_1.INVERTED_DEFAULT_COLOR) {
                    _this._ctx.fillStyle = _this._colors.background.css;
                }
                else if (fg < 256) {
                    _this._ctx.fillStyle = _this._colors.ansi[fg].css;
                }
                else {
                    _this._ctx.fillStyle = _this._colors.foreground.css;
                }
                _this.fillBottomLineAtCells(x, y, width);
                _this._ctx.restore();
            }
            _this.drawChars(terminal, chars, code, width, x, y, fg, bg, !!(flags & 1), !!(flags & 32), !!(flags & 64));
        });
    };
    TextRenderLayer.prototype.onGridChanged = function (terminal, firstRow, lastRow) {
        if (this._state.cache.length === 0) {
            return;
        }
        if (this._charAtlas) {
            this._charAtlas.beginFrame();
        }
        this.clearCells(0, firstRow, terminal.cols, lastRow - firstRow + 1);
        this._drawBackground(terminal, firstRow, lastRow);
        this._drawForeground(terminal, firstRow, lastRow);
    };
    TextRenderLayer.prototype.onOptionsChanged = function (terminal) {
        this.setTransparency(terminal, terminal.options.allowTransparency);
    };
    TextRenderLayer.prototype._isOverlapping = function (charData) {
        if (charData[Buffer_1.CHAR_DATA_WIDTH_INDEX] !== 1) {
            return false;
        }
        var code = charData[Buffer_1.CHAR_DATA_CODE_INDEX];
        if (code < 256) {
            return false;
        }
        var char = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
        if (this._characterOverlapCache.hasOwnProperty(char)) {
            return this._characterOverlapCache[char];
        }
        this._ctx.save();
        this._ctx.font = this._characterFont;
        var overlaps = Math.floor(this._ctx.measureText(char).width) > this._characterWidth;
        this._ctx.restore();
        this._characterOverlapCache[char] = overlaps;
        return overlaps;
    };
    return TextRenderLayer;
}(BaseRenderLayer_1.BaseRenderLayer));
exports.TextRenderLayer = TextRenderLayer;

},{"../Buffer":13,"./BaseRenderLayer":36,"./GridCache":40,"./atlas/Types":52}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaseCharAtlas = (function () {
    function BaseCharAtlas() {
        this._didWarmUp = false;
    }
    BaseCharAtlas.prototype.dispose = function () { };
    BaseCharAtlas.prototype.warmUp = function () {
        if (!this._didWarmUp) {
            this._doWarmUp();
            this._didWarmUp = true;
        }
    };
    BaseCharAtlas.prototype._doWarmUp = function () { };
    BaseCharAtlas.prototype.beginFrame = function () { };
    return BaseCharAtlas;
}());
exports.default = BaseCharAtlas;

},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CharAtlasUtils_1 = require("./CharAtlasUtils");
var DynamicCharAtlas_1 = require("./DynamicCharAtlas");
var NoneCharAtlas_1 = require("./NoneCharAtlas");
var StaticCharAtlas_1 = require("./StaticCharAtlas");
var charAtlasImplementations = {
    'none': NoneCharAtlas_1.default,
    'static': StaticCharAtlas_1.default,
    'dynamic': DynamicCharAtlas_1.default
};
var charAtlasCache = [];
function acquireCharAtlas(terminal, colors, scaledCharWidth, scaledCharHeight) {
    var newConfig = CharAtlasUtils_1.generateConfig(scaledCharWidth, scaledCharHeight, terminal, colors);
    for (var i = 0; i < charAtlasCache.length; i++) {
        var entry = charAtlasCache[i];
        var ownedByIndex = entry.ownedBy.indexOf(terminal);
        if (ownedByIndex >= 0) {
            if (CharAtlasUtils_1.configEquals(entry.config, newConfig)) {
                return entry.atlas;
            }
            if (entry.ownedBy.length === 1) {
                charAtlasCache.splice(i, 1);
            }
            else {
                entry.ownedBy.splice(ownedByIndex, 1);
            }
            break;
        }
    }
    for (var i = 0; i < charAtlasCache.length; i++) {
        var entry = charAtlasCache[i];
        if (CharAtlasUtils_1.configEquals(entry.config, newConfig)) {
            entry.ownedBy.push(terminal);
            return entry.atlas;
        }
    }
    var newEntry = {
        atlas: new charAtlasImplementations[terminal.options.experimentalCharAtlas](document, newConfig),
        config: newConfig,
        ownedBy: [terminal]
    };
    charAtlasCache.push(newEntry);
    return newEntry.atlas;
}
exports.acquireCharAtlas = acquireCharAtlas;
function removeTerminalFromCache(terminal) {
    for (var i = 0; i < charAtlasCache.length; i++) {
        var index = charAtlasCache[i].ownedBy.indexOf(terminal);
        if (index !== -1) {
            if (charAtlasCache[i].ownedBy.length === 1) {
                charAtlasCache.splice(i, 1);
            }
            else {
                charAtlasCache[i].ownedBy.splice(index, 1);
            }
            break;
        }
    }
}
exports.removeTerminalFromCache = removeTerminalFromCache;

},{"./CharAtlasUtils":47,"./DynamicCharAtlas":48,"./NoneCharAtlas":50,"./StaticCharAtlas":51}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateConfig(scaledCharWidth, scaledCharHeight, terminal, colors) {
    var clonedColors = {
        foreground: colors.foreground,
        background: colors.background,
        cursor: null,
        cursorAccent: null,
        selection: null,
        ansi: colors.ansi.slice(0, 16)
    };
    return {
        type: terminal.options.experimentalCharAtlas,
        devicePixelRatio: window.devicePixelRatio,
        scaledCharWidth: scaledCharWidth,
        scaledCharHeight: scaledCharHeight,
        fontFamily: terminal.options.fontFamily,
        fontSize: terminal.options.fontSize,
        fontWeight: terminal.options.fontWeight,
        fontWeightBold: terminal.options.fontWeightBold,
        allowTransparency: terminal.options.allowTransparency,
        colors: clonedColors
    };
}
exports.generateConfig = generateConfig;
function configEquals(a, b) {
    for (var i = 0; i < a.colors.ansi.length; i++) {
        if (a.colors.ansi[i].rgba !== b.colors.ansi[i].rgba) {
            return false;
        }
    }
    return a.type === b.type &&
        a.devicePixelRatio === b.devicePixelRatio &&
        a.fontFamily === b.fontFamily &&
        a.fontSize === b.fontSize &&
        a.fontWeight === b.fontWeight &&
        a.fontWeightBold === b.fontWeightBold &&
        a.allowTransparency === b.allowTransparency &&
        a.scaledCharWidth === b.scaledCharWidth &&
        a.scaledCharHeight === b.scaledCharHeight &&
        a.colors.foreground === b.colors.foreground &&
        a.colors.background === b.colors.background;
}
exports.configEquals = configEquals;

},{}],48:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Types_1 = require("./Types");
var BaseCharAtlas_1 = require("./BaseCharAtlas");
var ColorManager_1 = require("../ColorManager");
var CharAtlasGenerator_1 = require("../../shared/atlas/CharAtlasGenerator");
var LRUMap_1 = require("./LRUMap");
var Browser_1 = require("../../shared/utils/Browser");
var TEXTURE_WIDTH = 1024;
var TEXTURE_HEIGHT = 1024;
var TRANSPARENT_COLOR = {
    css: 'rgba(0, 0, 0, 0)',
    rgba: 0
};
var FRAME_CACHE_DRAW_LIMIT = 100;
var GLYPH_BITMAP_COMMIT_DELAY = 100;
function getGlyphCacheKey(glyph) {
    return glyph.code << 21 | glyph.bg << 12 | glyph.fg << 3 | (glyph.bold ? 0 : 4) + (glyph.dim ? 0 : 2) + (glyph.italic ? 0 : 1);
}
var DynamicCharAtlas = (function (_super) {
    __extends(DynamicCharAtlas, _super);
    function DynamicCharAtlas(document, _config) {
        var _this = _super.call(this) || this;
        _this._config = _config;
        _this._drawToCacheCount = 0;
        _this._glyphsWaitingOnBitmap = [];
        _this._bitmapCommitTimeout = null;
        _this._bitmap = null;
        _this._cacheCanvas = document.createElement('canvas');
        _this._cacheCanvas.width = TEXTURE_WIDTH;
        _this._cacheCanvas.height = TEXTURE_HEIGHT;
        _this._cacheCtx = _this._cacheCanvas.getContext('2d', { alpha: true });
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = _this._config.scaledCharWidth;
        tmpCanvas.height = _this._config.scaledCharHeight;
        _this._tmpCtx = tmpCanvas.getContext('2d', { alpha: _this._config.allowTransparency });
        _this._width = Math.floor(TEXTURE_WIDTH / _this._config.scaledCharWidth);
        _this._height = Math.floor(TEXTURE_HEIGHT / _this._config.scaledCharHeight);
        var capacity = _this._width * _this._height;
        _this._cacheMap = new LRUMap_1.default(capacity);
        _this._cacheMap.prealloc(capacity);
        return _this;
    }
    DynamicCharAtlas.prototype.dispose = function () {
        if (this._bitmapCommitTimeout !== null) {
            window.clearTimeout(this._bitmapCommitTimeout);
            this._bitmapCommitTimeout = null;
        }
    };
    DynamicCharAtlas.prototype.beginFrame = function () {
        this._drawToCacheCount = 0;
    };
    DynamicCharAtlas.prototype.draw = function (ctx, glyph, x, y) {
        if (glyph.code === 32) {
            return true;
        }
        var glyphKey = getGlyphCacheKey(glyph);
        var cacheValue = this._cacheMap.get(glyphKey);
        if (cacheValue !== null && cacheValue !== undefined) {
            this._drawFromCache(ctx, cacheValue, x, y);
            return true;
        }
        else if (this._canCache(glyph) && this._drawToCacheCount < FRAME_CACHE_DRAW_LIMIT) {
            var index = void 0;
            if (this._cacheMap.size < this._cacheMap.capacity) {
                index = this._cacheMap.size;
            }
            else {
                index = this._cacheMap.peek().index;
            }
            var cacheValue_1 = this._drawToCache(glyph, index);
            this._cacheMap.set(glyphKey, cacheValue_1);
            this._drawFromCache(ctx, cacheValue_1, x, y);
            return true;
        }
        return false;
    };
    DynamicCharAtlas.prototype._canCache = function (glyph) {
        return glyph.code < 256;
    };
    DynamicCharAtlas.prototype._toCoordinateX = function (index) {
        return (index % this._width) * this._config.scaledCharWidth;
    };
    DynamicCharAtlas.prototype._toCoordinateY = function (index) {
        return Math.floor(index / this._width) * this._config.scaledCharHeight;
    };
    DynamicCharAtlas.prototype._drawFromCache = function (ctx, cacheValue, x, y) {
        if (cacheValue.isEmpty) {
            return;
        }
        var cacheX = this._toCoordinateX(cacheValue.index);
        var cacheY = this._toCoordinateY(cacheValue.index);
        ctx.drawImage(cacheValue.inBitmap ? this._bitmap : this._cacheCanvas, cacheX, cacheY, this._config.scaledCharWidth, this._config.scaledCharHeight, x, y, this._config.scaledCharWidth, this._config.scaledCharHeight);
    };
    DynamicCharAtlas.prototype._getColorFromAnsiIndex = function (idx) {
        if (idx < this._config.colors.ansi.length) {
            return this._config.colors.ansi[idx];
        }
        return ColorManager_1.DEFAULT_ANSI_COLORS[idx];
    };
    DynamicCharAtlas.prototype._getBackgroundColor = function (glyph) {
        if (this._config.allowTransparency) {
            return TRANSPARENT_COLOR;
        }
        else if (glyph.bg === Types_1.INVERTED_DEFAULT_COLOR) {
            return this._config.colors.foreground;
        }
        else if (glyph.bg < 256) {
            return this._getColorFromAnsiIndex(glyph.bg);
        }
        return this._config.colors.background;
    };
    DynamicCharAtlas.prototype._getForegroundColor = function (glyph) {
        if (glyph.fg === Types_1.INVERTED_DEFAULT_COLOR) {
            return this._config.colors.background;
        }
        else if (glyph.fg < 256) {
            return this._getColorFromAnsiIndex(glyph.fg);
        }
        return this._config.colors.foreground;
    };
    DynamicCharAtlas.prototype._drawToCache = function (glyph, index) {
        this._drawToCacheCount++;
        this._tmpCtx.save();
        var backgroundColor = this._getBackgroundColor(glyph);
        this._tmpCtx.globalCompositeOperation = 'copy';
        this._tmpCtx.fillStyle = backgroundColor.css;
        this._tmpCtx.fillRect(0, 0, this._config.scaledCharWidth, this._config.scaledCharHeight);
        this._tmpCtx.globalCompositeOperation = 'source-over';
        var fontWeight = glyph.bold ? this._config.fontWeightBold : this._config.fontWeight;
        var fontStyle = glyph.italic ? 'italic' : '';
        this._tmpCtx.font =
            fontStyle + " " + fontWeight + " " + this._config.fontSize * this._config.devicePixelRatio + "px " + this._config.fontFamily;
        this._tmpCtx.textBaseline = 'top';
        this._tmpCtx.fillStyle = this._getForegroundColor(glyph).css;
        if (glyph.dim) {
            this._tmpCtx.globalAlpha = Types_1.DIM_OPACITY;
        }
        this._tmpCtx.fillText(glyph.chars, 0, 0);
        this._tmpCtx.restore();
        var imageData = this._tmpCtx.getImageData(0, 0, this._config.scaledCharWidth, this._config.scaledCharHeight);
        var isEmpty = false;
        if (!this._config.allowTransparency) {
            isEmpty = CharAtlasGenerator_1.clearColor(imageData, backgroundColor);
        }
        var x = this._toCoordinateX(index);
        var y = this._toCoordinateY(index);
        this._cacheCtx.putImageData(imageData, x, y);
        var cacheValue = {
            index: index,
            isEmpty: isEmpty,
            inBitmap: false
        };
        this._addGlyphToBitmap(cacheValue);
        return cacheValue;
    };
    DynamicCharAtlas.prototype._addGlyphToBitmap = function (cacheValue) {
        var _this = this;
        if (!('createImageBitmap' in window) || Browser_1.isFirefox || Browser_1.isSafari) {
            return;
        }
        this._glyphsWaitingOnBitmap.push(cacheValue);
        if (this._bitmapCommitTimeout !== null) {
            return;
        }
        this._bitmapCommitTimeout = window.setTimeout(function () { return _this._generateBitmap(); }, GLYPH_BITMAP_COMMIT_DELAY);
    };
    DynamicCharAtlas.prototype._generateBitmap = function () {
        var _this = this;
        var glyphsMovingToBitmap = this._glyphsWaitingOnBitmap;
        this._glyphsWaitingOnBitmap = [];
        window.createImageBitmap(this._cacheCanvas).then(function (bitmap) {
            _this._bitmap = bitmap;
            for (var i = 0; i < glyphsMovingToBitmap.length; i++) {
                var value = glyphsMovingToBitmap[i];
                value.inBitmap = true;
            }
        });
        this._bitmapCommitTimeout = null;
    };
    return DynamicCharAtlas;
}(BaseCharAtlas_1.default));
exports.default = DynamicCharAtlas;

},{"../../shared/atlas/CharAtlasGenerator":55,"../../shared/utils/Browser":57,"../ColorManager":38,"./BaseCharAtlas":45,"./LRUMap":49,"./Types":52}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LRUMap = (function () {
    function LRUMap(capacity) {
        this.capacity = capacity;
        this._map = {};
        this._head = null;
        this._tail = null;
        this._nodePool = [];
        this.size = 0;
    }
    LRUMap.prototype._unlinkNode = function (node) {
        var prev = node.prev;
        var next = node.next;
        if (node === this._head) {
            this._head = next;
        }
        if (node === this._tail) {
            this._tail = prev;
        }
        if (prev !== null) {
            prev.next = next;
        }
        if (next !== null) {
            next.prev = prev;
        }
    };
    LRUMap.prototype._appendNode = function (node) {
        var tail = this._tail;
        if (tail !== null) {
            tail.next = node;
        }
        node.prev = tail;
        node.next = null;
        this._tail = node;
        if (this._head === null) {
            this._head = node;
        }
    };
    LRUMap.prototype.prealloc = function (count) {
        var nodePool = this._nodePool;
        for (var i = 0; i < count; i++) {
            nodePool.push({
                prev: null,
                next: null,
                key: null,
                value: null
            });
        }
    };
    LRUMap.prototype.get = function (key) {
        var node = this._map[key];
        if (node !== undefined) {
            this._unlinkNode(node);
            this._appendNode(node);
            return node.value;
        }
        return null;
    };
    LRUMap.prototype.peekValue = function (key) {
        var node = this._map[key];
        if (node !== undefined) {
            return node.value;
        }
        return null;
    };
    LRUMap.prototype.peek = function () {
        var head = this._head;
        return head === null ? null : head.value;
    };
    LRUMap.prototype.set = function (key, value) {
        var node = this._map[key];
        if (node !== undefined) {
            node = this._map[key];
            this._unlinkNode(node);
            node.value = value;
        }
        else if (this.size >= this.capacity) {
            node = this._head;
            this._unlinkNode(node);
            delete this._map[node.key];
            node.key = key;
            node.value = value;
            this._map[key] = node;
        }
        else {
            var nodePool = this._nodePool;
            if (nodePool.length > 0) {
                node = nodePool.pop();
                node.key = key;
                node.value = value;
            }
            else {
                node = {
                    prev: null,
                    next: null,
                    key: key,
                    value: value
                };
            }
            this._map[key] = node;
            this.size++;
        }
        this._appendNode(node);
    };
    return LRUMap;
}());
exports.default = LRUMap;

},{}],50:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BaseCharAtlas_1 = require("./BaseCharAtlas");
var NoneCharAtlas = (function (_super) {
    __extends(NoneCharAtlas, _super);
    function NoneCharAtlas(document, config) {
        return _super.call(this) || this;
    }
    NoneCharAtlas.prototype.draw = function (ctx, glyph, x, y) {
        return false;
    };
    return NoneCharAtlas;
}(BaseCharAtlas_1.default));
exports.default = NoneCharAtlas;

},{"./BaseCharAtlas":45}],51:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Types_1 = require("./Types");
var Types_2 = require("../../shared/atlas/Types");
var CharAtlasGenerator_1 = require("../../shared/atlas/CharAtlasGenerator");
var BaseCharAtlas_1 = require("./BaseCharAtlas");
var StaticCharAtlas = (function (_super) {
    __extends(StaticCharAtlas, _super);
    function StaticCharAtlas(_document, _config) {
        var _this = _super.call(this) || this;
        _this._document = _document;
        _this._config = _config;
        _this._canvasFactory = function (width, height) {
            var canvas = _this._document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        };
        return _this;
    }
    StaticCharAtlas.prototype._doWarmUp = function () {
        var _this = this;
        var result = CharAtlasGenerator_1.generateStaticCharAtlasTexture(window, this._canvasFactory, this._config);
        if (result instanceof HTMLCanvasElement) {
            this._texture = result;
        }
        else {
            result.then(function (texture) {
                _this._texture = texture;
            });
        }
    };
    StaticCharAtlas.prototype._isCached = function (glyph, colorIndex) {
        var isAscii = glyph.code < 256;
        var isBasicColor = glyph.fg < 16;
        var isDefaultColor = glyph.fg >= 256;
        var isDefaultBackground = glyph.bg >= 256;
        return isAscii && (isBasicColor || isDefaultColor) && isDefaultBackground && !glyph.italic;
    };
    StaticCharAtlas.prototype.draw = function (ctx, glyph, x, y) {
        if (this._texture === null || this._texture === undefined) {
            return false;
        }
        var colorIndex = 0;
        if (glyph.fg < 256) {
            colorIndex = 2 + glyph.fg + (glyph.bold ? 16 : 0);
        }
        else {
            if (glyph.bold) {
                colorIndex = 1;
            }
        }
        if (!this._isCached(glyph, colorIndex)) {
            return false;
        }
        ctx.save();
        var charAtlasCellWidth = this._config.scaledCharWidth + Types_2.CHAR_ATLAS_CELL_SPACING;
        var charAtlasCellHeight = this._config.scaledCharHeight + Types_2.CHAR_ATLAS_CELL_SPACING;
        if (glyph.dim) {
            ctx.globalAlpha = Types_1.DIM_OPACITY;
        }
        ctx.drawImage(this._texture, glyph.code * charAtlasCellWidth, colorIndex * charAtlasCellHeight, charAtlasCellWidth, this._config.scaledCharHeight, x, y, charAtlasCellWidth, this._config.scaledCharHeight);
        ctx.restore();
        return true;
    };
    return StaticCharAtlas;
}(BaseCharAtlas_1.default));
exports.default = StaticCharAtlas;

},{"../../shared/atlas/CharAtlasGenerator":55,"../../shared/atlas/Types":56,"./BaseCharAtlas":45,"./Types":52}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVERTED_DEFAULT_COLOR = -1;
exports.DIM_OPACITY = 0.5;

},{}],53:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter_1 = require("../../common/EventEmitter");
var ColorManager_1 = require("../ColorManager");
var RenderDebouncer_1 = require("../../ui/RenderDebouncer");
var DomRendererRowFactory_1 = require("./DomRendererRowFactory");
var TERMINAL_CLASS_PREFIX = 'xterm-dom-renderer-owner-';
var ROW_CONTAINER_CLASS = 'xterm-rows';
var FG_CLASS_PREFIX = 'xterm-fg-';
var BG_CLASS_PREFIX = 'xterm-bg-';
var FOCUS_CLASS = 'xterm-focus';
var SELECTION_CLASS = 'xterm-selection';
var nextTerminalId = 1;
var DomRenderer = (function (_super) {
    __extends(DomRenderer, _super);
    function DomRenderer(_terminal, theme) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._terminalClass = nextTerminalId++;
        _this._rowElements = [];
        var allowTransparency = _this._terminal.options.allowTransparency;
        _this.colorManager = new ColorManager_1.ColorManager(document, allowTransparency);
        _this.setTheme(theme);
        _this._rowContainer = document.createElement('div');
        _this._rowContainer.classList.add(ROW_CONTAINER_CLASS);
        _this._rowContainer.style.lineHeight = 'normal';
        _this._rowContainer.setAttribute('aria-hidden', 'true');
        _this._refreshRowElements(_this._terminal.cols, _this._terminal.rows);
        _this._selectionContainer = document.createElement('div');
        _this._selectionContainer.classList.add(SELECTION_CLASS);
        _this._selectionContainer.setAttribute('aria-hidden', 'true');
        _this.dimensions = {
            scaledCharWidth: null,
            scaledCharHeight: null,
            scaledCellWidth: null,
            scaledCellHeight: null,
            scaledCharLeft: null,
            scaledCharTop: null,
            scaledCanvasWidth: null,
            scaledCanvasHeight: null,
            canvasWidth: null,
            canvasHeight: null,
            actualCellWidth: null,
            actualCellHeight: null
        };
        _this._updateDimensions();
        _this._renderDebouncer = new RenderDebouncer_1.RenderDebouncer(_this._terminal, _this._renderRows.bind(_this));
        _this._rowFactory = new DomRendererRowFactory_1.DomRendererRowFactory(document);
        _this._terminal.element.classList.add(TERMINAL_CLASS_PREFIX + _this._terminalClass);
        _this._terminal.screenElement.appendChild(_this._rowContainer);
        _this._terminal.screenElement.appendChild(_this._selectionContainer);
        _this._terminal.linkifier.on("linkhover", function (e) { return _this._onLinkHover(e); });
        _this._terminal.linkifier.on("linkleave", function (e) { return _this._onLinkLeave(e); });
        return _this;
    }
    DomRenderer.prototype.dispose = function () {
        this._terminal.element.classList.remove(TERMINAL_CLASS_PREFIX + this._terminalClass);
        this._terminal.screenElement.removeChild(this._rowContainer);
        this._terminal.screenElement.removeChild(this._selectionContainer);
        this._terminal.screenElement.removeChild(this._themeStyleElement);
        this._terminal.screenElement.removeChild(this._dimensionsStyleElement);
        _super.prototype.dispose.call(this);
    };
    DomRenderer.prototype._updateDimensions = function () {
        var _this = this;
        this.dimensions.scaledCharWidth = this._terminal.charMeasure.width * window.devicePixelRatio;
        this.dimensions.scaledCharHeight = this._terminal.charMeasure.height * window.devicePixelRatio;
        this.dimensions.scaledCellWidth = this.dimensions.scaledCharWidth;
        this.dimensions.scaledCellHeight = this.dimensions.scaledCharHeight;
        this.dimensions.scaledCharLeft = 0;
        this.dimensions.scaledCharTop = 0;
        this.dimensions.scaledCanvasWidth = this.dimensions.scaledCellWidth * this._terminal.cols;
        this.dimensions.scaledCanvasHeight = this.dimensions.scaledCellHeight * this._terminal.rows;
        this.dimensions.canvasWidth = this._terminal.charMeasure.width * this._terminal.cols;
        this.dimensions.canvasHeight = this._terminal.charMeasure.height * this._terminal.rows;
        this.dimensions.actualCellWidth = this._terminal.charMeasure.width;
        this.dimensions.actualCellHeight = this._terminal.charMeasure.height;
        this._rowElements.forEach(function (element) {
            element.style.width = _this.dimensions.canvasWidth + "px";
            element.style.height = _this._terminal.charMeasure.height + "px";
        });
        if (!this._dimensionsStyleElement) {
            this._dimensionsStyleElement = document.createElement('style');
            this._terminal.screenElement.appendChild(this._dimensionsStyleElement);
        }
        var styles = this._terminalSelector + " ." + ROW_CONTAINER_CLASS + " span {" +
            " display: inline-block;" +
            " height: 100%;" +
            " vertical-align: top;" +
            (" width: " + this._terminal.charMeasure.width + "px") +
            "}";
        this._dimensionsStyleElement.innerHTML = styles;
        this._selectionContainer.style.height = this._terminal._viewportElement.style.height;
        this._rowContainer.style.width = this.dimensions.canvasWidth + "px";
        this._rowContainer.style.height = this.dimensions.canvasHeight + "px";
    };
    DomRenderer.prototype.setTheme = function (theme) {
        var _this = this;
        if (theme) {
            this.colorManager.setTheme(theme);
        }
        if (!this._themeStyleElement) {
            this._themeStyleElement = document.createElement('style');
            this._terminal.screenElement.appendChild(this._themeStyleElement);
        }
        var styles = this._terminalSelector + " ." + ROW_CONTAINER_CLASS + " {" +
            (" color: " + this.colorManager.colors.foreground.css + ";") +
            (" background-color: " + this.colorManager.colors.background.css + ";") +
            (" font-family: " + this._terminal.getOption('fontFamily') + ";") +
            (" font-size: " + this._terminal.getOption('fontSize') + "px;") +
            "}";
        styles +=
            this._terminalSelector + " span:not(." + DomRendererRowFactory_1.BOLD_CLASS + ") {" +
                (" font-weight: " + this._terminal.options.fontWeight + ";") +
                "}" +
                (this._terminalSelector + " span." + DomRendererRowFactory_1.BOLD_CLASS + " {") +
                (" font-weight: " + this._terminal.options.fontWeightBold + ";") +
                "}" +
                (this._terminalSelector + " span." + DomRendererRowFactory_1.ITALIC_CLASS + " {") +
                " font-style: italic;" +
                "}";
        styles +=
            this._terminalSelector + " ." + ROW_CONTAINER_CLASS + ":not(." + FOCUS_CLASS + ") ." + DomRendererRowFactory_1.CURSOR_CLASS + " {" +
                (" outline: 1px solid " + this.colorManager.colors.cursor.css + ";") +
                " outline-offset: -1px;" +
                "}" +
                (this._terminalSelector + " ." + ROW_CONTAINER_CLASS + "." + FOCUS_CLASS + " ." + DomRendererRowFactory_1.CURSOR_CLASS + "." + DomRendererRowFactory_1.CURSOR_STYLE_BLOCK_CLASS + " {") +
                (" background-color: " + this.colorManager.colors.cursor.css + ";") +
                (" color: " + this.colorManager.colors.cursorAccent.css + ";") +
                "}" +
                (this._terminalSelector + " ." + ROW_CONTAINER_CLASS + "." + FOCUS_CLASS + " ." + DomRendererRowFactory_1.CURSOR_CLASS + "." + DomRendererRowFactory_1.CURSOR_STYLE_BAR_CLASS + " {") +
                (" box-shadow: 1px 0 0 " + this.colorManager.colors.cursor.css + " inset;") +
                "}" +
                (this._terminalSelector + " ." + ROW_CONTAINER_CLASS + "." + FOCUS_CLASS + " ." + DomRendererRowFactory_1.CURSOR_CLASS + "." + DomRendererRowFactory_1.CURSOR_STYLE_UNDERLINE_CLASS + " {") +
                (" box-shadow: 0 -1px 0 " + this.colorManager.colors.cursor.css + " inset;") +
                "}";
        styles +=
            this._terminalSelector + " ." + SELECTION_CLASS + " {" +
                " position: absolute;" +
                " top: 0;" +
                " left: 0;" +
                " z-index: 1;" +
                " pointer-events: none;" +
                "}" +
                (this._terminalSelector + " ." + SELECTION_CLASS + " div {") +
                " position: absolute;" +
                (" background-color: " + this.colorManager.colors.selection.css + ";") +
                "}";
        this.colorManager.colors.ansi.forEach(function (c, i) {
            styles +=
                _this._terminalSelector + " ." + FG_CLASS_PREFIX + i + " { color: " + c.css + "; }" +
                    (_this._terminalSelector + " ." + BG_CLASS_PREFIX + i + " { background-color: " + c.css + "; }");
        });
        this._themeStyleElement.innerHTML = styles;
        return this.colorManager.colors;
    };
    DomRenderer.prototype.onWindowResize = function (devicePixelRatio) {
        this._updateDimensions();
    };
    DomRenderer.prototype._refreshRowElements = function (cols, rows) {
        for (var i = this._rowElements.length; i <= rows; i++) {
            var row = document.createElement('div');
            this._rowContainer.appendChild(row);
            this._rowElements.push(row);
        }
        while (this._rowElements.length > rows) {
            this._rowContainer.removeChild(this._rowElements.pop());
        }
    };
    DomRenderer.prototype.onResize = function (cols, rows) {
        this._refreshRowElements(cols, rows);
        this._updateDimensions();
    };
    DomRenderer.prototype.onCharSizeChanged = function () {
        this._updateDimensions();
    };
    DomRenderer.prototype.onBlur = function () {
        this._rowContainer.classList.remove(FOCUS_CLASS);
    };
    DomRenderer.prototype.onFocus = function () {
        this._rowContainer.classList.add(FOCUS_CLASS);
    };
    DomRenderer.prototype.onSelectionChanged = function (start, end, columnSelectMode) {
        while (this._selectionContainer.children.length) {
            this._selectionContainer.removeChild(this._selectionContainer.children[0]);
        }
        if (!start || !end) {
            return;
        }
        var viewportStartRow = start[1] - this._terminal.buffer.ydisp;
        var viewportEndRow = end[1] - this._terminal.buffer.ydisp;
        var viewportCappedStartRow = Math.max(viewportStartRow, 0);
        var viewportCappedEndRow = Math.min(viewportEndRow, this._terminal.rows - 1);
        if (viewportCappedStartRow >= this._terminal.rows || viewportCappedEndRow < 0) {
            return;
        }
        var documentFragment = document.createDocumentFragment();
        if (columnSelectMode) {
            documentFragment.appendChild(this._createSelectionElement(viewportCappedStartRow, start[0], end[0], viewportCappedEndRow - viewportCappedStartRow + 1));
        }
        else {
            var startCol = viewportStartRow === viewportCappedStartRow ? start[0] : 0;
            var endCol = viewportCappedStartRow === viewportCappedEndRow ? end[0] : this._terminal.cols;
            documentFragment.appendChild(this._createSelectionElement(viewportCappedStartRow, startCol, endCol));
            var middleRowsCount = viewportCappedEndRow - viewportCappedStartRow - 1;
            documentFragment.appendChild(this._createSelectionElement(viewportCappedStartRow + 1, 0, this._terminal.cols, middleRowsCount));
            if (viewportCappedStartRow !== viewportCappedEndRow) {
                var endCol_1 = viewportEndRow === viewportCappedEndRow ? end[0] : this._terminal.cols;
                documentFragment.appendChild(this._createSelectionElement(viewportCappedEndRow, 0, endCol_1));
            }
        }
        this._selectionContainer.appendChild(documentFragment);
    };
    DomRenderer.prototype._createSelectionElement = function (row, colStart, colEnd, rowCount) {
        if (rowCount === void 0) { rowCount = 1; }
        var element = document.createElement('div');
        element.style.height = rowCount * this._terminal.charMeasure.height + "px";
        element.style.top = row * this._terminal.charMeasure.height + "px";
        element.style.left = colStart * this._terminal.charMeasure.width + "px";
        element.style.width = this._terminal.charMeasure.width * (colEnd - colStart) + "px";
        return element;
    };
    DomRenderer.prototype.onCursorMove = function () {
    };
    DomRenderer.prototype.onOptionsChanged = function () {
        this._updateDimensions();
        this.setTheme(undefined);
        this._terminal.refresh(0, this._terminal.rows - 1);
    };
    DomRenderer.prototype.clear = function () {
        this._rowElements.forEach(function (e) { return e.innerHTML = ''; });
    };
    DomRenderer.prototype.refreshRows = function (start, end) {
        this._renderDebouncer.refresh(start, end);
    };
    DomRenderer.prototype._renderRows = function (start, end) {
        var terminal = this._terminal;
        var cursorAbsoluteY = terminal.buffer.ybase + terminal.buffer.y;
        var cursorX = this._terminal.buffer.x;
        for (var y = start; y <= end; y++) {
            var rowElement = this._rowElements[y];
            rowElement.innerHTML = '';
            var row = y + terminal.buffer.ydisp;
            var lineData = terminal.buffer.lines.get(row);
            var cursorStyle = terminal.options.cursorStyle;
            rowElement.appendChild(this._rowFactory.createRow(lineData, row === cursorAbsoluteY, cursorStyle, cursorX, terminal.charMeasure.width, terminal.cols));
        }
        this._terminal.emit('refresh', { start: start, end: end });
    };
    Object.defineProperty(DomRenderer.prototype, "_terminalSelector", {
        get: function () {
            return "." + TERMINAL_CLASS_PREFIX + this._terminalClass;
        },
        enumerable: true,
        configurable: true
    });
    DomRenderer.prototype.registerCharacterJoiner = function (handler) { return -1; };
    DomRenderer.prototype.deregisterCharacterJoiner = function (joinerId) { return false; };
    DomRenderer.prototype._onLinkHover = function (e) {
        this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, true);
    };
    DomRenderer.prototype._onLinkLeave = function (e) {
        this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, false);
    };
    DomRenderer.prototype._setCellUnderline = function (x, x2, y, y2, cols, enabled) {
        while (x !== x2 || y !== y2) {
            var span = this._rowElements[y].children[x];
            span.style.textDecoration = enabled ? 'underline' : 'none';
            x = (x + 1) % cols;
            if (x === 0) {
                y++;
            }
        }
    };
    return DomRenderer;
}(EventEmitter_1.EventEmitter));
exports.DomRenderer = DomRenderer;

},{"../../common/EventEmitter":28,"../../ui/RenderDebouncer":61,"../ColorManager":38,"./DomRendererRowFactory":54}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("../../Buffer");
exports.BOLD_CLASS = 'xterm-bold';
exports.ITALIC_CLASS = 'xterm-italic';
exports.CURSOR_CLASS = 'xterm-cursor';
exports.CURSOR_STYLE_BLOCK_CLASS = 'xterm-cursor-block';
exports.CURSOR_STYLE_BAR_CLASS = 'xterm-cursor-bar';
exports.CURSOR_STYLE_UNDERLINE_CLASS = 'xterm-cursor-underline';
var DomRendererRowFactory = (function () {
    function DomRendererRowFactory(_document) {
        this._document = _document;
    }
    DomRendererRowFactory.prototype.createRow = function (lineData, isCursorRow, cursorStyle, cursorX, cellWidth, cols) {
        var fragment = this._document.createDocumentFragment();
        var colCount = 0;
        for (var x = 0; x < lineData.length; x++) {
            if (colCount >= cols) {
                continue;
            }
            var charData = lineData.get(x);
            var char = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
            var attr = charData[Buffer_1.CHAR_DATA_ATTR_INDEX];
            var width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
            if (width === 0) {
                continue;
            }
            var charElement = this._document.createElement('span');
            if (width > 1) {
                charElement.style.width = cellWidth * width + "px";
            }
            var flags = attr >> 18;
            var bg = attr & 0x1ff;
            var fg = (attr >> 9) & 0x1ff;
            if (isCursorRow && x === cursorX) {
                charElement.classList.add(exports.CURSOR_CLASS);
                switch (cursorStyle) {
                    case 'bar':
                        charElement.classList.add(exports.CURSOR_STYLE_BAR_CLASS);
                        break;
                    case 'underline':
                        charElement.classList.add(exports.CURSOR_STYLE_UNDERLINE_CLASS);
                        break;
                    default:
                        charElement.classList.add(exports.CURSOR_STYLE_BLOCK_CLASS);
                        break;
                }
            }
            if (flags & 8) {
                var temp = bg;
                bg = fg;
                fg = temp;
                if (fg === 256) {
                    fg = 0;
                }
                if (bg === 257) {
                    bg = 15;
                }
            }
            if (flags & 1) {
                if (fg < 8) {
                    fg += 8;
                }
                charElement.classList.add(exports.BOLD_CLASS);
            }
            if (flags & 64) {
                charElement.classList.add(exports.ITALIC_CLASS);
            }
            charElement.textContent = char;
            if (fg !== 257) {
                charElement.classList.add("xterm-fg-" + fg);
            }
            if (bg !== 256) {
                charElement.classList.add("xterm-bg-" + bg);
            }
            fragment.appendChild(charElement);
            colCount += width;
        }
        return fragment;
    };
    return DomRendererRowFactory;
}());
exports.DomRendererRowFactory = DomRendererRowFactory;

},{"../../Buffer":13}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Types_1 = require("./Types");
var Browser_1 = require("../utils/Browser");
function generateStaticCharAtlasTexture(context, canvasFactory, config) {
    var cellWidth = config.scaledCharWidth + Types_1.CHAR_ATLAS_CELL_SPACING;
    var cellHeight = config.scaledCharHeight + Types_1.CHAR_ATLAS_CELL_SPACING;
    var canvas = canvasFactory(255 * cellWidth, (2 + 16 + 16) * cellHeight);
    var ctx = canvas.getContext('2d', { alpha: config.allowTransparency });
    ctx.fillStyle = config.colors.background.css;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = config.colors.foreground.css;
    ctx.font = getFont(config.fontWeight, config);
    ctx.textBaseline = 'top';
    for (var i = 0; i < 256; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(i * cellWidth, 0, cellWidth, cellHeight);
        ctx.clip();
        ctx.fillText(String.fromCharCode(i), i * cellWidth, 0);
        ctx.restore();
    }
    ctx.save();
    ctx.font = getFont(config.fontWeightBold, config);
    for (var i = 0; i < 256; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(i * cellWidth, cellHeight, cellWidth, cellHeight);
        ctx.clip();
        ctx.fillText(String.fromCharCode(i), i * cellWidth, cellHeight);
        ctx.restore();
    }
    ctx.restore();
    ctx.font = getFont(config.fontWeight, config);
    for (var colorIndex = 0; colorIndex < 16; colorIndex++) {
        var y = (colorIndex + 2) * cellHeight;
        for (var i = 0; i < 256; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(i * cellWidth, y, cellWidth, cellHeight);
            ctx.clip();
            ctx.fillStyle = config.colors.ansi[colorIndex].css;
            ctx.fillText(String.fromCharCode(i), i * cellWidth, y);
            ctx.restore();
        }
    }
    ctx.font = getFont(config.fontWeightBold, config);
    for (var colorIndex = 0; colorIndex < 16; colorIndex++) {
        var y = (colorIndex + 2 + 16) * cellHeight;
        for (var i = 0; i < 256; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(i * cellWidth, y, cellWidth, cellHeight);
            ctx.clip();
            ctx.fillStyle = config.colors.ansi[colorIndex].css;
            ctx.fillText(String.fromCharCode(i), i * cellWidth, y);
            ctx.restore();
        }
    }
    ctx.restore();
    if (!('createImageBitmap' in context) || Browser_1.isFirefox || Browser_1.isSafari) {
        if (canvas instanceof HTMLCanvasElement) {
            return canvas;
        }
        return new Promise(function (r) { return r(canvas.transferToImageBitmap()); });
    }
    var charAtlasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    clearColor(charAtlasImageData, config.colors.background);
    return context.createImageBitmap(charAtlasImageData);
}
exports.generateStaticCharAtlasTexture = generateStaticCharAtlasTexture;
function clearColor(imageData, color) {
    var isEmpty = true;
    var r = color.rgba >>> 24;
    var g = color.rgba >>> 16 & 0xFF;
    var b = color.rgba >>> 8 & 0xFF;
    for (var offset = 0; offset < imageData.data.length; offset += 4) {
        if (imageData.data[offset] === r &&
            imageData.data[offset + 1] === g &&
            imageData.data[offset + 2] === b) {
            imageData.data[offset + 3] = 0;
        }
        else {
            isEmpty = false;
        }
    }
    return isEmpty;
}
exports.clearColor = clearColor;
function getFont(fontWeight, config) {
    return fontWeight + " " + config.fontSize * config.devicePixelRatio + "px " + config.fontFamily;
}

},{"../utils/Browser":57,"./Types":56}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAR_ATLAS_CELL_SPACING = 1;

},{}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var isNode = (typeof navigator === 'undefined') ? true : false;
var userAgent = (isNode) ? 'node' : navigator.userAgent;
var platform = (isNode) ? 'node' : navigator.platform;
exports.isFirefox = !!~userAgent.indexOf('Firefox');
exports.isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
exports.isMSIE = !!~userAgent.indexOf('MSIE') || !!~userAgent.indexOf('Trident');
exports.isMac = contains(['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'], platform);
exports.isIpad = platform === 'iPad';
exports.isIphone = platform === 'iPhone';
exports.isMSWindows = contains(['Windows', 'Win16', 'Win32', 'WinCE'], platform);
exports.isLinux = platform.indexOf('Linux') >= 0;
function contains(arr, el) {
    return arr.indexOf(el) >= 0;
}

},{}],58:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter_1 = require("../common/EventEmitter");
var CharMeasure = (function (_super) {
    __extends(CharMeasure, _super);
    function CharMeasure(document, parentElement) {
        var _this = _super.call(this) || this;
        _this._document = document;
        _this._parentElement = parentElement;
        _this._measureElement = _this._document.createElement('span');
        _this._measureElement.classList.add('xterm-char-measure-element');
        _this._measureElement.textContent = 'W';
        _this._measureElement.setAttribute('aria-hidden', 'true');
        _this._parentElement.appendChild(_this._measureElement);
        return _this;
    }
    Object.defineProperty(CharMeasure.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CharMeasure.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    CharMeasure.prototype.measure = function (options) {
        this._measureElement.style.fontFamily = options.fontFamily;
        this._measureElement.style.fontSize = options.fontSize + "px";
        var geometry = this._measureElement.getBoundingClientRect();
        if (geometry.width === 0 || geometry.height === 0) {
            return;
        }
        if (this._width !== geometry.width || this._height !== geometry.height) {
            this._width = geometry.width;
            this._height = Math.ceil(geometry.height);
            this.emit('charsizechanged');
        }
    };
    return CharMeasure;
}(EventEmitter_1.EventEmitter));
exports.CharMeasure = CharMeasure;

},{"../common/EventEmitter":28}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addDisposableDomListener(node, type, handler, useCapture) {
    node.addEventListener(type, handler, useCapture);
    return {
        dispose: function () {
            if (!handler) {
                return;
            }
            node.removeEventListener(type, handler, useCapture);
            node = null;
            handler = null;
        }
    };
}
exports.addDisposableDomListener = addDisposableDomListener;

},{}],60:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Lifecycle_1 = require("../common/Lifecycle");
var Lifecycle_2 = require("./Lifecycle");
var HOVER_DURATION = 500;
var MouseZoneManager = (function (_super) {
    __extends(MouseZoneManager, _super);
    function MouseZoneManager(_terminal) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._zones = [];
        _this._areZonesActive = false;
        _this._tooltipTimeout = null;
        _this._currentZone = null;
        _this._lastHoverCoords = [null, null];
        _this.register(Lifecycle_2.addDisposableDomListener(_this._terminal.element, 'mousedown', function (e) { return _this._onMouseDown(e); }));
        _this._mouseMoveListener = function (e) { return _this._onMouseMove(e); };
        _this._clickListener = function (e) { return _this._onClick(e); };
        return _this;
    }
    MouseZoneManager.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._deactivate();
    };
    MouseZoneManager.prototype.add = function (zone) {
        this._zones.push(zone);
        if (this._zones.length === 1) {
            this._activate();
        }
    };
    MouseZoneManager.prototype.clearAll = function (start, end) {
        if (this._zones.length === 0) {
            return;
        }
        if (!end) {
            start = 0;
            end = this._terminal.rows - 1;
        }
        for (var i = 0; i < this._zones.length; i++) {
            var zone = this._zones[i];
            if ((zone.y1 > start && zone.y1 <= end + 1) ||
                (zone.y2 > start && zone.y2 <= end + 1) ||
                (zone.y1 < start && zone.y2 > end + 1)) {
                if (this._currentZone && this._currentZone === zone) {
                    this._currentZone.leaveCallback();
                    this._currentZone = null;
                }
                this._zones.splice(i--, 1);
            }
        }
        if (this._zones.length === 0) {
            this._deactivate();
        }
    };
    MouseZoneManager.prototype._activate = function () {
        if (!this._areZonesActive) {
            this._areZonesActive = true;
            this._terminal.element.addEventListener('mousemove', this._mouseMoveListener);
            this._terminal.element.addEventListener('click', this._clickListener);
        }
    };
    MouseZoneManager.prototype._deactivate = function () {
        if (this._areZonesActive) {
            this._areZonesActive = false;
            this._terminal.element.removeEventListener('mousemove', this._mouseMoveListener);
            this._terminal.element.removeEventListener('click', this._clickListener);
        }
    };
    MouseZoneManager.prototype._onMouseMove = function (e) {
        if (this._lastHoverCoords[0] !== e.pageX || this._lastHoverCoords[1] !== e.pageY) {
            this._onHover(e);
            this._lastHoverCoords = [e.pageX, e.pageY];
        }
    };
    MouseZoneManager.prototype._onHover = function (e) {
        var _this = this;
        var zone = this._findZoneEventAt(e);
        if (zone === this._currentZone) {
            return;
        }
        if (this._currentZone) {
            this._currentZone.leaveCallback();
            this._currentZone = null;
            if (this._tooltipTimeout) {
                clearTimeout(this._tooltipTimeout);
            }
        }
        if (!zone) {
            return;
        }
        this._currentZone = zone;
        if (zone.hoverCallback) {
            zone.hoverCallback(e);
        }
        this._tooltipTimeout = setTimeout(function () { return _this._onTooltip(e); }, HOVER_DURATION);
    };
    MouseZoneManager.prototype._onTooltip = function (e) {
        this._tooltipTimeout = null;
        var zone = this._findZoneEventAt(e);
        if (zone && zone.tooltipCallback) {
            zone.tooltipCallback(e);
        }
    };
    MouseZoneManager.prototype._onMouseDown = function (e) {
        if (!this._areZonesActive) {
            return;
        }
        var zone = this._findZoneEventAt(e);
        if (zone) {
            if (zone.willLinkActivate(e)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }
    };
    MouseZoneManager.prototype._onClick = function (e) {
        var zone = this._findZoneEventAt(e);
        if (zone) {
            zone.clickCallback(e);
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    };
    MouseZoneManager.prototype._findZoneEventAt = function (e) {
        var coords = this._terminal.mouseHelper.getCoords(e, this._terminal.screenElement, this._terminal.charMeasure, this._terminal.options.lineHeight, this._terminal.cols, this._terminal.rows);
        if (!coords) {
            return null;
        }
        var x = coords[0];
        var y = coords[1];
        for (var i = 0; i < this._zones.length; i++) {
            var zone = this._zones[i];
            if (zone.y1 === zone.y2) {
                if (y === zone.y1 && x >= zone.x1 && x < zone.x2) {
                    return zone;
                }
            }
            else {
                if ((y === zone.y1 && x >= zone.x1) ||
                    (y === zone.y2 && x < zone.x2) ||
                    (y > zone.y1 && y < zone.y2)) {
                    return zone;
                }
            }
        }
        return null;
    };
    return MouseZoneManager;
}(Lifecycle_1.Disposable));
exports.MouseZoneManager = MouseZoneManager;
var MouseZone = (function () {
    function MouseZone(x1, y1, x2, y2, clickCallback, hoverCallback, tooltipCallback, leaveCallback, willLinkActivate) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.clickCallback = clickCallback;
        this.hoverCallback = hoverCallback;
        this.tooltipCallback = tooltipCallback;
        this.leaveCallback = leaveCallback;
        this.willLinkActivate = willLinkActivate;
    }
    return MouseZone;
}());
exports.MouseZone = MouseZone;

},{"../common/Lifecycle":29,"./Lifecycle":59}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RenderDebouncer = (function () {
    function RenderDebouncer(_terminal, _callback) {
        this._terminal = _terminal;
        this._callback = _callback;
        this._animationFrame = null;
    }
    RenderDebouncer.prototype.dispose = function () {
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    };
    RenderDebouncer.prototype.refresh = function (rowStart, rowEnd) {
        var _this = this;
        rowStart = rowStart !== null && rowStart !== undefined ? rowStart : 0;
        rowEnd = rowEnd !== null && rowEnd !== undefined ? rowEnd : this._terminal.rows - 1;
        var isRowStartSet = this._rowStart !== undefined && this._rowStart !== null;
        var isRowEndSet = this._rowEnd !== undefined && this._rowEnd !== null;
        this._rowStart = isRowStartSet ? Math.min(this._rowStart, rowStart) : rowStart;
        this._rowEnd = isRowEndSet ? Math.max(this._rowEnd, rowEnd) : rowEnd;
        if (this._animationFrame) {
            return;
        }
        this._animationFrame = window.requestAnimationFrame(function () { return _this._innerRefresh(); });
    };
    RenderDebouncer.prototype._innerRefresh = function () {
        this._rowStart = Math.max(this._rowStart, 0);
        this._rowEnd = Math.min(this._rowEnd, this._terminal.rows - 1);
        this._callback(this._rowStart, this._rowEnd);
        this._rowStart = null;
        this._rowEnd = null;
        this._animationFrame = null;
    };
    return RenderDebouncer;
}());
exports.RenderDebouncer = RenderDebouncer;

},{}],62:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Lifecycle_1 = require("../common/Lifecycle");
var ScreenDprMonitor = (function (_super) {
    __extends(ScreenDprMonitor, _super);
    function ScreenDprMonitor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ScreenDprMonitor.prototype.setListener = function (listener) {
        var _this = this;
        if (this._listener) {
            this.clearListener();
        }
        this._listener = listener;
        this._outerListener = function () {
            _this._listener(window.devicePixelRatio, _this._currentDevicePixelRatio);
            _this._updateDpr();
        };
        this._updateDpr();
    };
    ScreenDprMonitor.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.clearListener();
    };
    ScreenDprMonitor.prototype._updateDpr = function () {
        if (this._resolutionMediaMatchList) {
            this._resolutionMediaMatchList.removeListener(this._outerListener);
        }
        this._currentDevicePixelRatio = window.devicePixelRatio;
        this._resolutionMediaMatchList = window.matchMedia("screen and (resolution: " + window.devicePixelRatio + "dppx)");
        this._resolutionMediaMatchList.addListener(this._outerListener);
    };
    ScreenDprMonitor.prototype.clearListener = function () {
        if (!this._listener) {
            return;
        }
        this._resolutionMediaMatchList.removeListener(this._outerListener);
        this._listener = null;
        this._outerListener = null;
    };
    return ScreenDprMonitor;
}(Lifecycle_1.Disposable));
exports.ScreenDprMonitor = ScreenDprMonitor;

},{"../common/Lifecycle":29}],63:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = function (val, depth) {
    if (depth === void 0) { depth = 5; }
    if (typeof val !== 'object') {
        return val;
    }
    if (val === null) {
        return null;
    }
    var clonedObject = Array.isArray(val) ? [] : {};
    for (var key in val) {
        clonedObject[key] = depth <= 1 ? val[key] : exports.clone(val[key], depth - 1);
    }
    return clonedObject;
};

},{}],64:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MouseHelper = (function () {
    function MouseHelper(_renderer) {
        this._renderer = _renderer;
    }
    MouseHelper.getCoordsRelativeToElement = function (event, element) {
        if (event.pageX === null || event.pageX === undefined) {
            return null;
        }
        var originalElement = element;
        var x = event.pageX;
        var y = event.pageY;
        while (element) {
            x -= element.offsetLeft;
            y -= element.offsetTop;
            element = element.offsetParent;
        }
        element = originalElement;
        while (element && element !== element.ownerDocument.body) {
            x += element.scrollLeft;
            y += element.scrollTop;
            element = element.parentElement;
        }
        return [x, y];
    };
    MouseHelper.prototype.getCoords = function (event, element, charMeasure, lineHeight, colCount, rowCount, isSelection) {
        if (!charMeasure.width || !charMeasure.height) {
            return null;
        }
        var coords = MouseHelper.getCoordsRelativeToElement(event, element);
        if (!coords) {
            return null;
        }
        coords[0] = Math.ceil((coords[0] + (isSelection ? this._renderer.dimensions.actualCellWidth / 2 : 0)) / this._renderer.dimensions.actualCellWidth);
        coords[1] = Math.ceil(coords[1] / this._renderer.dimensions.actualCellHeight);
        coords[0] = Math.min(Math.max(coords[0], 1), colCount + (isSelection ? 1 : 0));
        coords[1] = Math.min(Math.max(coords[1], 1), rowCount);
        return coords;
    };
    MouseHelper.prototype.getRawByteCoords = function (event, element, charMeasure, lineHeight, colCount, rowCount) {
        var coords = this.getCoords(event, element, charMeasure, lineHeight, colCount, rowCount);
        var x = coords[0];
        var y = coords[1];
        x += 32;
        y += 32;
        return { x: x, y: y };
    };
    return MouseHelper;
}());
exports.MouseHelper = MouseHelper;

},{}],65:[function(require,module,exports){
require('vm.js');
const util = require('util.js');

function Assembler_Impl(vm)
{
  this.vm = vm;
  this.calls = [];
  this.labels = new Map;
  this._ip = 0;
}

Assembler_Impl.prototype.call_op = function(proxy, op, args)
{
    if(op == 'times') {
        for(var i = 0; i < args[0]; i++) {
            args[1](proxy, i);
        }
    } else {
        this.calls.push([ op ].concat(args));
        switch(op) {
        case 'float32':
        case 'int32':
        case 'uint32':
        case 'addr':
            this._ip += VM.CPU.REGISTER_SIZE;
            break;
        case 'bytes':
            var inc = args[0].length;
            this._ip += Math.ceil(inc / VM.CPU.INSTRUCTION_SIZE) * VM.CPU.INSTRUCTION_SIZE; // align to instruction size
          break;
        default:
            this._ip += VM.CPU.INSTRUCTION_SIZE;
        }
    }

    return this;
}

Assembler_Impl.prototype.assemble_to_array = function()
{
    /*
    var self = this;
    return flattenDeep(map_each_n(this.calls, function(op_call, n) {
        return self.encode_call_args(vm, op_call, n);
    }));
    */
    var arr = [];
    for(var i = 0; i < this.calls.length; i++) {
        var ins = this.encode_call_args(this.vm, this.calls[i], i, arr.length * VM.CPU.INSTRUCTION_SIZE);
        arr = arr.concat(ins);
    }

    return arr;
}

Assembler_Impl.prototype.assemble = function()
{
    var shorts = Uint16Array.from(this.assemble_to_array());
    var shorts_dv = new DataView(shorts.buffer, shorts.byteOffset);
    for(var i = 0; i < shorts.length; i++) {
        shorts_dv.setUint16(i*2, shorts[i], true);
    }
    return new Uint8Array(shorts.buffer, shorts.byteOffset);
}

Assembler_Impl.prototype.encode_call_args = function(vm, op_call, n, ip)
{
    if(op_call[0] == 'int32' || op_call[0] == 'uint32' || op_call[0] == 'addr') {
        if(typeof(op_call[1]) == 'string') {
            var value = this.resolve(op_call[1]);
            if(op_call[2]) { // relative
                value -= ip;
            }
            if(typeof(op_call[3]) == 'function') {
              value = op_call[3](value);
            }
            return [ value & 0xFFFF, value >> 16 ];
        } else {
            return [ op_call[1] & 0xFFFF, op_call[1] >> 16 ];
        }
    } else if(op_call[0] == 'float32') {
        var sb = new Uint16Array(VM.TYPES.FLOAT.byte_size / VM.TYPES.SHORT.byte_size);
        var dv = new DataView(sb.buffer);
        VM.TYPES.FLOAT.set(dv, 0, op_call[1]);
        return Array.from(sb);
    } else if(op_call[0] == 'bytes') {
        var src = op_call[1];
        var sa = new Uint16Array(Math.ceil(src.length / VM.CPU.INSTRUCTION_SIZE));
      var bytes = new Uint8Array(sa.buffer);
      if(typeof(src) == 'string') {
        for(var i = 0; i < src.length; i++) {
          bytes[i] = src.charCodeAt(i);
        }
      } else {
        for(var i = 0; i < src.length; i++) {
            bytes[i] = src[i];
        }
      }
        return Array.from(sa);
    } else {
        var op_code = VM.CPU.INS[op_call[0].toUpperCase()];
        var ins = VM.CPU.INS_INST[op_code];
        if(!ins) { throw "Unknown op code " + op_call; }
        
        var self = this;
        op_call = util.map_each_n(op_call.slice(1), function(arg, arg_n) {
            if(typeof(arg) == 'string') {
                return self.resolve(arg) || register_index(arg);
            } else {
                return arg;
            }
        });
        var list = ins.encoder_list(op_call);
        return VM.CPU.encode(list);
    }
}

Assembler_Impl.prototype.label = function(name, value)
{
    if(value == null) value = this.ip();
    this.labels[name] = value;
    return this;
}

Assembler_Impl.UnknownKeyError = function(label)
{
    this.msg = "Unknown key";
    this.label = label;
}
Assembler_Impl.UnknownKeyError.prototype.toString = function()
{
  return this.msg + ": " + this.label;
}

Assembler_Impl.prototype.resolve = function(label, relative)
{
  if(this.labels[label] == null) {
        throw new Assembler_Impl.UnknownKeyError(label);
    }

    if(relative == true) {
        return this.labels[label] - this.ip();
    } else {
        return this.labels[label];
    }
}

Assembler_Impl.prototype.ip = function()
{
    return this._ip;
}

var Assembler_Proxy = {
    get: function(impl, prop) {
        if(typeof(impl[prop]) == 'function') {
            return function() {
                var r = impl[prop].apply(impl, arguments);
                if(r == impl) return this;
                else return r;
            }
        } else if(prop == 'labels') {
            return impl.labels;
        } else if(prop == 'calls') {
            return impl.calls;
        } else if(prop == '_target') {
            return impl;
        } else {
            return function() {
                impl.call_op(this, prop, Array.from(arguments))
                return this;
            }
        }
    }
};

function Assembler(vm)
{
  if(!vm && typeof(window) != 'undefined') {
    vm = window.vm;
  }

  var asm = new Assembler_Impl(vm);
  
  return new Proxy(asm, Assembler_Proxy);
}

if(typeof(module) != 'undefined') {
	module.exports = Assembler;
}

},{"util.js":77,"vm.js":80}],66:[function(require,module,exports){
const util = require("util.js");

function assert(a, msg)
{
	  if(typeof(a) == 'function') {
		    a = a();
	  }
	  if(!a) {
        throw(msg);
	  }
}

function assert_eq(a, b, msg)
{
	  if(typeof(a) == 'function') {
		    a = a();
	  }
	  if(typeof(b) == 'function') {
		    b = b();
	  }
    assert(a == b, msg + ": '" + a + "' == '" + b + "'");
}

function assert_equal(a, b, msg)
{
	  if(typeof(a) == 'function') {
		    a = a();
	  }
	  if(typeof(b) == 'function') {
		    b = b();
	  }
    assert(util.equals(a, b), msg + ": '" + a + "' equals '" + b + "'");
}

function assert_not_equal(a, b, msg)
{
	  if(typeof(a) == 'function') {
		    a = a();
	  }
	  if(typeof(b) == 'function') {
		    b = b();
	  }
    assert(!util.equals(a, b), msg + ": '" + a + "' not equal to '" + b + "'");
}

function assert_throws(f, err, msg)
{
    try {
        f.call(this);
        assert(false, msg);
    } catch(e) {
        if(err) {
            assert_equal(e, err, msg);
        }
    }
}

if(typeof(module) != 'undefined') {
  module.exports = {
    assert: assert,
    eq: assert_eq,
    equal: assert_equal,
    not_equal: assert_not_equal,
    is_thrown: assert_throws
  };
}

},{"util.js":77}],67:[function(require,module,exports){
"use strict";

const util = require('util.js');

function DataStruct(fields, little_endian, alignment)
{
    this.fields = new Map();
    this.num_fields = 0;
    this.endianess = little_endian || true;
    this.alignment = alignment || 1;
    var offset = 0;
    for(var n in fields) {
        var f = new DataStruct.Field(fields[n], n, offset);
      offset += f.byte_size;
      offset = this.align(offset);
        this.fields[f.name] = f;
        this.fields[n] = f;
        this.num_fields++;
    }
    this.byte_size = offset;
}

DataStruct.prototype.align = function(bytes)
{
  return Math.ceil(bytes / this.alignment) * this.alignment;
}

DataStruct.prototype.field_at_offset = function(offset)
{
    for(var i = 0; i < this.num_fields; i++) {
        var field = this.fields[i];
        if(offset >= field.offset && offset < (field.offset + field.byte_size)) {
            return field;
        }
    }

    return null;
}

DataStruct.prototype.fields_spanning = function(offset, num_bytes)
{
    var fields = [];
    for(var i = 0; i < this.num_fields; i++) {
        var field = this.fields[i];
        if(field.offset >= offset && field.offset < (offset + num_bytes)) {
            fields.push(field);
        } else if(field.offset >= (offset + num_bytes)) {
            break;
        }
    }
    return fields;
}

DataStruct.prototype.allocate = function(dv)
{
    if(dv == null) {
        var ab = new ArrayBuffer(this.byte_size);
        dv = new DataView(ab);
    }
    return this.proxy(dv);
}

DataStruct.prototype.get = function(dv, offset)
{
    dv = new DataView(dv.buffer, dv.byteOffset + offset);
    return this.allocate(dv);
}

DataStruct.prototype[Symbol.iterator] = function*()
{
    for(var i = 0; i < this.num_fields; i++) {
        yield(this.fields[i].name);
    }
}


DataStruct.Field = function(field_def, number, offset)
{
    this.name = field_def[0];
    this.id = parseInt(number);
    if(typeof(field_def[1]) == 'number') {
        this.elements = field_def[1];
        this.type = field_def[2];
        this.default_value = field_def[3];
        if(VM.TYPES[this.type.name] != this.type) {
            this.struct = true;
        }
    } else {
        this.elements = null;
        this.type = field_def[1];
        this.default_value = field_def[2];
    }
    this.offset = offset;
    this.byte_size = this.type.byte_size * (this.elements || 1);
}

DataStruct.View = function(ds, dv)
{
    this.ds = ds;
    this.dv = dv;
    this._proxies = [];
}

DataStruct.View.prototype.get_array = function(field)
{
    if(field.struct) {
        if(!this._proxies[field.id]) {
            var self = this;
            this._proxies[field.id] = util.n_times(field.elements, function(n) {
                return field.type.proxy(new DataView(self.dv.buffer,
                                                     self.dv.byteOffset
                                                     + field.offset
                                                     + field.type.byte_size * n
                                                    ));
            });
        }
        return this._proxies[field.id];
    } else {
        return field.type.proxy(this.dv.buffer, this.dv.byteOffset + field.offset, field.elements);
    }
}

DataStruct.View.prototype.get = function(field)
{
    var f = this.ds.fields[field];
    if(f) {
        if(f.elements != null) {
            return this.get_array(f);
        } else if(f.type != null) {
            return f.type.get(this.dv, f.offset, this.ds.endianess);
        }
    }

    return null;
}

DataStruct.View.prototype.set = function(field, value)
{
    var f = this.ds.fields[field];
    var r = f.type.set(this.dv, f.offset, value, this.ds.endianess);
    return r;
}

DataStruct.View.prototype.read = function(offset, count, output)
{
    var arr = new Uint8Array(this.dv.buffer, this.dv.byteOffset);
    if(output) {
        var i;
        for(i = 0; i < count; i++) {
            if(offset + i >= arr.length) {
                break;
            }
            output[i] = arr[offset + i];
        }
        return i;
    } else {
		    return arr.subarray(offset, offset + count);
    }    
}

DataStruct.View.prototype.write = function(offset, data)
{
    var arr = new Uint8Array(this.dv.buffer, this.dv.byteOffset);
    var i;

    for(i = 0; i < data.length; i++) {
        if(offset + i >= arr.length) {
            break;
        }
		    arr[offset + i] = data[i];
    }

    return i;
}

DataStruct.View.prototype.update_from = function(obj)
{
    for(var field of this) {
        if(obj[field]) {
            this.set(field, obj[field]);
        }
    }

    return this;
}

DataStruct.View.prototype[Symbol.iterator] = function*()
{
    for(var i of this.ds) {
        yield(i);
    }
}

DataStruct.View.prototype.to_object = function()
{
    var o = {};
    for(var f of this) {
        o[f] = this.get(f);
    }
    return o;
}

DataStruct.View.prototype.toString = function()
{
    var fields = [];
    for(var f of this.ds) {
        fields.push(f);
    }
    return "[DataStruct: " + fields.join(", ") + "]";
}

DataStruct.View.Proxy = {
    get: function(view, prop) {
        if(prop == Symbol.iterator || (prop.match && prop.match(/^(read|write|toString|to_object|update_from)$/g) != null)) {
            return function() {
                var r = view[prop].apply(view, arguments);
                if(r === view) {
                    return this;
                } else {
                    return r;
                }
            }
        } else if(prop == 'view') {
            return view;
        } else if(prop.match && prop.match(/^(ds|dv)$/g) != null) {
            return view[prop];
        } else {
            return view.get(prop);
        }
    },
    set: function(view, prop, value) {
        view.set(prop, value);
        return this;
    }
};

DataStruct.prototype.view = function(dv)
{
    return new DataStruct.View(this, dv);
}

DataStruct.prototype.proxy = function(dv)
{
    var view = this.view(dv);
    return new Proxy(view, DataStruct.View.Proxy);
}

if(typeof(module) != 'undefined') {
  module.exports = DataStruct;
}

},{"util.js":77}],68:[function(require,module,exports){
function Enum(values)
{
    this._keys = [];
    
    if(values instanceof Array) {
        var n = 0;
        for(var i = 0; i < values.length; i++) {
            if(values[i] instanceof Array) {
                n = values[i][1];
                this[n] = values[i][0];
                this[values[i][0]] = n;
            } else {
                this[n] = values[i];
                this[values[i]] = n;
            }
            this._keys.push(this[n]);
            n += 1;
        }
    } else {
        for(var i in values) {
            this[i] = values[i];
            this[values[i]] = i;
            this._keys.push(this[i]);
        }
    }
}

Enum.prototype.keys = function()
{
    return this._keys;
}

Enum.prototype.values = function()
{
    var v = [];
    for(var i of this.keys()) {
        v.push(this[i]);
    }
    return v;
}

Enum.prototype[Symbol.iterator] = function*()
{
    for(var i of this._keys) {
        yield(i);
    }
}

if(typeof(module) != 'undefined') {
  module.exports = Enum;
}

},{}],69:[function(require,module,exports){
module.exports = {
  Storage: require('key_value/storage'),
  IDB: require('key_value/indexdb'),
  IPFS: require('key_value/ipfs'),
  HTTP: require('key_value/http'),
  Table: require('key_value/table')  
};

},{"key_value/http":70,"key_value/indexdb":71,"key_value/ipfs":72,"key_value/storage":73,"key_value/table":74}],70:[function(require,module,exports){
(function (global){
// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-
const TextDecoder = require('util/text_decoder');
const TextEncoder = require('util/text_encoder');

function KV(fetch)
{
  this._fetch = fetch || global.fetch;
}

KV.prototype.enable = function(callback)
{
  callback(false);
  return this;
}

KV.prototype.disable = function(callback)
{
  callback(false);
  return this;
}

KV.prototype.unpack_key = function(key)
{
  if(typeof(key) == 'string') return key;
  return (new TextDecoder()).decode(key).replace(/[\x00]+$/, '');
}

KV.prototype.pack_key = function(str)
{
	if(typeof(str) == 'string')
	return (new TextEncoder).encode(str);
	return str;
}

KV.prototype.fetch = function(key, opts)
{
  return this._fetch.call(global, this.unpack_key(key), opts);
}

KV.prototype.send_request = function(key, req_opts, callback)
{
  return this.fetch(key, req_opts).then((response) => {
    if(response.ok) {
      response.arrayBuffer().then((body) => {
        callback(this.pack_key(response.url), new Uint8Array(body));
      });
    } else {
      callback(key, null);
    }
  }).catch((error) => {
    console.log("HTTP exception", error);
    callback(key, null);
  });
}

KV.prototype.getValue = function(key, offset, length, callback)
{
  var headers = {};
  if(offset) {
    if(!length) length = '';
    headers['Range'] = 'bytes=' + offset + '-' + length;
  }

  this.send_request(key, {
    method: "GET",
    headers: headers
  }, callback);

  return this;
}

KV.prototype.setItem = function(key, value, callback)
{
  this.send_request(key, {
    method: "POST"
  }, callback);

  return this;
}

KV.prototype.getSize = function(key, callback)
{
  this.fetch(key, {
    method: "HEAD"
  }).then((response) => {
    callback(this.pack_key(response.url), response.headers['Content-Length']);
  }).catch((error) => {
    console.log("HTTP exception", error);
    callback(key, null);
  });

  return this;
}

KV.prototype.removeItem = function(key, callback)
{
  this.fetch(key, {
    method: 'DELETE'
  }).then((response) => {
    callback(key, response.ok);
  }).catch((error) => {
    console.log("HTTP exception", error);
    callback(key, null);
  });

  return this;
}

if(typeof(module) != 'undefined') {
  module.exports = KV;
}
if(typeof(window) != 'undefined') {
  if(!window['KeyValue']) {
    window['KeyValue'] = {};
  }
  window.KeyValue.HTTP = KV;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/text_decoder":78,"util/text_encoder":79}],71:[function(require,module,exports){
// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-
const VERSION = 4;

function DBStore(db_name, callback, version)
{
  this.db_name = db_name;
  this.version = version || VERSION;
  this.enable(callback);
}

DBStore.prototype.upgrade = function(callback)
{
  if(!this.db.objectStoreNames.contains(this.db_name)) {
    var req = this.db.createObjectStore(this.db_name, { keyPath: 'key' });
    req.onsuccess = () => { callback(false); };
    req.onerror = () => { callback(true); };
    req.createIndex('key', 'key', { unique: true });
  } else {
    // any migrations?
    callback(false);
  }
  return this;
}

DBStore.prototype.transaction = function(mode, oncomplete, onerror)
{
  var transaction = this.db.transaction([this.db_name], mode || 'readonly');
  transaction.oncomplete = oncomplete || ((error) => console.log('txn complete', error));
  transaction.onerror = onerror || ((error) => console.log('txn error', error));
  return transaction.objectStore(this.db_name);
}

DBStore.prototype.enable = function(callback)
{
  if(!this.db) {
    if(typeof(indexedDB) == 'undefined') {
      callback(true);
      return false;
    }
    
    var req = indexedDB.open(this.db_name, this.version);
    req.onerror = (event) => { this.db = null; callback(true); }
    req.onsuccess = (event) => { this.db = req.result; callback(false); }
    req.onupgradeneeded = (event) => {
      this.db = req.result;
      this.upgrade(callback);
    }
  } else {
    callback(false);
  }
  
  return this;
}

DBStore.prototype.disable = function(callback)
{
  if(this.db) {
    this.db.close();
    this.db = null;
  }

  callback(false);
  return this;
}

DBStore.prototype.getItem = function(key, callback)
{
  var transaction = this.transaction('readonly',
                                     (event) => {
                                       callback(key, req.result);
                                     }, (event) => {
                                       callback(key, null);
                                     });
  var req = transaction.get(key);
  return this;
}

DBStore.prototype.getValue = function(key, offset, max_length, callback)
{
  return this.getItem(key, (new_key, item) => {
    var data = item ? item.value : null;
    if(data && (offset || max_length)) {
      var length = Math.min(data.length, max_length);
      data = data.slice(offset, offset + length);
    }
    callback(new_key, data);
  });
}

DBStore.prototype.getSize = function(key, callback)
{
  return this.getItem(key, (new_key, item) => {
    callback(new_key, item ? item.size : null);
  });
}

DBStore.prototype.setItem = function(key, value, callback)
{
  var tn = this.transaction('readwrite',
                            (event) => { callback(key, true); },
                            (event) => { callback(key, null); });
  var req = tn.put({ key: key, value: value, size: value.length });
  return this;
}

DBStore.prototype.removeItem = function(key, callback)
{
  var tn = this.transaction('readwrite',
                            () => { callback(key, true); },
                            () => { callback(key, false); });
  var req = tn.delete(key);
  return this;
}

if(typeof(module) != 'undefined') {
  module.exports = DBStore;
}
if(typeof(window) != 'undefined') {
  window.KeyValueDB = DBStore;
}

},{}],72:[function(require,module,exports){
(function (global){
// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

// TODO ipfs passphrase and keys for enable/reset and private key generation
// TODO storage for ipfs key(s)

const TextDecoder = require('util/text_decoder');
const TextEncoder = require('util/text_encoder');

function KV(ipfs, repo)
{
  this.ipfs = ipfs || global.IPFS;
  this.repository = repo || "ipfs";
}

KV.prototype.enable = function(callback)
{
  if(this.node) {
    callback(false);
    return this;
  }
  
  this.node = new this.ipfs({ repo: this.repository });
  this.node.once('error', () => {
    this.ready = false;
    callback(true);
  });
  this.node.once('ready', () => {
    this.ready = true;
    console.log("IPFS ready");
    callback(false);
  });

  return this;
}

KV.prototype.disable = function(callback)
{
  if(this.node == null) {
    callback(false);
    return this;
  }
  
  this.node.shutdown().then(() => {
    this.node = null;
    this.ready = null;
    callback(false)
  }).catch(() => {
    this.node = null;
    this.ready = null;
    callback(true)
  });

  return this;
}

KV.prototype.unpack_key = function(key)
{
  if(typeof(key) == 'string') return key;
  return (new TextDecoder()).decode(key).replace(/[\x00]+$/, '');
}

KV.prototype.pad_key = function(str)
{
	if(typeof(str) == 'string')
	return (new TextEncoder).encode(str);
	return str;
}


KV.prototype.getValue = function(key, offset, max_length, callback)
{
  this.node.cat(this.unpack_key(key), {
    offset: offset,
    length: max_length
  }, (err, data) => {
    if(err) {
      callback(key, null);
    } else {
      callback(key, data);
    }
  });

  return this;
}

KV.prototype.setItem = function(key, value, callback)
{
  this.node.add(this.ipfs.Buffer.from(value), (err, res) => {
    if(err || !res) {
      callback(key, null);
    } else {
      callback(this.pad_key(res[0].hash), true);
    }
  });
}

KV.prototype.getSize = function(key, callback)
{
  this.getItem(key, (new_key, data) => {
    callback(new_key, data ? data.length : null);
  });
  
  return this;
}

KV.prototype.removeItem = function(key, callback)
{
  callback(key, null);
  return this;
}

if(typeof(module) != 'undefined') {
  module.exports = KV;
}
if(typeof(window) != 'undefined') {
  if(!window['KeyValue']) {
    window['KeyValue'] = {};
  }
  window.KeyValue.IPFS = KV;
}


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/text_decoder":78,"util/text_encoder":79}],73:[function(require,module,exports){
// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

const TextEncoder = require('util/text_encoder');
const TextDecoder = require('util/text_decoder');
const more_util = require('more_util');

function KV(storage)
{
  this.storage = storage;
}

KV.prototype.enable = function(callback)
{
  callback(this.storage == null);
  return this;
}

KV.prototype.disable = function(callback)
{
  callback(false);
  return this;
}

KV.prototype.getItem = function(key, attr, callback)
{
  var value = this.storage.getItem(this.from_bytes(key) + '/' + attr);
  callback(key, value);
  return this;
}

KV.prototype.getValue = function(key, offset, max_length, callback)
{
  return this.getItem(key, 'value', (new_key, item) => {
    var data = item ? this.to_bytes(item) : null;
    if(data && (offset || max_length)) {
      var length = Math.min(data.length, max_length);
      data = data.slice(offset, offset + length);
    }
    callback(new_key, data);
  });
}

KV.prototype.getSize = function(key, callback)
{
  return this.getItem(key, 'size', (new_key, item) => {
    callback(new_key, item ? parseInt(size) : null);
  });
}

KV.prototype.setItem = function(key, value, callback)
{
  var key_string = this.from_bytes(key);
  this.storage.setItem(key_string + '/value', this.from_bytes(value));
  this.storage.setItem(key_string + "/size", value.length);
  callback(key, true);
  return this;
}

KV.prototype.removeItem = function(key, callback)
{
  var key_string = this.from_bytes(key);
  this.storage.removeItem(key_string + '/value');
  this.storage.removeItem(key_string + '/size');
  callback(key, true);
  return this;
}

KV.prototype.to_bytes = function(buffer)
{
  return new Uint8Array(more_util.from_hexdump(buffer));
}

KV.prototype.from_bytes = function(str)
{
  return more_util.to_hexdump(str);
}

if(typeof(module) != 'undefined') {
  module.exports = KV;
}
if(typeof(window) != 'undefined') {
  window.KeyValueDB = KV;
}


},{"more_util":75,"util/text_decoder":78,"util/text_encoder":79}],74:[function(require,module,exports){
// -*- mode: JavaScript; coding: utf-8-unix; javascript-indent-level: 2 -*-

const TextDecoder = require('util/text_decoder');
const TextEncoder = require('util/text_encoder');

function KV(data)
{
  this.data = data || new Object();
}

KV.prototype.enable = function(callback)
{
  callback(false);
  return this;
}

KV.prototype.disable = function(callback)
{
  callback(false);
  return this;
}

KV.prototype.pack_key = function(key)
{
  if(typeof(key) == 'string') return key;
  return (new TextDecoder()).decode(key).replace(/[\x00]+$/, '');
}

KV.prototype.unpack_key = function(str)
{
	if(typeof(str) == 'string')
	return (new TextEncoder).encode(str);
	return str;
}

KV.prototype.getValue = function(key, offset, length, callback)
{
  var value = this.data[this.pack_key(key)];
  if(value) value = value.slice(offset, offset+length);
  callback(key, value);
  return this;
}

KV.prototype.setItem = function(key, value, callback)
{
  this.data[this.pack_key(key)] = value;
  callback(key, true);
  return this;
}

KV.prototype.getSize = function(key, callback)
{
  var length = null;
  var value = this.data[this.pack_key(key)];
  if(value) length = value.length;
  callback(key, length);
  return this;
}

KV.prototype.removeItem = function(key, callback)
{
  delete this.data[this.pack_key(key)];
  callback(key, true);
  return this;
}

if(typeof(module) != 'undefined') {
  module.exports = KV;
}
if(typeof(window) != 'undefined') {
  if(!window['KeyValue']) {
    window['KeyValue'] = {};
  }
  window.KeyValue.Table = KV;
}


},{"util/text_decoder":78,"util/text_encoder":79}],75:[function(require,module,exports){
(function (global){
"use strict";

var REQUIRED_SCRIPTS = [];

if(false || typeof(global) == 'undefined') {
  function require(url)
  {
    // these calls get scanned and added to the HTML
    REQUIRED_SCRIPTS.push(url);
  }
}

function equals(a, b)
{
    if(typeof(a) != typeof(b)) {
        return false;
    } else if((a == null || typeof(a) != 'object')
              && (b == null || typeof(b) != 'object')) {
        return a == b;
    } else if(a instanceof Array && b instanceof Array) {
        if(a.length != b.length) {
            return false;
        }
        
        for(var i = 0; i < a.length; i++) {
            if(!equals(a[i], b[i])) return false;
        }
        
        return true;
    } else if(a[Symbol.iterator] && b[Symbol.iterator]) {
        for(var i of a) {
            if(!equals(a[i], b[i])) return false;
        }
        for(var i of b) {
            if(!equals(a[i], b[i])) return false;
        }
        return true;
    } else if(typeof(a) == 'object' && typeof(b) == 'object') {
        for(var i in a) {
            if(!equals(a[i], b[i])) return false;
        }
        for(var i in b) {
            if(!equals(a[i], b[i])) return false;
        }
        return true;
    } else {
        return (a == null && b == null);
    }
}

function to_method(f)
{
    if(typeof(f) == 'string') {
        f = function(F) { return function(v) {
            return v[F]();
        } }(f);
    }

    return f;
}

function to_kv_method(f)
{
    if(typeof(f) == 'string') {
        f = function(F) { return function(k, v) {
            return v[F]();
        } }(f);
    }

    return f;
}

function merge_options(defaults, options)
{
	var r = {};
	for(var i in defaults) {
		r[i] = defaults[i];
	}
	for(var i in options) {
		r[i] = options[i];
	}
	return r;
}

function map_each(o, f)
{
    var r = {};
    f = to_kv_method(f);
    
    for(var k in o) {
        r[k] = f(k, o[k]);
    }
    return r;
}

function map_each_n(o, f)
{
    var r = [];
    f = to_kv_method(f);
    
    for(var i = 0; i < o.length; i++) {
        r[i] = f(o[i], i);
    }
    return r;
}

function map_each_key(o, f)
{
    var r = {};
    f = to_kv_method(f);

    for(var k in o) {
        r[f(k, o[k])] = o[k];
    }
    return r;
}

function reject_if(o, f)
{
    var r = [];
    f = to_kv_method(f);

    for(var k in o) {
        if(f(o[k], k) == false) {
            r[k] = o[k];
        }
    }
    return r;
}

function reject_n_if(o, f)
{
    var r = [];
    f = to_kv_method(f);

    for(var i = 0; i < o.length; i++) {
        if(f(o[i], i) == false) {
            r.push(o[i]);
        }
    }
    return r;
}

function remove_value(arr, o)
{
    var i = arr.indexOf(o);
    return remove_n(arr, i);
}

function remove_n(arr, n)
{
    return arr.splice(0, n - 1).concat(arr.splice(n + 1));
}

function flatten(a, r)
{
	if(r == undefined) {
		r = [];
	}
	for(var i = 0; i < a.length; i++) {
		if(typeof(a[i]) == 'object') {
			flatten(a[i], r);
		} else {
			r.push(a[i]);
		}
	}
	return r;
};

function flattenDeep(arr1){
   return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}

function n_times(n, f) {
    var ret = new Array(n);
    f = to_method(f);

    for(var i = 0; i < n; i++) {
        ret[i] = f(i);
    }
    return ret;
}

function uniques(arr) {
    var tbl = {};
    for(var i in arr) {
        tbl[arr[i]] = arr[i];
    }
    var ret = [];
    for(var i in tbl) {
        ret.push(tbl[i]);
    }
    return ret;
}

function to_hexdump(arr)
{
    return flattenDeep(map_each_n(arr, function(c, n) {
        return c.toString(16).padStart(2, '0');
    })).join(' ');
}

function from_hexdump(s)
{
  return s.split(/\s+/).map((c) => parseInt(c, 16));
}

function string_to_hexdump(s)
{
  return to_hexdump(s.split('').map((c) => c.charCodeAt(0)));
}

function string_from_hexdump(s)
{
  return from_hexdump(s).reduce((s, c) => s += String.fromCharCode(c), '');
}

const Exports = {
    map_each: map_each,
    map_each_n: map_each_n,
    n_times: n_times,
    equals: equals,
    merge_options: merge_options,
    flattenDeep: flattenDeep,
    to_hexdump: to_hexdump,
    from_hexdump: from_hexdump,
    string_to_hexdump: string_to_hexdump,
    string_from_hexdump: string_from_hexdump
};

if(typeof(module) != 'undefined') {
  module.exports = Exports;
}
if(typeof(window) != 'undefined') {
  window.util = Exports;
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],76:[function(require,module,exports){
function PagedHash()
{
  this.page_table = new Array(PagedHash.PageCount * PagedHash.PageSize);
  this.ranges = new Array();
}

PagedHash.NotMappedError = function(addr) {
  this.msg = "Not mapped error: " + addr;
  this.address = addr;
}

PagedHash.AlreadyMappedError = function(addr) {
  this.msg = "Already mapped error: " + addr;
  this.address = addr;
}

PagedHash.PageCount = 1024;
PagedHash.PageSize = 1024 * 4;

function page_count(n, size)
{
  if(size == null) size = PagedHash.PageSize;
  return Math.ceil(n / size);
}

PagedHash.Range = function(n, addr, size, value)
{
  this.id = n;
  this.addr = addr;
  this.size = size;
  this.page_count = page_count(size);
  this.value = value;
}

PagedHash.prototype.add = function(addr, size, value)
{
  if(this.get(addr)) throw new PagedHash.AlreadyMappedError(addr);
  var range = new PagedHash.Range(this.ranges.length, addr, size, value);
  this.ranges.push(range);
  this.add_page_table_entries(range);
  return this;
}

PagedHash.prototype.remove = function(addr)
{
  var range = this.get(addr);

  if(range) {
    this.remove_page_table_entries(range);
    delete this.ranges[range.id];
  } else {
    throw new PagedHash.NotMappedError(addr);
  }

  return this;
}

PagedHash.prototype.get = function(addr)
{
  return this.page_table[this.page_for_address(addr)];
}

PagedHash.prototype.get_value = function(addr)
{
  var item = this.get(addr);
  if(item) return item.value;
  else throw new PagedHash.NotMapppedError(addr);
}

PagedHash.prototype.set_value = function(addr)
{
  this.get(addr).value = value;
}

PagedHash.prototype.range_for = function(value)
{
  for(var i in this.ranges) {
    if(this.ranges[i].value == value) {
      return this.ranges[i];
    }
  }

  return null;
}

PagedHash.prototype.add_page_table_entries = function(item)
{
  var page = this.page_for_address(item.addr);
  
  for(var i = 0; i < item.page_count; i++) {
    this.page_table[page + i] = item;
  }
}

PagedHash.prototype.remove_page_table_entries = function(item)
{
  var page = this.page_for_address(item.addr);
  
  for(var i = 0; i < item.page_count; i++) {
    this.page_table[page + i] = null;
  }
}

PagedHash.prototype.page_for_address = function(addr)
{
  return Math.floor(addr / PagedHash.PageSize);
}

PagedHash.prototype.map = function(f)
{
  return this.ranges.map(f);
}

if(typeof(module) != 'undefined') {
  module.exports = PagedHash;
}

},{}],77:[function(require,module,exports){
const more_util = require('more_util');
module.exports = more_util;
},{"more_util":75}],78:[function(require,module,exports){
(function (global){
const node_util = require('util');

function TD(encoding)
{
}

TD.prototype.decode = function(bytes, options)
{
    return String.fromCharCode.apply(null, bytes);
}

var TextDecoder = TD;
if(node_util != null && node_util['TextDecoder']) { TextDecoder = node_util['TextDecoder'] };
if(global['TextDecoder']) { TextDecoder = global['TextDecoder'] };

if(typeof(module) != 'undefined') {
  module.exports = TextDecoder;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util":115}],79:[function(require,module,exports){
(function (global){
const node_util = require('util');

function TE(encoding)
{
}

TE.prototype.encode = function(str, options)
{
  var buffer = new Uint8Array(str.length);
  for(var i = 0; i < str.length; i++) {
    buffer[i] = str.charCodeAt(i);
  }
  return buffer;
}

var TextEncoder = TE;
if(node_util != null && node_util['TextEncoder']) { TextEncoder = node_util['TextEncoder']; }
if(global['TextEncoder']) { TextEncoder = global['TextEncoder']; }

if(typeof(module) != 'undefined') {
  module.exports = TextEncoder;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util":115}],80:[function(require,module,exports){
(function (global){
const util = require('util.js');

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

require('vm/types.js');
require('vm/cpu.js');
require('vm/vm-doc.js');
require('vm/vm-c.js');
require('vm/container.js');
require('vm/devices.js');

VM.Assembler = require('assembler');

VM.run_tests = function()
{
    for(let prop in this) {
        if(this[prop]['test_suite']) {
            console.log("Running tests for " + prop);
            this[prop].test_suite();
        }
    }
}

if(typeof(module) != 'undefined') {
  module.exports = VM;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"assembler":65,"util.js":77,"vm/container.js":81,"vm/cpu.js":82,"vm/devices.js":83,"vm/types.js":104,"vm/vm-c.js":105,"vm/vm-doc.js":106}],81:[function(require,module,exports){
(function (global){
"use strict";
    
if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

require('vm/cpu.js');
const Console = require('vm/devices/console');
const InterruptHandle = require('vm/interrupt_handle');

VM.Container = function(callbacks)
{
    this.devices = [];
    this.cpu = null;
    this.mem = null;
    this.mmu = null;
    this.stopping = false;
    this.window = null;
    this.timer = null;
    this.cycles = 0;
    this.max_cycles = 10000;
    this.callbacks = callbacks || {};
}

VM.Container.prototype.add_device = function(dev)
{
    this.devices.push(dev);
    if(this.cpu == null && dev instanceof VM.CPU) {
        this.cpu = dev;
    }
    if(this.mem == null && dev instanceof VM.MemoryBus) {
        this.mem = dev;
    }
    if(this.mmu == null && dev instanceof VM.MMU) {
        this.mmu = dev;
    }
    if(this.devcon == null && dev instanceof Console) {
        this.devcon = dev;
    }

    this.do_callback('add_device', dev);
    
    return this;
}

VM.Container.prototype.remove_device = function(dev)
{
    this.devices = remove_value(this.device, dev);
    this.do_callback('remove_device');
    return this;
}

VM.Container.prototype.each_device = function(f)
{
    for(var i = 0; i < this.devices.length; i++) {
        f(this.devices[i], i);
    }
}

VM.Container.prototype.run = function(cycles, freq)
{
    this.running = true;
    this.do_callback('run');

    if(cycles == null) cycles = this.max_cycles;
    var done = this.step_loop(cycles);

    this.schedule(done, cycles);
    
    return this;
}

VM.Container.prototype.schedule = function(all_asleep, cycles)
{
    if(!this.stopping) {
        if(this.timer == null) {
            var self = this;
          
            if(all_asleep) {
              if(this.debug) console.log("All asleep.");
            } else {
              if(this.debug) console.log("set Timeout.");
              this.timer = setTimeout(function() {
                self.timer = null;
                self.run(cycles);
              }, 1);
            }
        } else if(this.debug) {
            console.log("Timer exists");
            this.debug_dump();
        }
    } else {
        this.stopping = false;
      this.running = false;
      if(this.timer) {
        clearTimeout(this.timer);
      }
        this.do_callback('stopped');
    }
}

VM.Container.prototype.step_loop = function(cycles)
{
    /*
    if(this.cpu) {
        this.cpu.run(cycles);
    }
*/
    for(var i = 0; i < cycles; i++) {
        var sleepers = this.step();
        if(sleepers == this.devices.length) return true;
    }

    return false;
}

VM.Container.prototype.stop = function()
{
    this.stopping = true;
    
    this.do_callback('stopping');
    
    this.each_device(function(d) {
        if(d.stop) d.stop();
    });

    return this;
}

VM.Container.prototype.reset = function()
{
    this.each_device(function(d) {
        if(d.reset) d.reset();
    });
    this.do_callback('reset');
    return this;
}

VM.Container.prototype.step = function()
{
    this.cycles++;

  if(this.cpu && this.cpu.halted) {
    this.cpu.halted = false;
  }
  
    this.do_callback('step');
    
    var done = 0;
    this.each_device(function(d) {
        if(d.step == null || !d.step()) {
            done++;
        }
    });

    if(this.debug == 2) this.debug_dump();

    return done;
}

VM.Container.prototype.dbstep = function(cycles)
{
    if(cycles == null) { cycles = 1; }

    for(var i = 0; i < cycles; i++) {
        this.debug_dump();
        
        if(this.step() == true) {
            break;
        }
    }

    this.debug_dump();
    return this;
}

VM.Container.prototype.debug_dump = function()
{
    this.each_device(function(d) {
        if(d.debug_dump) {
            d.debug_dump();
        }
    });
    
    return this;
}


VM.Container.prototype.interrupt = function(n)
{
    this.do_callback('interrupt');

    if(this.cpu) {
        this.cpu.interrupt(n);
    }

    if(this.running) {
        this.schedule();
    }

    return this;
}

VM.Container.prototype.interrupt_handle = function(irq)
{
  return new InterruptHandle(this, irq);
}

VM.Container.prototype.do_callback = function(cb, arg)
{
    if(this.callbacks == null || this.callbacks[cb] == null) return;
    
    this.callbacks[cb](this, arg);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"vm/cpu.js":82,"vm/devices/console":84,"vm/interrupt_handle":98}],82:[function(require,module,exports){
(function (global){
"use strict";

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

const util = require('util.js');
require('vm/types.js');
const PagedHash = require('paged_hash.js');
const RangedHash = require('vm/ranged_hash.js');
const DispatchTable = require('vm/dispatch_table.js');
const assert = require('asserts.js');

VM.CPU = function(mem, stack_start, max_cycles)
{
    this.name = "CPU";
    this.stack_start = stack_start || (1<<16);
    this.mem = mem;
	this._reg = new Uint32Array(VM.CPU.REGISTER_COUNT);
    this._reg_view = new DataView(this._reg.buffer);
    this.cycles = 0;
    this._pending_interrupts = [];
    this.keep_running = false;
    this.halted = false;
    this.stepping = false;
    this.running = false;
    this.max_cycles = max_cycles;
	this.reset();
}

VM.CPU.STATUS = {
    NONE: 0,
	ZERO: 1<<0,
	NEGATIVE: 1<<1,
    CARRY: 1<<2,
    ERROR: 1<<3,
	INT_ENABLED: 1<<4,
  	SLEEP: 1<<5,
    INT_FLAG: 1<<6
};
VM.CPU.STATUS.NUMERICS = VM.CPU.STATUS.ZERO | VM.CPU.STATUS.NEGATIVE | VM.CPU.STATUS.CARRY | VM.CPU.STATUS.ERROR;

VM.CPU.REGISTER_SIZE = Uint32Array.BYTES_PER_ELEMENT;
VM.CPU.INSTRUCTION_SIZE = Uint16Array.BYTES_PER_ELEMENT;

VM.CPU.REGISTER_COUNT = 16;
var REGISTERS = {
	INS: VM.CPU.REGISTER_COUNT - 1,
	STATUS: VM.CPU.REGISTER_COUNT - 2,
    ISR: VM.CPU.REGISTER_COUNT - 3,
	IP: VM.CPU.REGISTER_COUNT - 4,
	SP: VM.CPU.REGISTER_COUNT - 5,
    GP_COUNT: VM.CPU.REGISTER_COUNT - 5,
    CS: VM.CPU.REGISTER_COUNT - 6,
    DS: VM.CPU.REGISTER_COUNT - 7,
    CARRY: 1,
    ACCUM: 0
};
for(var i = 0; i < VM.CPU.REGISTER_COUNT; i++) {
    REGISTERS["R" + i] = i;
}

VM.CPU.REGISTER_NAMES = {};
for(var i in REGISTERS) {
    var number = REGISTERS[i];
    if(VM.CPU.REGISTER_NAMES[number] && (i.match(/^R\d+/) || i.match(/_COUNT/))) continue;
    VM.CPU.REGISTER_NAMES[number] = i;
}

VM.CPU.REGISTERS = REGISTERS;
VM.CPU.REGISTER_PARAMS = VM.CPU.REGISTERS.STATUS;

VM.CPU.INTERRUPTS = {
    reset: 0,
    brk: 1,
    exception: 2,
    unknown_op: 3,
    divide_by_zero: 4,
    mem_fault: 5,
    mem_access: 6,
    memset_done: 7,
    memcpy_done: 8,
    user: 9,
    max: 128
};
for(var i in VM.CPU.INTERRUPTS) {
    var n = VM.CPU.INTERRUPTS[i];
    VM.CPU.INTERRUPTS[n] = i;
}
VM.CPU.INTERRUPTS.ISR_BYTE_SIZE = VM.CPU.REGISTER_SIZE * 2;
VM.CPU.INTERRUPTS.ISR_TOTAL_SIZE = VM.CPU.INTERRUPTS.max * VM.CPU.INTERRUPTS.ISR_BYTE_SIZE;

for(var i = 0; i < 256; i++) {
    VM.CPU.INTERRUPTS["irq" + i] = VM.CPU.INTERRUPTS.user + i;
}

VM.CPU.INS_BITOP_MASK = [
    [ 'x', [ 0x0F00, 8, "Register with the value to use to operate on ACCUM." ] ],
    [ 'carry_in',  [ 0xF000, 12, "Register with the value's carry in." ] ]
];
VM.CPU.INS_MOP_MASK = [
    [ 'x', [ 0x0F00, 8, "Register with the value." ] ],
    [ 'carry_in', [ 0xF000, 12, "Register with the value's carry in." ] ],
    [ 'type', [ 0x0004, 2, "Flags if the values are integers or floats." ] ],
    [ 'unsigned', [ 0x0001, 0, "Flags if the values are signed or unsigned integers." ] ]
];

function binary_op_type(ins, unsig)
{
    var i;
    if(typeof(ins) == 'number') {
        i = (ins & 0x4) >> 2;
        unsig = (ins & 0x1) || unsig;
    } else {
        i = ins.type;
        unsig = ins.unsigned || unsig;
    }
    return i == 1 ? VM.TYPES.FLOAT : (unsig ? VM.TYPES.ULONG : VM.TYPES.LONG);
}

function binary_op_inner(vm, ins, f, status_updater) {
    var type = binary_op_type(ins);
    var a = vm.regread(REGISTERS.ACCUM, type);
    var x = vm.regread(this.un.x(ins), type);
    var carry = vm.regread(this.un.carry_in(ins), type);
    if(this.un.carry_in(ins) == VM.CPU.REGISTERS.STATUS) {
        carry = carry & VM.CPU.STATUS.CARRY;
    }
    var result = f(a, x, carry);
    vm.regwrite(REGISTERS.ACCUM, result, type);
    
    vm.clear_status(VM.CPU.STATUS.NUMERICS);
    if(status_updater) {
        var new_status = status_updater(type, result, a, x, carry);
        vm.set_status(new_status);
    }
}

function binary_op(f, status_updater)
{
    return function(vm, ins) {
        return binary_op_inner.call(this, vm, ins, f, status_updater);
    };
}

function math_ops(suffix)
{
    return [
        [ "CMP" + suffix, "Compares X and Y and sets the status bits. Zero for when X and Y are equal, Negative if X < Y and they're signed integers, Carry if X < Y for unsigned integers. Both Negative and Carry get set when comparing floats. When X or Y is the INS register, zero is used for that value.",
          [ [ 'x', [ 0x0000F00, 8, "Register with the first value." ] ],
            [ 'y',  [ 0x0000F000, 12, "Register with the second value." ] ],
            [ 'type',  [ 0x4, 2, "The data type the registers contain." ] ]
          ],
          function(vm, ins) {
              var type = binary_op_type(ins);
              var a = 0;
              if(this.un.x(ins) != VM.CPU.REGISTERS.INS) {
                  a = vm.regread(this.un.x(ins), type);
              }
              var b = 0;
              if(this.un.y(ins) != VM.CPU.REGISTERS.INS) {
                  b = vm.regread(this.un.y(ins), type);
              }
              var s = vm.regread(REGISTERS.STATUS);
              if(a == b || (type == VM.TYPES.FLOAT && isNaN(a) && isNaN(b))) {
                  s = s | VM.CPU.STATUS.ZERO;
              } else {
                  s = s & ~VM.CPU.STATUS.ZERO;
              }

              if(a < b) {
                  s = s | VM.CPU.STATUS.NEGATIVE;
                  if(type == VM.TYPES.FLOAT) {
                      s = s | VM.CPU.STATUS.CARRY;
                  }                      
              } else {
                  s = s & ~VM.CPU.STATUS.NEGATIVE;
                  if(type == VM.TYPES.FLOAT) {
                      s = s & ~VM.CPU.STATUS.CARRY;
                  }                      
              }

              if(type == VM.TYPES.ULONG || type == VM.TYPES.LONG) {
                  var signed_a = 0;
                  if(this.un.x(ins) != VM.CPU.REGISTERS.INS) {
                      signed_a = vm.regread(this.un.x(ins), VM.TYPES.ULONG);
                  }
                  var signed_b = 0;
                  if(this.un.y(ins) != VM.CPU.REGISTERS.INS) {
                      signed_b = vm.regread(this.un.y(ins), VM.TYPES.ULONG);
                  }

                  if(signed_a < signed_b) {
                      s = s | VM.CPU.STATUS.CARRY;
                  } else {
                      s = s & ~VM.CPU.STATUS.CARRY;
                  }
              } else if(type == VM.TYPES.FLOAT) {
                  if(isNaN(a) || isNaN(b)) {
                      s = s | VM.CPU.STATUS.ERROR;
                  } else {
                      s = s & ~VM.CPU.STATUS.ERROR;
                  }
              }

			  vm.regwrite(REGISTERS.STATUS, s);
          },
          [
              // unsigned
              function(vm, ins) {
                  if(ins != VM.CPU.INS.CMPI) return;
                  
	              // cmp: equal
	              vm.regwrite(2, 123);
	              vm.regwrite(1, 123);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO, 'sets the zero status flag');

                  // cmp: less than
	              vm.reset();
	              vm.regwrite(2, 123);
	              vm.regwrite(1, 12);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY, 'sets the carry status flag');

                  // cmp: greater than
	              vm.reset();
	              vm.regwrite(1, 123);
	              vm.regwrite(2, 12);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.equal(vm.regread(REGISTERS.STATUS) & (VM.CPU.STATUS.CARRY|VM.CPU.STATUS.ZERO), 0, 'sets no flags');

                  // cmp: int & INS
	              vm.reset();
	              vm.regwrite(1, 0);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: VM.CPU.REGISTERS.INS}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO, 'sets zero flag since 0 == 0');

	              vm.reset();
	              vm.regwrite(1, 0);
	              vm.memwrite(0, vm.encode({op: ins, x: VM.CPU.REGISTERS.INS, y: 1}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO, 'sets zero flag since 0 == 0');
              },
              // signed
              function(vm, ins) {
                  if(ins != VM.CPU.INS.CMPI) return;
                  
	              // cmp: equal
	              vm.regwrite(2, -123);
	              vm.regwrite(1, -123);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO, 'sets the zero status flag');

                  // cmp: less than
	              vm.reset();
	              vm.regwrite(1, -123);
	              vm.regwrite(2, 12);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE, 'sets the negative status flag');

                  // cmp: greater than
	              vm.reset();
	              vm.regwrite(1, 123);
	              vm.regwrite(2, -12);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.equal(vm.regread(REGISTERS.STATUS) & (VM.CPU.STATUS.NEGATIVE|VM.CPU.STATUS.ZERO), 0, 'sets no status flag');
              },
              // floats
              function(vm, ins) {
                  if(ins != VM.CPU.INS.CMPF) return;
                  
	              // cmp: equal
	              vm.regwritef(2, 123.45);
	              vm.regwritef(1, 123.45);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO, 'sets the zero status flag');

                  // cmp: less than
	              vm.reset();
	              vm.regwrite(2, 123.45);
	              vm.regwrite(1, 12.45);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert(vm.regread(REGISTERS.STATUS) & (VM.CPU.STATUS.NEGATIVE|VM.CPU.STATUS.CARRY), 'sets the negative and carry status flags');

                  // cmp: greater than
	              vm.reset();
	              vm.regwrite(2, 12.45);
	              vm.regwrite(1, 123.45);
	              vm.memwrite(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.equal(vm.regread(REGISTERS.STATUS), 0, 'clears the flags');

	              // cmp: not equal
	              vm.regwritef(2, 123.34);
	              vm.regwritef(1, 123.44);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.equal((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO), 0, 'does not set the zero status flag');

	              // cmp: NaN
	              vm.regwritef(2, 123.34);
	              vm.regwritef(1, NaN);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR), 'sets the error status flag');

	              vm.regwritef(1, 123.34);
	              vm.regwritef(2, NaN);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR), 'sets the error status flag');

	              vm.regwritef(1, NaN);
	              vm.regwritef(2, NaN);
	              vm.memwritel(0, vm.encode({op: ins, x: 1, y: 2}));
	              vm.regwrite(REGISTERS.IP, 0);
	              vm.step();
	              assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR), 'sets the error status flag');
	              assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO), 'sets the zero status flag');
              }
          ]
        ],
        [ "ADD" + suffix, "Adds X and Y storing the result in ACCUM.",
          VM.CPU.INS_MOP_MASK,
          binary_op(function(a, b, c) { return c + a + b; }, function(type, result, x, y, c) {
              //var status = vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY;
              var status = 0;
              
              if(type != VM.TYPES.FLOAT) {
                  // See: http://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt
                  // and: https://brodowsky.it-sky.net/2015/04/02/how-to-recover-the-carry-bit/
                  var highbit = 1<<(VM.CPU.REGISTER_SIZE*8-1);
                  if(((result & highbit) != 0 && (x & highbit) == (y & highbit))
                     || ((result & highbit) == 0 && (x & highbit) != (y & highbit))) {
                      status = status | VM.CPU.STATUS.CARRY;
                  }

                  if(((x & highbit) == 0 && (y & highbit) == 0 && (result & highbit) != 0)
                     || ((x & highbit) != 0 && (y & highbit) != 0 && (result & highbit) == 0)) {
                      status = status | VM.CPU.STATUS.ERROR;
                  }
              } else {
                  if(Math.abs(result) == Infinity) {
                      status = status | VM.CPU.STATUS.ERROR;
                  }
              }

              if(result < 0) {
                  status = status | VM.CPU.STATUS.NEGATIVE;
              }
              
              if(result == 0) {
                  status = status | VM.CPU.STATUS.ZERO;
              }

              return status;
          }),
          [
              function(vm, ins) {
                  if(ins != VM.CPU.INS.ADDI) return;

                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg, carry_in: VM.CPU.REGISTERS.STATUS}));
                      vm.regwrite(reg, 0x3);
                      vm.regwrite(REGISTERS.ACCUM, 0x2);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == 0x5, "R0 has 2+3 stored in it " + vm.regread(REGISTERS.ACCUM) + " " + reg);
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");

                      // unsigned carry
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg, carry_in: VM.CPU.REGISTERS.STATUS}));
                      vm.regwrite(reg, 0x2);
                      vm.regwrite(REGISTERS.ACCUM, 0xFFFFFFFF);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == 0x1, "R0 is incremented by 2 " + vm.regread(REGISTERS.ACCUM));
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY, "sets the carry bit");

                      // signed overflow
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg, carry_in: VM.CPU.REGISTERS.STATUS}));
                      vm.regwrite(reg, -0x7FFFFFFF);
                      vm.regwrite(REGISTERS.ACCUM, -0x7FFFFFFF);
                      vm.step();
                      assert.equal(vm.regread(REGISTERS.ACCUM, VM.TYPES.LONG), 2, "R0 is incremented by -0x7FFFFFFF " + vm.regread(REGISTERS.ACCUM, VM.TYPES.LONG).toString(16));
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
                      //assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY, "sets the carry bit");

                      // signed carry
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg, carry_in: VM.CPU.REGISTERS.STATUS}));
                      vm.regwrite(reg, 0x4);
                      vm.regwrite(REGISTERS.ACCUM, 0x7FFFFFFF);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, VM.TYPES.LONG) == -(0x7FFFFFFF - 2), "R0 is incremented by 4 " + vm.regread(REGISTERS.ACCUM, VM.TYPES.LONG));
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
                      //assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY, "sets the carry bit");
                  }
              },
              function(vm, ins) {
                  if(ins != VM.CPU.INS.ADDF) return;
                  
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      // floats
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg, carry_in: VM.CPU.REGISTERS.STATUS}));
                      vm.regwrite(REGISTERS.ACCUM, 2.2, VM.TYPE_IDS.FLOAT);
                      vm.regwrite(reg, 3.3, VM.TYPE_IDS.FLOAT);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, VM.TYPE_IDS.FLOAT) == 5.5, "R0 has 2.2+3.3 stored in it " + vm.regreadf(reg));
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
                  }
              }              
          ]
        ],
        [ "MUL" + suffix, "Multiplies X and Y storing the result into ACCUM.",
          VM.CPU.INS_MOP_MASK,
          binary_op(function(a, b) { return a * b; }, function(type, result, x, y, carry) {
              var status = 0;

              if(result > type.max) {
                  status = status | VM.CPU.STATUS.ERROR;
              } else if(result < type.min) {
                  status = status | VM.CPU.STATUS.ERROR | VM.CPU.STATUS.NEGATIVE;
              }
              return status;
          }),
          [
              function(vm, ins) {
                  if(ins != VM.CPU.INS.MULI) return;

                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x2);
                      vm.regwrite(reg, 0x3);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == 6, "R0 has 2*3 stored in it " + vm.regread(REGISTERS.ACCUM));
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x80000000);
                      vm.regwrite(reg, 0x2);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == 0x0, "R0 is multiplied by 2 and overflown: " + vm.regread(REGISTERS.ACCUM));
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
                  }
              },
              function(vm, ins) {
                  if(ins != VM.CPU.INS.MULF) return;

                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwritef(REGISTERS.ACCUM, 2.2);
                      vm.regwritef(reg, 3.3);
                      vm.step();
                      assert.assert(Math.abs(vm.regreadf(REGISTERS.ACCUM) - 2.2*3.3) < 0.0001, "R0 has 2.2*3.3 stored in it");
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwritef(REGISTERS.ACCUM, VM.TYPES.FLOAT.max);
                      vm.regwritef(reg, VM.TYPES.FLOAT.max);
                      vm.step();
                      assert.assert(vm.regreadf(REGISTERS.ACCUM) == Infinity, "R0 is multiplied by itself and overflown to infinity: " + vm.regread(REGISTERS.ACCUM));
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
                  }
              }              
          ]
        ],
        [],
        [ "POW" + suffix, "Exponentiate X by Y.",
          VM.CPU.INS_MOP_MASK,
          binary_op(function(a, b) { return Math.pow(a, b); }, function(type, result, x, y, carry) {
              var status = 0;
              if(result > type.max || result < type.min) {
                  status = status | VM.CPU.STATUS.ERROR;
              }
              return status;
          }),
          function(vm, ins) {
              var type = binary_op_type(ins);
              
              for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, x: reg}));
                  vm.regwrite(REGISTERS.ACCUM, 0x2, type);
                  vm.regwrite(reg, 0x3, type);
                  vm.step();
                  assert.assert(vm.regread(REGISTERS.ACCUM, type) == 8, "R0 has 2**3 stored in it " + vm.regread(REGISTERS.ACCUM, type));
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");

                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, x: reg}));
                  vm.regwrite(REGISTERS.ACCUM, 0x8000000, type);
                  vm.regwrite(reg, 0x2, type);
                  vm.step();
                  if(type == VM.TYPES.LONG || type == VM.TYPES.ULONG) {
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == Math.pow(0x8000000, 2) % (0xFFFFFFFF + 1), "R0 is squared and overflown " + vm.regread(REGISTERS.ACCUM, type));
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
                  } else if(type == VM.TYPES.FLOAT) {
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == Math.pow(0x8000000, 2), "R0 is squared " + vm.regread(REGISTERS.ACCUM, type));
                  }
              }
          }
        ],
        [ "FFS" + suffix, "Finds the first one in X.",
          VM.CPU.INS_MOP_MASK,
          function(vm, ins) {
              var type = binary_op_type(ins);
              var b = vm.regread(this.un.x(ins), VM.TYPES.ULONG);

              if(type == VM.TYPES.FLOAT) {
                  vm.interrupt(VM.CPU.INTERRUPTS.unknown_op);
              } else {
                  if(b == 0) {
                      vm.regwrite(REGISTERS.ACCUM, 32, type);
                  } else {
                      // See https://en.wikipedia.org/wiki/Find_first_set
                      var n = 0;
                      if((b & 0xFFFF0000) == 0) {
                          n += 16;
                          b = b << 16;
                      }
                      if((b & 0xFF000000) == 0) {
                          n += 8;
                          b = b << 8;
                      }
                      if((b & 0xF0000000) == 0) {
                          n += 4;
                          b = b << 4;
                      }
                      if((b & 0xC0000000) == 0) {
                          n += 2;
                          b = b << 2;
                      }
                      if((b & 0x80000000) == 0) {
                          n += 1;
                      }

                      vm.regwrite(REGISTERS.ACCUM, n, VM.TYPES.ULONG);
                  }
              }
          },
          function(vm, ins) {
              var type = binary_op_type(ins);
              
              // causes an unknown op interrupt for floats
              if(type == VM.TYPES.FLOAT) {
                  assert.equal(vm._pending_interrupts.length, 0, 'has a no pending interrupt');
                  vm._pending_interrupts = [];
                  vm.keep_running = true; // step() doesn't enable this like run()
	              vm.memwritel(0, vm.encode({op: ins, x: 1}));
	              vm.memwritel(VM.CPU.REGISTER_SIZE, vm.encode({op: VM.CPU.INS.NOP}));
	              vm.regwrite(REGISTERS.IP, 0);
                  vm.regwrite(REGISTERS.SP, 0x10);
                  vm.regwrite(REGISTERS.ISR, 0x100);
                  vm.enable_interrupts();
	              vm.step();
	              vm.step();

                  assert.assert(vm.regread(REGISTERS.SP) == 0x10 - 8, 'pushed IP: ' + vm.memreadl(vm.regread(REGISTERS.SP)));
                  assert.assert(vm.regread(REGISTERS.IP) == 0x100 + VM.CPU.INTERRUPTS.unknown_op * VM.CPU.INTERRUPTS.ISR_BYTE_SIZE, 'sets IP to 0x100 + 12*ISR_BYTE_SIZE: ' + vm.regread(REGISTERS.IP).toString(16));
              } else {
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x2, type);
                      vm.regwrite(reg, 0x0, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == 32, "R0 has number of leading zeros in 0 " + vm.regread(REGISTERS.ACCUM, type));

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x2, type);
                      vm.regwrite(reg, 0x3, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == 30, "R0 has number of leading zeros in 0x3 " + vm.regread(REGISTERS.ACCUM, type));

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x2, type);
                      vm.regwrite(reg, 0x8000000, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == 4, "R0 has the number of leading zeros in 0x80000000 " + vm.regread(REGISTERS.ACCUM, type));

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x2, type);
                      vm.regwrite(reg, 0xFFFFFFFF, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == 0, "R0 has the number of leading zeros in 0xFFFFFFFF " + vm.regread(REGISTERS.ACCUM, type));
                  }
              }
          }
        ],
        [ "CEIL", "Round Y up to the nearest integer and store it in X.",
          [ [ 'src', [ 0xF00, 8 ] ],
            [ 'dest', [ 0xF000, 12  ] ]
          ],
          function(vm, ins) {
              vm.regwrite(this.un.dest(ins), Math.ceil(vm.regread(this.un.src(ins), VM.TYPES.FLOAT)), VM.TYPES.FLOAT);
          },
          function(vm, ins) {
              vm.memwritel(0, vm.encode({op: ins, src: 1, dest: 2}));
              vm.regwrite(1, 1234.56, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), 1235, 'has no decimal');

              vm.regwrite(REGISTERS.IP, 0);
              vm.regwrite(1, -1234.56, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), -1234, 'has no decimal');
          }
        ],
        [ "ROUND", "Round Y to the nearest integer and store it in X.",
          [ [ 'src', [ 0xF00, 8 ] ],
            [ 'dest', [ 0xF000, 12  ] ]
          ],
          function(vm, ins) {
              vm.regwrite(this.un.dest(ins), Math.round(vm.regread(this.un.src(ins), VM.TYPES.FLOAT)), VM.TYPES.FLOAT);
          },
          function(vm, ins) {
              vm.memwritel(0, vm.encode({op: ins, src: 1, dest: 2}));
              vm.regwrite(1, 1234.56, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), 1235, 'rounds up');

              vm.regwrite(REGISTERS.IP, 0);
              vm.regwrite(1, -1234.56, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), -1235, 'rounds negatives down');

              vm.regwrite(REGISTERS.IP, 0);
              vm.regwrite(1, -1234.36, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), -1234, 'rounds down');
          }
        ],
        [ "MOD" + suffix, "Take the modulus of X by Y.",
          VM.CPU.INS_MOP_MASK,
          function(vm, ins) {
              var denom = vm.regread(this.un.x(ins));
              var type = binary_op_type(ins);

              if(denom > 0 || type == VM.TYPES.FLOAT) {
                  binary_op_inner.call(this, vm, ins, function(a, b) { return a % b; });
                  vm.clear_status(VM.CPU.STATUS.ERROR);
              } else {
                  vm.set_status(VM.CPU.STATUS.ERROR);
              }
          },
          [
              function(vm, ins) {
                  if(ins != VM.CPU.INS.MODI) return;
                  
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x10);
                      vm.regwrite(reg, 0x3);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == 1, "R0 has 10%3 stored in it " + vm.regread(REGISTERS.ACCUM));

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x8000);
                      vm.regwrite(reg, 0x0);
                      vm.step();
                      assert.equal(vm.regread(REGISTERS.ACCUM), 0x8000, 'left R0 untouched');
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
                  }
              },
              function(vm, ins) {
                  if(ins != VM.CPU.INS.MODU) return;
                  
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x10);
                      vm.regwrite(reg, 0x3);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == 1, "R0 has 10%3 stored in it " + vm.regread(REGISTERS.ACCUM));

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x8000);
                      vm.regwrite(reg, 0x0);
                      vm.step();
                      assert.equal(vm.regread(REGISTERS.ACCUM), 0x8000, 'left R0 untouched');
                      assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");

                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0xFFFF);
                      vm.regwrite(reg, 0x4);
                      vm.step();
                      assert.equal(vm.regread(REGISTERS.ACCUM), (0xFFFF % 4), 'stores 0xFFFF % 0x4 into R0');
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
                  }
              },
              function(vm, ins) {
                  if(ins != VM.CPU.INS.MODF) return;
                  
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwritef(REGISTERS.ACCUM, 123.45);
                      vm.regwritef(reg, 3.3);
                      vm.step();
                      assert.assert(Math.abs(vm.regreadf(REGISTERS.ACCUM) - (123.45 % 3.3)) < 0.0001, "R0 has 123.45 % 3.3 stored in it " + vm.regreadf(REGISTERS.ACCUM));
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
                  }
              }              
          ]
        ],
        [ "SUB" + suffix, "Subtract X and Y storing the result into ACCUM.",
          VM.CPU.INS_MOP_MASK,
          binary_op(function(a, b) { return a - b; }, function(type, result, x, y, c) {
              //var status = vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY;
              var status = 0;
              
              if(type != VM.TYPES.FLOAT) {
                  if(result > type.max || result < type.min) {
                      status = status | VM.CPU.STATUS.CARRY;
                  }

                  // See: http://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt
                  var highbit = 1<<(VM.CPU.REGISTER_SIZE*8-1);
                  if(((x & highbit) == 0 && (y & highbit) != 0 && (result & highbit) != 0)
                     || ((x & highbit) != 0 && (y & highbit) == 0 && (result & highbit) == 0)) {
                      status = status | VM.CPU.STATUS.ERROR;
                  }
              }

              if(result < 0) {
                  status = status | VM.CPU.STATUS.NEGATIVE;
              }
              
              if(result == 0) {
                  status = status | VM.CPU.STATUS.ZERO;
              }

              return status;
          }),
          function(vm, ins) {
              for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                  // positive
                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, x: reg}));
                  vm.regwrite(REGISTERS.ACCUM, 0x5);
                  vm.regwrite(reg, 0x3);
                  vm.step();
                  assert.assert(vm.regread(REGISTERS.ACCUM) == 0x2, "R0 has 5-3 stored in it " + vm.regread(REGISTERS.ACCUM));
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) == 0, "clears the negative bit");
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO) == 0, "clears the zero bit");

                  // negative
                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, x: reg}));
                  vm.regwrite(REGISTERS.ACCUM, 0x2);
                  vm.regwrite(reg, 0x5);
                  vm.step();
                  assert.assert(toString(vm.regread(REGISTERS.ACCUM)) == toString(0xFFFFFFED), "R0 is 2 - 5 " + vm.regread(REGISTERS.ACCUM));
                  assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE, "sets the negative bit");
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO) == 0, "clears the zero bit");

                  // zero
                  vm.reset();
                  vm.regwrite(REGISTERS.IP, 0x10);
                  vm.memwritel(0x10, vm.encode({op: ins, x: reg}));
                  vm.regwrite(REGISTERS.ACCUM, 0x5);
                  vm.regwrite(reg, 0x5);
                  vm.step();
                  assert.assert(vm.regread(REGISTERS.ACCUM) == 0, "R0 is 0 " + vm.regread(REGISTERS.ACCUM));
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) == 0, "clears the negative bit");
                  assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO, "sets the zero bit");
              }
          }
        ],
        [ "DIV" + suffix, "Divide X by Y storing the result into ACCUM.",
          VM.CPU.INS_MOP_MASK,
          function(vm, ins) {
              var denom = vm.regread(this.un.x(ins));
              var type = binary_op_type(ins);
              if(denom != 0 || type == VM.TYPES.FLOAT) {
                  binary_op_inner.call(this, vm, ins, function(a, b) { return a / b; });
                  vm.clear_status(VM.CPU.STATUS.ERROR);
              } else {
                  vm.set_status(VM.CPU.STATUS.ERROR);
              }
          },
          function(vm, ins) {
              var type = binary_op_type(ins);
              
              for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, x: reg}));
                  vm.regwrite(REGISTERS.ACCUM, 10, type);
                  vm.regwrite(reg, 4, type);
                  vm.step();
                  var expecting = 2.5;
                  if(type != VM.TYPES.FLOAT) { expecting = 2; }
                  assert.assert(vm.regread(REGISTERS.ACCUM, type) == expecting, "R0 has int(10/4) stored in it " + vm.regread(REGISTERS.ACCUM, type));
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");

                  if(type != VM.TYPES.FLOAT) {
                      // overflow test
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0x8000, type);
                      vm.regwrite(reg, 0x0, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == 0x8000, 'left R0 untouched');
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) != 0, "sets the error bit");
                  } else if(type == VM.TYPES.ULONG) {
                      // unsigned test
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, 0xF000, type);
                      vm.regwrite(reg, 0x4, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == (0xF000 / 4), 'can divide unsigned numbers');
                  } else if(type == VM.TYPES.FLOAT) {
                      // negative test
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(REGISTERS.ACCUM, -10, type);
                      vm.regwrite(reg, 2, type);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM, type) == -5, 'can divide negative numbers');
                  }
              }
          }
        ],
        [ "CONV" + suffix, "Convert between floats and integers.",
          [ [ 'reg', [ 0xF00, 8 ] ],
            [ 'type_out', [ 0xF000, 12 ] ],
            [ 'type', [ 0x4, 2 ] ]
          ],
          function(vm, ins) {
              var type_out = VM.TYPES[this.un.type_out(ins)];
              var type_in = binary_op_type(ins);
              var v = vm.regread(this.un.reg(ins), type_in);
              var status = 0;
              if(v > type_out.max) {
                  status = status | VM.CPU.STATUS.ERROR;
              } else if(v < type_out.min) {
                  status = status | VM.CPU.STATUS.ERROR | VM.CPU.STATUS.NEGATIVE;
              } else {
                  vm.regwrite(this.un.reg(ins), v, type_out);
              }

              vm.set_status(status);
          },
          [
              // from integers
              // signed
              function(vm, ins) {
                  if(ins != VM.CPU.INS.CONVI) return;

                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, reg: 1, type_out: VM.TYPE_IDS.FLOAT}));
                  vm.regwrite(1, -1234);
                  vm.step();
                  assert.not_equal(vm.regread(1, VM.TYPES.ULONG), -1234, 'no longer a long');
                  assert.equal(vm.regread(1, VM.TYPES.FLOAT), -1234.0, 'converts to a float');
              },
              // unsigned
              function(vm, ins) {
                  if(ins != VM.CPU.INS.CONVU) return;

                  vm.memwritel(0, vm.encode({op: ins, reg: 1, type_out: VM.TYPE_IDS.FLOAT}));
                  vm.regwrite(1, 1234);
                  vm.step();
                  assert.not_equal(vm.regread(1, VM.TYPES.ULONG), 1234, 'no longer a ulong');
                  assert.equal(vm.regread(1, VM.TYPES.FLOAT), 1234.0, 'converts to a float');
              },
              // from floats
              function(vm, ins) {
                  if(ins != VM.CPU.INS.CONVF) return;
                  
                  // to signed
                  vm.memwriteS(0, vm.encode({op: ins, reg: 1, type_out: VM.TYPE_IDS.LONG, unsigned: 0}));
                  vm.regwritef(1, -1234.45);
                  vm.step();
                  assert.not_equal(vm.regread(1, VM.TYPES.FLOAT), -1234.45, 'no longer a float');
                  assert.equal(vm.regread(1, VM.TYPES.LONG), -1234, 'no longer a float');

                  // to unsigned
                  vm.reset();
                  vm.memwriteS(0, vm.encode({op: ins, reg: 1, type_out: VM.TYPE_IDS.ULONG, unsigned: 1}));
                  vm.regwritef(1, -1234.45);
                  vm.step();
                  assert.assert(Math.abs(vm.regread(1, VM.TYPES.FLOAT) - -1234.45) < 0.001, 'stays the same');
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) != 0, 'sets the error bit');
              },
          ]
        ],
        [ "ROOT" + suffix, "Take the X root of Y and store it in DEST.",
          VM.CPU.INS_MOP_MASK,
          binary_op(function(a, b) { return Math.pow(a, (1.0 / b)); }),
          function(vm, ins) {
              var type = binary_op_type(ins);

              for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                  vm.reset();
                  vm.memwritel(0, vm.encode({op: ins, x: reg, type: type.id}));
                  vm.regwrite(REGISTERS.ACCUM, 27, type);
                  vm.regwrite(reg, 3, type);
                  vm.step();
                  assert.assert(vm.regread(REGISTERS.ACCUM, type) == 3, "R0 has 27**(1/3) stored in it " + vm.regread(REGISTERS.ACCUM, type));
                  assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
                  // TODO: zero root
              }
          }
        ],
        [ "LOG" + suffix, "Take the base 2 logarithm of X.",
          VM.CPU.INS_MOP_MASK,
          // todo signal errors when X is <= 0
          binary_op(function(a, b) { return Math.log2(b); }),
          [
              function(vm, ins) {
                  if(ins != VM.CPU.INS.LOGI) return;
                  
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwrite(reg, 123);
                      vm.step();
                      assert.assert(vm.regread(REGISTERS.ACCUM) == Math.floor(Math.log2(123)), "R0 has Math.log2(123) stored in it " + vm.regread(REGISTERS.ACCUM));
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
                  }
              },
              function(vm, ins) {
                  if(ins != VM.CPU.INS.LOGF) return;
                  
                  // floats
                  for(var reg = 1; reg < VM.CPU.REGISTERS.GP_COUNT; reg++) {
                      vm.reset();
                      vm.memwritel(0, vm.encode({op: ins, x: reg}));
                      vm.regwritef(reg, 123.45);
                      vm.step();
                      assert.assert(Math.abs(vm.regreadf(0) - Math.log2(123.45)) < 0.001, "R0 has Math.log2(123.45) stored in it " + vm.regreadf(0));
                      assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
                  }
              }
          ]
        ],
        [ "FLOOR", "Round Y down to the nearest integer and store it in X.",
          [ [ 'src', [ 0xF00, 8 ] ],
            [ 'dest', [ 0xF000, 12  ] ]
          ],
          function(vm, ins) {
              vm.regwrite(this.un.dest(ins), Math.floor(vm.regread(this.un.src(ins), VM.TYPES.FLOAT)), VM.TYPES.FLOAT);
          },
          function(vm, ins) {
              vm.memwritel(0, vm.encode({op: ins, src: 1, dest: 2}));
              vm.regwrite(1, 1234.56, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), 1234, 'has no decimal');

              vm.regwrite(REGISTERS.IP, 0);
              vm.regwrite(1, -1234.56, VM.TYPES.FLOAT);
              vm.regwrite(2, 0x80);
              vm.step();
              assert.equal(vm.regread(2, VM.TYPES.FLOAT), -1235, 'has no decimal');
          }
        ],
        [],
        []
    ]
};

VM.CPU.INS_DEFS = [
    // 0x0
    [ [ "NOP", "Nothing operation does nothing.",
        [ [ 'comment', [ 0xFF00, 8 ] ]
        ],
        function(vm, ins) {
        },
        function(vm, ins) {
	        vm.memwrite(0, [ VM.CPU.INS.NOP, 0, 0, 0 ]);
	        vm.regwrite(REGISTERS.IP, 0);
	        vm.step();
	        assert.assert(vm.regread(REGISTERS.IP) == VM.CPU.INSTRUCTION_SIZE, 'ip advances');
        }
      ],
      [ "NOT", "Store the negated bits of Y into X.",
        [ [ 'x', [ 0x0F00, 8 ] ],
          [ 'y', [ 0xF000, 12  ]]
        ],
        function(vm, ins) {
            vm.regwrite(this.un.x(ins), ~vm.regread(this.un.y(ins)));
        },
        function(vm, ins) {
            vm.memwrite(0, [ VM.CPU.INS.NOT, 1, 0, 0, ]);
            vm.regwrite(REGISTERS.ACCUM, 0xF0F0F0F0);
            vm.regwrite(1, 0x80);
            vm.step();
            assert.assert(vm.regread(1) == 0xF0F0F0F, "R1 is negated R0: " + vm.regread(1));
        }
      ],
      [ "OR", "Place a bitwise inclusive disjunction of X and Y into DEST.",
        VM.CPU.INS_BITOP_MASK,
        function(vm, ins) {
            vm.regwrite(REGISTERS.ACCUM, vm.regread(REGISTERS.ACCUM) | vm.regread(this.un.x(ins)));
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.OR, x: 1}));
            vm.regwrite(REGISTERS.ACCUM, 0xF0F0F0F0);
            vm.regwrite(1, 0xF);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0xF0F0F0FF, "R0 is R0 OR R1: " + vm.regread(REGISTERS.ACCUM));
        }
      ],
      [ "XOR", "Place a bitwise exclusive disjunction of X and Y into DEST.",
        VM.CPU.INS_BITOP_MASK,
        function(vm, ins) {
            vm.regwrite(REGISTERS.ACCUM, vm.regread(REGISTERS.ACCUM) ^ vm.regread(this.un.x(ins)));
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.XOR, x: 1 }));
            vm.regwrite(REGISTERS.ACCUM, 0xF0F0F0F0);
            vm.regwrite(1, 0xFF);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0xF0F0F00F, "R0 is R0 XOR R1: " + vm.regread(REGISTERS.ACCUM));
        }
      ],
      [ "AND", "Place a bitwise conjunction of X and Y into DEST.",
        VM.CPU.INS_BITOP_MASK,
        function(vm, ins) {
            var value = vm.regread(REGISTERS.ACCUM) & vm.regread(this.un.x(ins));
            vm.regwrite(REGISTERS.ACCUM, value);
            var status = 0;
            if(value == 0) {
                status = status | VM.CPU.STATUS.ZERO;
            }
            if(value < 0) {
                status = status | VM.CPU.STATUS.NEGATIVE;
            }
            vm.set_status(status);
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.AND, x: 1}));
            vm.regwrite(REGISTERS.ACCUM, 0xF0F0F0F0);
            vm.regwrite(1, 0xFF);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0xF0, "R0 is R0 AND R1: " + vm.regread(REGISTERS.ACCUM));

            vm.reset();
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.AND, x: 1}));
            vm.regwrite(REGISTERS.ACCUM, 0xF0F0F000);
            vm.regwrite(1, 0xFF);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0x0, "R0 is R0 AND R1: " + vm.regread(REGISTERS.ACCUM));
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ZERO) != 0, 'updates the status bits');
        }
      ],
      [ "BSL", "Shift the bits in ACCUM left by X.",
        VM.CPU.INS_BITOP_MASK,
        function(vm, ins) {
            var shift = vm.regread(this.un.x(ins));
            if(shift > 0) {
                var x = vm.regread(REGISTERS.ACCUM);
                var result = x << shift;
                if(this.un.carry_in(ins) != VM.CPU.REGISTERS.STATUS) {
                    result = result | (vm.regread(this.un.carry_in(ins)) >> (32 - shift));
                }
                if(x & 0x80000000) {
                    vm.set_status(VM.CPU.STATUS.CARRY);
                }
                vm.regwrite(REGISTERS.ACCUM, result & 0xFFFFFFFF);
                vm.regwrite(REGISTERS.CARRY, (x >> (32 - shift)) & 0xFFFFFFFF);
            }
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.BSL, x: 1, carry_in: VM.CPU.REGISTERS.STATUS}));
            vm.regwrite(REGISTERS.ACCUM, 0x82345678);
            vm.regwrite(1, 8);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0x34567800, "R0 is R0 << R1: " + vm.regread(REGISTERS.ACCUM));
            assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY, 'sets the carry flag');

            vm.reset();
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.BSL, x: 1, carry_in: VM.CPU.REGISTERS.STATUS}));
            vm.regwrite(REGISTERS.ACCUM, 0x00345678);
            vm.regwrite(1, 8);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0x34567800, "R0 is R0 << R1: " + vm.regread(REGISTERS.ACCUM));
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY) == 0, 'does not set the carry bit');

            vm.reset();
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.BSL, x: 1, carry_in: 2}));
            vm.regwrite(REGISTERS.ACCUM, 0x12345678);
            vm.regwrite(1, 8);
            vm.regwrite(2, 0x23F0F0F0);
            vm.step();
            assert.equal(vm.regread(REGISTERS.CARRY), 0x12, "R1 has the bits shifted off");
            assert.equal(vm.regread(REGISTERS.ACCUM), 0x34567823, "R0 is R0 << R1 " + vm.regread(REGISTERS.ACCUM).toString(16));
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY) == 0, 'does not set the carry bit');
        }
      ],
      [],
      [ "INT", "Cause an interrupt.",
        [ [ 'x', [ 0xFF00, 8  ] ]
        ],
        function(vm, ins) {
            vm.interrupt(this.un.x(ins));
        },
        function(vm, ins) {
            assert.equal(vm._pending_interrupts.length, 0, 'has no pending interrupts');
            vm._pending_interrupts = [];
            vm.keep_running = true; // step() doesn't enable this like run()
	        vm.memwritel(0, vm.encode({op: VM.CPU.INS.INT, x: 12}));
	        vm.memwritel(VM.CPU.REGISTER_SIZE, vm.encode({op: VM.CPU.INS.NOP}));
	        vm.regwrite(REGISTERS.IP, 0);
            vm.regwrite(REGISTERS.SP, 0x10);
            vm.regwrite(REGISTERS.ISR, 0x100);
	        vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'has yet to set the INT_ENABLED status flag');
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG) == 0, 'has yet to set the INT_FLAG status flag');
            assert.assert(vm.memreadl(vm.regread(REGISTERS.SP)) != 4, 'has yet to push IP');
            assert.assert(vm.regread(REGISTERS.IP) == VM.CPU.INSTRUCTION_SIZE, 'has yet to change IP');

            // interrupts are disabled, so nothing happens
            vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'interrupts disabled');
            assert.equal(vm._pending_interrupts.length, 0, 'is not pending');
            assert.assert(vm.regread(REGISTERS.SP) == 0x10, 'did not push IP: ' + vm.memreadl(vm.regread(REGISTERS.SP)));

            // enable interrupts
            vm.enable_interrupts();
	        vm.regwrite(REGISTERS.IP, 0);
            vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) != 0, 'interrupts enabled');
            assert.equal(vm._pending_interrupts.length, 1, 'is pending');

            vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'disables interrupts');
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG) != 0, 'sets interrupt flag');
            assert.assert(vm.regread(REGISTERS.SP) == 0x10 - 8, 'pushed IP: ' + vm.memreadl(vm.regread(REGISTERS.SP)));
            assert.assert(vm.regread(REGISTERS.IP) == 0x100 + 12 * VM.CPU.INTERRUPTS.ISR_BYTE_SIZE, 'sets IP to 0x100 + 12*ISR_BYTE_SIZE: ' + vm.regread(REGISTERS.IP).toString(16));
            assert.equal(vm._pending_interrupts.length, 0, 'is no longer pending');
        }
      ],
      [ "HALT", "Halts the CPU.", [],
        function(vm, ins) {
            vm.halted = true;
            return true;
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: ins}));
            assert.equal(vm.step(), false, 'causes step to return false');
        }
      ],
      [ "NEG", "Convert REG's value to a negative and store it in ACCUM taking TYPE into account.",
        { reg: [ 0x00000F00, 8 ],
          type: [ 0xF000, 12 ]
        },
        function(vm, ins) {
            vm.regwrite(VM.CPU.REGISTERS.ACCUM, -vm.regread(this.un.reg(ins), this.un.type(ins)), this.un.type(ins));
        },
        [
            function(vm, ins) {
                // integer value
                vm.memwritel(0, vm.encode({op: ins, reg: 3, type: 0 }));
                vm.regwrite(3, 0xF0F0F0F0);
                vm.regwrite(0, 0x80);
                vm.step();
                assert.assert(vm.regread(REGISTERS.ACCUM) == (0xFFFFFFFF - 0xF0F0F0F0 + 1), "ACCUM is negative R3: " + vm.regread(REGISTERS.ACCUM).toString(16));
            },
            function(vm, ins) {
                // float
                vm.memwritel(0, vm.encode({op: ins, type: VM.TYPE_IDS.FLOAT, reg: 2 }));
                vm.regwritef(2, 123.45);
                vm.regwrite(0, 0x80);
                vm.step();
                assert.assert(Math.abs(vm.regreadf(REGISTERS.ACCUM) + 123.45) < 0.001, "ACCUM is negative R3: " + vm.regreadf(REGISTERS.ACCUM));
            }
        ]
      ],
      [],
      [],
      [ "RTI", "Pop STATUS and IP returning from an interrupt.", {},
        function(vm, ins) {
            var sleeping = (vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP) != 0;
            vm.pop(REGISTERS.STATUS);
            var was_sleeping = (vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP) != 0;
            if(!sleeping && was_sleeping) {
                vm.clear_status(VM.CPU.STATUS.SLEEP);
            }
            vm.pop(REGISTERS.IP);

          return sleeping;
        },
        [
            function(vm, ins) {
                vm.memwritel(0, vm.encode({op: ins}));
                vm.regwrite(REGISTERS.SP, 0x100);
                vm.push_value(0x30);
                vm.push_value(VM.CPU.STATUS.NEGATIVE);
                vm.step();

                assert.equal(vm.regread(REGISTERS.SP), 0x100, 'popped values from the stack');
                assert.equal(vm.regread(REGISTERS.STATUS), VM.CPU.STATUS.NEGATIVE, 'sets STATUS to the first value on the stack');
                assert.equal(vm.regread(REGISTERS.IP), 0x30, 'sets IP to second value on the stack');

                // stays in sleep
                vm.set_status(VM.CPU.STATUS.SLEEP);
                vm.regwrite(REGISTERS.IP, 0);
                vm.push_value(0x30);
                vm.push_value(VM.CPU.STATUS.NEGATIVE|VM.CPU.STATUS.SLEEP);
                vm.step();
                assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP, 'stays sleeping');
            },
            function(vm, ins) {
                // while sleeping, toggling the sleep status causes the new value to stick after RTI
                vm.clear_status(VM.CPU.STATUS.INT_ENABLED);
                vm.set_status(VM.CPU.STATUS.SLEEP|VM.CPU.STATUS.INT_FLAG);
                vm.memwritel(0, vm.encode({op: VM.CPU.INS.LOAD, dest: VM.CPU.REGISTERS.R0 }));
                vm.memwriteL(VM.CPU.INSTRUCTION_SIZE, 0);
                vm.memwriteL(VM.CPU.INSTRUCTION_SIZE + VM.TYPES.ULONG.byte_size, vm.encode({op: VM.CPU.INS.MOVE, src: VM.CPU.REGISTERS.R0, dest: VM.CPU.REGISTERS.STATUS}));
                vm.memwritel(VM.CPU.INSTRUCTION_SIZE * 2 + VM.TYPES.ULONG.byte_size, vm.encode({op: ins}));
                vm.regwrite(REGISTERS.SP, 0x100);
                vm.push_value(0x30);
                vm.push_value(VM.CPU.STATUS.NEGATIVE|VM.CPU.STATUS.INT_ENABLED);
                vm.step();
                vm.step();
                vm.step();

                assert.equal(vm.regread(REGISTERS.SP), 0x100, 'popped values from the stack');
                assert.equal(vm.regread(REGISTERS.IP), 0x30, 'sets IP to second value on the stack');
                assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEEP) == 0, 'keeps sleep bit clear');
                assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) != 0, 'kept other bits');
                assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) != 0, 'kept other bits');
                assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG) == 0, 'clears interrupt flag');
            }
        ]
      ],
      [ "BSR", "Shift the bits in ACCUM right by X.",
        VM.CPU.INS_BITOP_MASK,
        function(vm, ins) {
            var shift = vm.regread(this.un.x(ins));
            if(shift > 0) {
                var x = vm.regread(REGISTERS.ACCUM);
                var result = x >>> shift;
                if(this.un.carry_in(ins) != VM.CPU.REGISTERS.STATUS) {
                    result = result | (vm.regread(this.un.carry_in(ins)) & ((1<<shift) - 1)) << (32 - shift);
                }
                vm.regwrite(REGISTERS.ACCUM, result & 0xFFFFFFFF);
                vm.regwrite(REGISTERS.CARRY, x & ((1<<shift) - 1));
            }
        },
        function(vm) {
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.BSR, x: 1, carry_in: VM.CPU.REGISTERS.STATUS }));
            vm.regwrite(REGISTERS.ACCUM, 0x12345678);
            vm.regwrite(1, 8);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0x00123456, "R0 is R0 >> R1: " + vm.regread(REGISTERS.ACCUM));
            assert.equal(vm.regread(REGISTERS.CARRY), 0x78, 'carries out the bits');

            vm.reset();
            vm.memwritel(0, vm.encode({op: VM.CPU.INS.BSR, x: 1, carry_in: 2 }));
            vm.regwrite(REGISTERS.ACCUM, 0x12345678);
            vm.regwrite(1, 8);
            vm.regwrite(2, 0xFEDCBA);
            vm.step();
            assert.assert(vm.regread(REGISTERS.ACCUM) == 0xBA123456, "R0 is R0 >> R1: " + vm.regread(REGISTERS.ACCUM).toString(16));
            assert.equal(vm.regread(REGISTERS.CARRY), 0x78, 'carries out the bits');
        }
      ],
      [ "CLS", "Clear the status register's compare bits.",
        [ [ 'bits', [ 0xFF00, 8 ] ] ],
        function(vm, ins) {
            vm.clear_status(this.un.bits(ins));
        },
        function(vm, ins) {
            vm.set_status(VM.CPU.STATUS.CARRY | VM.CPU.STATUS.NEGATIVE);
            vm.memwritel(0, vm.encode({op: ins, bits: VM.CPU.STATUS.CARRY}));
            vm.step();
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY) == 0, 'clears the bit');
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) != 0, 'leaves the bit');

            vm.reset();
            vm.set_status(VM.CPU.STATUS.INT_ENABLED|VM.CPU.STATUS.SLEEP);
            vm.memwritel(0, vm.encode({op: ins, bits: VM.CPU.STATUS.SLEEP}));
            vm.step();
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP) == 0, 'clears the sleep bit');
        }
      ],
      [ "INTR", "Cause an interrupt with the register providing the interrupt number.",
        [ [ 'x', [ 0x0F00, 8  ] ]
        ],
        function(vm, ins) {
            vm.interrupt(vm.regread(this.un.x(ins)));
        },
        function(vm, ins) {
            assert.equal(vm._pending_interrupts.length, 0, 'has no pending interrupts');
            vm._pending_interrupts = [];
            vm.keep_running = true; // step() doesn't enable this like run()
	        vm.memwritel(0, vm.encode({op: VM.CPU.INS.INTR, x: 3}));
	        vm.memwritel(VM.CPU.REGISTER_SIZE, vm.encode({op: VM.CPU.INS.NOP}));
            vm.regwrite(3, 12);
	        vm.regwrite(REGISTERS.IP, 0);
            vm.regwrite(REGISTERS.SP, 0x10);
            vm.regwrite(REGISTERS.ISR, 0x100);
	        vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'has yet to set the INT_ENABLED status flag');
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG) == 0, 'has yet to set the INT_FLAG status flag');
            assert.assert(vm.memreadl(vm.regread(REGISTERS.SP)) != 4, 'has yet to push IP');
            assert.assert(vm.regread(REGISTERS.IP) == VM.CPU.INSTRUCTION_SIZE, 'has yet to change IP');

            // interrupts are disabled, so nothing happens
            vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'interrupts disabled');
            assert.equal(vm._pending_interrupts.length, 0, 'is not pending');
            assert.assert(vm.regread(REGISTERS.SP) == 0x10, 'did not push IP: ' + vm.memreadl(vm.regread(REGISTERS.SP)));

            // enable interrupts
            vm.enable_interrupts();
	        vm.regwrite(REGISTERS.IP, 0);
            vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) != 0, 'interrupts enabled');
            assert.equal(vm._pending_interrupts.length, 1, 'is pending');

            vm.step();
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'disables interrupts');
	        assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG) != 0, 'sets the interrupt flag');
            assert.assert(vm.regread(REGISTERS.SP) == 0x10 - 8, 'pushed IP: ' + vm.memreadl(vm.regread(REGISTERS.SP)));
            assert.assert(vm.regread(REGISTERS.IP) == 0x100 + 12 * VM.CPU.INTERRUPTS.ISR_BYTE_SIZE, 'sets IP to 0x100 + 12*ISR_BYTE_SIZE: ' + vm.regread(REGISTERS.IP).toString(16));
            assert.equal(vm._pending_interrupts.length, 0, 'is no longer pending');
        }
      ]
    ],
    // 0x1
    [ "INC", "Increment X by OFFSET which is the 32 bits following the instruction. OFFSET is treated as a literal value (kind=0), relative address (kind=3), or an indirect relative address (kind=6). IP is advanced past OFFSET.",
      [ [ 'x', [ 0xf0, 4 ] ],
        [ 'condition', [ 0xF00, 8 ] ],
        [ 'kind', [ 0xF000, 12  ]],
        [ 'data', VM.TYPES.ULONG ]
      ],
      function(vm, ins) {
          var ip = vm.regread(REGISTERS.IP);
          
          if(vm.check_condition(this.un.condition(ins))) {
              var y = vm.memreadl(ip);
              
              if(this.un.kind(ins) != 0 && this.un.kind(ins) != 7) {
                  y = vm.memreadl(vm.regread(REGISTERS.IP) + y);
              }
              if(this.un.kind(ins) == 6) {
                  y = vm.memreadl(y);
              }

              var result = vm.regread(this.un.x(ins)) + y;
              vm.regwrite(this.un.x(ins), result);

              if(result > 0xFFFFFFFF) {
                  vm.set_status(VM.CPU.STATUS.ERROR);
                  vm.set_status(VM.CPU.STATUS.CARRY);
              } else {
                  vm.clear_status(VM.CPU.STATUS.ERROR);
                  vm.clear_status(VM.CPU.STATUS.CARRY);
              }
              
              if(this.un.x(ins) != VM.CPU.REGISTERS.IP) {
                  vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
              }
          } else {
              vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
          }
      },
      function(vm, ins) {
          var reg = (ins & 0xF0) >> 4;
          if(reg >= VM.CPU.REGISTER_PARAMS) {
              return;
          }

          // no condition, literal offset
          vm.memwritel(0, vm.encode({ op: ins }));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.step();
          assert.assert(vm.regread(reg) == 0x1234567A, "R" + reg + " is incremented by 2 " + vm.regread(reg));
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY) == 0, "clears the carry bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP by a REGISTER_SIZE');

          // no condition, overflows
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 2);
          vm.regwrite(reg, 0xFFFFFFFF);
          vm.step();
          assert.assert(vm.regread(reg) == 0x1, "R" + reg + " is incremented by 2 " + vm.regread(reg));
          assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR, "sets the error bit");
          assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY, "sets the carry bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP by a REGISTER_SIZE');

          // no condition, offset type
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 3}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80 - VM.CPU.INSTRUCTION_SIZE);
          vm.memwritel(0x80, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) == 0x1234567A, "R" + reg + " is incremented by 2 " + vm.regread(reg));
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY) == 0, "clears the carry bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP by a REGISTER_SIZE');

          // no condition, indirect offset type
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 6}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80 - VM.CPU.INSTRUCTION_SIZE);
          vm.memwritel(0x80, 0x70);
          vm.memwritel(0x70, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) == 0x1234567A, "R" + reg + " is incremented by 2 " + vm.regread(reg));
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.ERROR) == 0, "clears the error bit");
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.CARRY) == 0, "clears the carry bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP by a REGISTER_SIZE');

          // condition, offset type
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 3, condition: VM.CPU.STATUS.NEGATIVE}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80 - VM.CPU.INSTRUCTION_SIZE);
          vm.clear_status(VM.CPU.STATUS.OVERFLOW|VM.CPU.STATUS.NEGATIVE);
          vm.memwritel(0x80, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) != 0x1234567A, "R" + reg + " is not incremented by 2 " + vm.regread(reg));
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP by a REGISTER_SIZE');

          vm.set_status(VM.CPU.STATUS.NEGATIVE);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.equal(vm.regread(reg), 0x1234567A, "R" + reg + " is incremented by 2 ");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP by a REGISTER_SIZE');
      }
    ],
    // 0x2
    math_ops('I'),
    // 0x3
    math_ops('U'),
    // 0x4
    math_ops('F'),
    // 0x5
    [ "LOAD", "Load the whole register DEST with data from memory at the address found in REG + OFFSET, the following " + VM.CPU.REGISTER_SIZE + " bytes. If REG is STATUS then OFFSET is used directly. When REG is INS, then the value is used as is. Except when IP is loaded, IP is always advanced past the OFFSET.",
      [ [ 'dest', [ 0xF0, 4 ] ],
        [ 'condition', [ 0xF00, 8 ] ],
        [ 'reg', [ 0xF000, 12 ] ],
        [ 'data', VM.TYPES.ULONG ]
      ],
      function(vm, ins) {
          let ip = vm.regread(REGISTERS.IP);
          if(vm.check_condition(this.un.condition(ins))) {
              let offset = 0;
              if(this.un.reg(ins) != VM.CPU.REGISTERS.STATUS && this.un.reg(ins) != VM.CPU.REGISTERS.INS) {
                  offset = vm.regread(this.un.reg(ins));
                  offset += vm.memreadl(ip);
              } else {
                  offset += vm.memreadL(ip);
              }
              
              let value = 0;
              if(this.un.reg(ins) == VM.CPU.REGISTERS.INS) {
                  value = offset;
              } else {
                  value = vm.memreadL(offset);
              }
			  vm.regwrite(this.un.dest(ins), value);

              if(this.un.dest(ins) != VM.CPU.REGISTERS.IP) {
                  vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
              }
          } else {
              vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
          }
      },
      [
          function(vm, ins) {
              var reg = (ins & 0xF0) >> 4;
	          vm.memwritel(0, vm.encode({op: ins, reg: 2}));
              vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x30);
	          vm.memwrite(0x80, [ 0x44, 0x22 ]);
	          vm.regwrite(reg, 999);
              vm.regwrite(2, 0x50);
	          vm.regwrite(REGISTERS.IP, 0);
	          vm.step();
	          assert.assert(vm.regread(reg) == 0x2244, 'loads a value from memory into the register');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
          },
          function(vm, ins) {
              // to the status register
              var reg = (ins & 0xF0) >> 4;
	          vm.memwriteS(0, vm.encode({op: ins, reg: VM.CPU.REGISTERS.STATUS}));
              vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x30);
	          vm.memwrite(0x80, [ 0x44, 0x22, 0, 0 ]);
	          vm.memwrite(0x30, [ 0x88, 0x99, 0, 0 ]);
	          vm.regwrite(reg, 999);
              vm.regwrite(2, 0x50);
	          vm.regwrite(REGISTERS.IP, 0);
	          vm.step();
	          assert.equal(vm.regread(reg), 0x9988, 'loads into the register a value from memory with offseting from the status register');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
          },
          function(vm, ins) {
              // to the INS register
              var reg = (ins & 0xF0) >> 4;
	          vm.memwritel(0, vm.encode({op: ins, reg: VM.CPU.REGISTERS.INS}));
              vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x30);
	          vm.memwrite(0x80, [ 0x44, 0x22 ]);
	          vm.memwrite(0x30, [ 0x88, 0x99 ]);
	          vm.regwrite(reg, 999);
              vm.regwrite(2, 0x50);
	          vm.regwrite(REGISTERS.IP, 0);
	          vm.step();
	          assert.assert(vm.regread(reg) == 0x30, 'loads into the register the value');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
          },
          function(vm, ins) {
              // with a condition
              var reg = (ins & 0xF0) >> 4;
	          vm.memwritel(0, vm.encode({op: ins, condition: VM.CPU.STATUS.NEGATIVE, reg: 2}));
              vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x30);
	          vm.memwrite(0x80, [ 0x44, 0x22 ]);
              vm.clear_status(VM.CPU.STATUS.NEGATIVE);
	          vm.regwrite(reg, 999);
              vm.regwrite(2, 0x50);
	          vm.regwrite(REGISTERS.IP, 0);
	          vm.step();
	          assert.assert(vm.regread(reg) != 0x2244, 'does not load a value from memory into the register');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

              vm.regwrite(REGISTERS.IP, 0);
              vm.set_status(VM.CPU.STATUS.NEGATIVE);
              vm.step();
	          assert.assert(vm.regread(reg) == 0x2244, 'loads a value from memory into the register');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
          }
      ]
    ],
    // 0x6
    [ "POP", "Pop a value from the stack into the register.",
      [ [ 'dest', [ 0xF0, 4 ] ] ],
      function(vm, ins) {
          vm.pop(this.un.dest(ins));
      },
      function(vm, ins) {
          var reg = (ins & 0xF0) >> 4;
          vm.regwrite(0, 0x1234);
          vm.regwrite(REGISTERS.SP, vm.stack_start - 1);
	      vm.memwritel(0, vm.encode({op: VM.CPU.INS.PUSH, src: 0}));
	      vm.memwritel(VM.CPU.INSTRUCTION_SIZE, vm.encode({op: ins, dest: reg}));
	      vm.regwrite(REGISTERS.IP, 0);
	      vm.step();
          vm.regwrite(0, 0);
	      vm.step();
          if(reg == VM.CPU.REGISTERS.SP) {
	          assert.assert(vm.regread(reg) == 0x1234, 'stores the values from memory to R' + reg + ' ' + vm.regread(reg).toString(16));
          } else {
	          assert.equal(vm.regread(REGISTERS.SP), vm.stack_start - 1, "increments the stack pointer");
	          assert.equal(vm.regread(reg), 0x1234, 'stores the values from memory to R' + reg + ' ' + vm.regread(reg).toString(16));
          }
      }            
    ],
    // 0x7
    [ [ "CIE", "Clear interrupt enable bit.",
        {},
        function(vm, ins) {
            vm.disable_interrupts();
        },
        function(vm, ins) {
            vm.enable_interrupts();
            vm.memwritel(0, vm.encode({op: ins}));
            vm.step();
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) == 0, 'clears the interrupt enable bit');
        }
      ],
      [ "RESET", "Reinitialize the CPU.",
        {},
        function(vm, ins) {
            vm.reset();
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: ins}));
            vm.set_status(VM.CPU.STATUS.ERROR);
            vm.step();

            assert.equal(vm.regread(REGISTERS.STATUS), 0, 'clears the status register');
            for(var i = 0; i < VM.CPU.REGISTERS.GP_COUNT; i++) {
                assert.equal(vm.regread(i), 0, 'clears register ' + i);
            }
        }
      ],
      [ "BRK", "Cause a Break interrupt.", {},
        function(vm, ins) {
            vm.interrupt(VM.CPU.INTERRUPTS.brk);
        },
        [
            // interrupts disabled
            function(vm, ins) {
                vm.keep_running = true;
                vm.memwritel(0, vm.encode({op: ins}));
                vm.regwrite(REGISTERS.ISR, 0x100);
                vm.step();
                assert.equal(vm.interrupts_pending(), 0, 'does not queue an interrupt');
            },
            // interrupts enabled
            function(vm, ins) {
                var isr_addr = 0x100 + (VM.CPU.INTERRUPTS.brk * VM.CPU.INTERRUPTS.ISR_BYTE_SIZE);
                vm.keep_running = false;
                vm._pending_interrupts = [];
                vm.memwritel(0, vm.encode({op: ins}));
                vm.memwritel(isr_addr, vm.encode({op: VM.CPU.INS.HALT}));
                vm.enable_interrupts();
                vm.regwrite(REGISTERS.ISR, 0x100);
                vm.step();
                assert.equal(vm.interrupts_pending(), 1, 'queues the interrupt');
                vm.step();
                assert.equal(vm.interrupts_pending(), 0, 'processed the interrupt');
                assert.equal(vm.regread(REGISTERS.IP), isr_addr, 'jumps to the break interrupt');
            }
        ]
      ],
      [],
      [],
      [],
      [ "MEMSET", "Sets count bytes from the address in X to the value in Y." ],
      [ "CALL", "Push IP + " + VM.CPU.REGISTER_SIZE + ", and then set IP to the OFFSET following the instruction. When REG is not STATUS or INS, that register's value is added to OFFSET.",
        [ [ 'condition', [ 0xF00, 8 ] ],
          [ 'reg', [ 0xF000, 12 ] ],
          [ 'data', VM.TYPES.ULONG ]
        ],
        function(vm, ins) {
            let ip = vm.regread(REGISTERS.IP);
            vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
            
            if(vm.check_condition(this.un.condition(ins))) {
                let offset = vm.memreadl(ip);
                if(this.un.reg(ins) != VM.CPU.REGISTERS.STATUS && this.un.reg(ins) != VM.CPU.REGISTERS.INS) {
                    offset = vm.regread(this.un.reg(ins)) + offset;
                }
                vm.push_register(REGISTERS.IP);
                vm.regwrite(REGISTERS.IP, offset);
            }
        },
        [
            function(vm, ins) {
                vm.regwrite(REGISTERS.SP, 0x100);
                vm.memwrite(0x90, new Array(0x20));
                vm.set_status(VM.CPU.STATUS.NEGATIVE);
                vm.memwritel(0, vm.encode({op: ins, reg: VM.CPU.REGISTERS.STATUS}));
                vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80);
                vm.step();
                assert.equal(vm.regread(REGISTERS.IP), 0x80, 'sets IP to offset');
                assert.equal(vm.memreadL(vm.regread(REGISTERS.SP) + 0), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'pushed IP');
            },
            // conditioned
            function(vm, ins) {
                vm.regwrite(REGISTERS.SP, 0x100);
                vm.memwrite(0x90, new Array(0x20));
                vm.set_status(VM.CPU.STATUS.ZERO);
                vm.memwritel(0, vm.encode({op: ins, reg: VM.CPU.REGISTERS.STATUS, condition: VM.CPU.STATUS.NEGATIVE}));
                vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80);

                // without matching status
                vm.clear_status(VM.CPU.STATUS.NEGATIVE);
                vm.step();
                assert.not_equal(vm.regread(REGISTERS.IP), 0x80, 'sets IP to offset');
                assert.not_equal(vm.memreadL(vm.regread(REGISTERS.SP) + 4), 0x8, 'pushed IP');
                assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

                // with matching status
                vm.set_status(VM.CPU.STATUS.NEGATIVE);
                vm.regwrite(REGISTERS.IP, 0);
                vm.step();
                assert.equal(vm.regread(REGISTERS.IP), 0x80, 'sets IP to offset');
                assert.equal(vm.memreadL(vm.regread(REGISTERS.SP) + 0), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'pushed IP');
            }
        ]
      ],
      [ "SIE", "Set the interrupt enable bit.",
        {},
        function(vm, ins) {
            vm.enable_interrupts();
        },
        function(vm, ins) {
            vm.disable_interrupts();
            vm.memwritel(0, vm.encode({op: ins}));
            vm.step();
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) != 0, 'sets the interrupt enable bit');
        }
      ],
      [ "SLEEP", "Sleeps the CPU.", [],
        function(vm, ins) {
            if(vm.debug) console.log("SLEEP", vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP, vm.cycles);
            vm.set_status(VM.CPU.STATUS.SLEEP|VM.CPU.STATUS.INT_ENABLED);
            vm.clear_status(VM.CPU.STATUS.INT_FLAG); // want interrupts to not queue
          return true;
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: ins}));
            assert.equal(vm.step(), false, 'causes step to return false');
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP) != 0, 'sets the sleep status bit');
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED) != 0, 'sets the interrupt enable bit');
            assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG) == 0, 'clears the INT_FLAG bit');
        }
      ],
      [],
      [],
      [ "RET", "Pop IP returning from a CALL.", {},
        function(vm, ins) {
            vm.pop(REGISTERS.IP);
        },
        function(vm, ins) {
            vm.memwritel(0, vm.encode({op: ins}));
            vm.regwrite(REGISTERS.SP, 0x100);
            vm.push_value(VM.CPU.STATUS.NEGATIVE);
            vm.push_value(0x30);
            vm.step();

            assert.equal(vm.regread(REGISTERS.SP), 0x100 - VM.CPU.REGISTER_SIZE, 'popped value from the stack');
            assert.equal(vm.regread(REGISTERS.IP), 0x30, 'sets IP to value on the stack');
        }
      ],
      [],
      [ "MEMCPY", "Copies count bytes starting from X to Y." ],
      [ "CALLR", "Push IP + " + VM.CPU.REGISTER_SIZE + ", and then set IP to the register REG + value of the OFFSET register. When REG is not STATUS or INS, that register's value is added to OFFSET. STATUS and INS are treated as zeros.",
        [ [ 'offset', [ 0xF000, 12 ] ],
          [ 'reg', [ 0xF00, 8 ] ]
        ],
        function(vm, ins) {
            let ip = vm.regread(REGISTERS.IP);
            let offset = vm.regread(this.un.offset(ins));
            if(this.un.reg(ins) != VM.CPU.REGISTERS.STATUS && this.un.reg(ins) != VM.CPU.REGISTERS.INS) {
                offset = vm.regread(this.un.reg(ins)) + offset;
            }

            vm.push_register(REGISTERS.IP);
            vm.regwrite(REGISTERS.IP, offset);
        },
        [
            function(vm, ins) {
                vm.regwrite(REGISTERS.SP, 0x100);
                vm.memwrite(0x90, new Array(0x20));
                vm.set_status(VM.CPU.STATUS.NEGATIVE);
                vm.memwritel(0, vm.encode({op: ins, reg: VM.CPU.REGISTERS.STATUS, offset: 0}));
                vm.regwrite(0, 0x80);
                vm.memwritel(0x80, 0x40);
                vm.step();
                assert.equal(vm.regread(REGISTERS.IP), 0x80, 'sets IP to offset');
                assert.equal(vm.memreadL(vm.regread(REGISTERS.SP) + 0), VM.CPU.INSTRUCTION_SIZE, 'pushed IP');
            },
            function(vm, ins) {
                vm.regwrite(REGISTERS.SP, 0x100);
                vm.memwrite(0x90, new Array(0x20));
                vm.set_status(VM.CPU.STATUS.NEGATIVE);
                vm.memwritel(0, vm.encode({op: ins, reg: 1, offset: 2}));
                vm.regwrite(1, 0x80);
                vm.regwrite(2, 0x10);
                vm.memwritel(0x10, 0x40);
                vm.step();
                assert.equal(vm.regread(REGISTERS.IP), 0x80 + 0x10, 'sets IP to reg + offset');
                assert.equal(vm.memreadL(vm.regread(REGISTERS.SP) + 0), VM.CPU.INSTRUCTION_SIZE, 'pushed IP');
            }
        ]
      ]
    ],
    // 0x8
    [ "MOV", "Transfer the value in X to DEST.",
      [ [ 'dest', [ 0xF0, 4 ] ],
        [ 'src', [ 0xF00, 8 ] ]
      ],
      function(vm, ins) {
		  vm.regwrite(this.un.dest(ins), vm.regread(this.un.src(ins)));
      },
      function(vm, ins) {
          var reg = (ins & 0xF0) >> 4;
          if(reg == VM.CPU.REGISTERS.IP) {
              return;
          }
	      vm.regwrite(reg == 2 ? 1 : 2, 123);
	      vm.regwrite(reg, 456);
	      vm.memwritel(0, vm.encode({op: ins, dest: reg, src: reg == 2 ? 1 : 2 }));
	      vm.regwrite(REGISTERS.IP, 0);
	      vm.step();
	      assert.assert(vm.regread(reg) == 123, 'assigns the dest register R' + reg + ' : ' + vm.regread(reg));
      }
    ],
    // 0x9
    [ "DEC", "Decrement X by OFFSET which is the 32 bits following the instruction. OFFSET is treated as a literal value (kind=0), relative address (kind=3), or an indirect relative address (kind=6). IP is advanced past OFFSET.",
      [ [ 'x', [ 0xf0, 4 ] ],
        [ 'condition', [ 0xF00, 8 ] ],
        [ 'kind', [ 0xF000, 12 ] ],
        [ 'data', VM.TYPES.ULONG ]
      ],
      function(vm, ins) {
          var ip = vm.regread(REGISTERS.IP)
          if(vm.check_condition(this.un.condition(ins))) {
              var y = vm.memreadl(ip);

              if(this.un.kind(ins) != 0 && this.un.kind(ins) != 7) {
                  y = vm.memreadl(vm.regread(REGISTERS.IP) + y);
              }
              if(this.un.kind(ins) == 6) {
                  y = vm.memreadl(y);
              }

              var result = vm.regread(this.un.x(ins)) - y;
              vm.regwrite(this.un.x(ins), result);

              if(result < 0) {
                  vm.set_status(VM.CPU.STATUS.NEGATIVE);
              } else {
                  vm.clear_status(VM.CPU.STATUS.NEGATIVE);
              }

              if(this.un.x(ins) != VM.CPU.REGISTERS.IP) {
                  vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
              }
          } else {
              vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
          }
      },
      function(vm, ins) {
          var reg = (ins & 0xf0) >> 4;
          if(reg >= VM.CPU.REGISTER_PARAMS) {
              return;
          }

          // no condition, literal offset
          vm.memwritel(0, vm.encode({op: ins, kind: 0}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 2);
          vm.regwrite(reg, 0x12345678);
          vm.step();
          assert.assert(vm.regread(reg) == 0x12345676, "R" + reg + " is decremented by 2 " + vm.regread(reg));
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) == 0, "clears the negative bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

          // no condition, goes negative
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 0}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 2);
          vm.regwrite(reg, 0x1);
          vm.regwrite(reg == 1 ? 2 : 1, 0x2);
          vm.step();
          assert.assert(vm.regread(reg) == 0xFFFFFFFF, "R" + reg + " is decremented by 2 " + vm.regread(reg));
          assert.assert(vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE, "sets the negative bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

          // no condition, offset type
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 3}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80 - VM.CPU.INSTRUCTION_SIZE);
          vm.memwritel(0x80, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) == 0x12345676, "R" + reg + " is decremented by 2 " + vm.regread(reg));
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) == 0, "clears the negative bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

          // no condition, indirect offset type
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 6}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80 - VM.CPU.INSTRUCTION_SIZE);
          vm.memwritel(0x80, 0x70);
          vm.memwritel(0x70, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) == 0x12345676, "R" + reg + " is decremented by 2 " + vm.regread(reg));
          assert.assert((vm.regread(REGISTERS.STATUS) & VM.CPU.STATUS.NEGATIVE) == 0, "clears the negative bit");
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

          // condition, offset type
          vm.reset();
          vm.memwritel(0, vm.encode({op: ins, kind: 3, condition: VM.CPU.STATUS.NEGATIVE}));
          vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x80 - VM.CPU.INSTRUCTION_SIZE);
          vm.clear_status(VM.CPU.STATUS.NEGATIVE);
          vm.memwritel(0x80, 0x2);
          vm.regwrite(reg, 0x12345678);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) != 0x12345676, "R" + reg + " is not decremented by 2 " + vm.regread(reg));
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

          vm.set_status(VM.CPU.STATUS.NEGATIVE);
          vm.regwrite(REGISTERS.IP, 0);
          vm.step();
          assert.assert(vm.regread(reg) == 0x12345676, "R" + reg + " is decremented by 2 " + vm.regread(reg));
          assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
      }
    ],
    // 0xA
    [ [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []     
    ],
    // 0xB
    [],
    // 0xC
    [],
    // 0xD
    [ "STORE", "Store the whole register SRC at the address REG + OFFSET. If REG is STATUS or INS then REG is not added. OFFSET is the " + VM.CPU.REGISTER_SIZE + " bytes following the instruction. IP is always advanced past this.",
      [ [ 'src', [ 0xF0, 4 ] ],
        [ 'condition', [ 0xF00, 8 ] ],
        [ 'reg', [ 0xF000, 12  ] ],
        [ 'data', VM.TYPES.ULONG ]
      ],
      function(vm, ins) {
          let ip = vm.regread(REGISTERS.IP);
          if(vm.check_condition(this.un.condition(ins))) {
              let offset = 0;
              if(this.un.reg(ins) != VM.CPU.REGISTERS.STATUS && this.un.reg(ins) != VM.CPU.REGISTERS.INS) {
                  offset = vm.regread(this.un.reg(ins));
                  offset += vm.memreadl(ip);
              } else {
                  offset = vm.memreadL(ip);
              }
              vm.memwritel(offset, vm.regread(this.un.src(ins)));
          }

          vm.regwrite(REGISTERS.IP, ip + VM.CPU.REGISTER_SIZE);
      },
      [
          // address in register
          function(vm, ins) {
              var reg = (ins & 0xF0) >> 4;
	          vm.memwritel(0, vm.encode({op: ins, src: reg, reg: reg == 1 ? 3 : 1 }));
              vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x30);
	          vm.memwrite(0x80, [ 0x44, 0x22 ]);
	          vm.regwrite(reg, 999);
              vm.regwrite(reg == 1 ? 3 : 1, 0x50);
	          vm.regwrite(REGISTERS.IP, 0);
	          vm.step();
	          assert.assert(vm.memreadl(0x80) == 999, 'stores the registers value to memory');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
          },
          // conditioned
          function(vm, ins) {
              var reg = (ins & 0xF0) >> 4;
	          vm.memwritel(0, vm.encode({op: ins, src: reg, reg: reg == 1 ? 3 : 1, condition: VM.CPU.STATUS.NEGATIVE }));
              vm.memwritel(VM.CPU.INSTRUCTION_SIZE, 0x30);
	          vm.memwrite(0x80, [ 0x44, 0x22 ]);
	          vm.regwrite(reg, 999);
              vm.regwrite(reg == 1 ? 3 : 1, 0x50);
	          vm.regwrite(REGISTERS.IP, 0);
              vm.clear_status(VM.CPU.STATUS.NEGATIVE);
	          vm.step();
	          assert.assert(vm.memreadl(0x80) != 999, 'does not store the registers value to memory');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');

	          vm.regwrite(REGISTERS.IP, 0);
              vm.set_status(VM.CPU.STATUS.NEGATIVE);
	          vm.step();
	          assert.assert(vm.memreadl(0x80) == 999, 'stores the registers value to memory');
              assert.equal(vm.regread(REGISTERS.IP), VM.CPU.INSTRUCTION_SIZE + VM.CPU.REGISTER_SIZE, 'increased IP');
          }          
      ]
    ],
    // 0xE
    [ "PUSH", "Pushes the specified register onto the stack.",
      [ [ 'src', [ 0x000000F0, 4 ] ] ],
      function(vm, ins) {
          vm.push_register(this.un.src(ins));
      },
      function(vm, ins) {
          var reg = (ins & 0xF0) >> 4;
	      vm.memwritel(0, vm.encode({op: ins, src: reg}));
	      vm.regwrite(reg, 123);
	      vm.regwrite(REGISTERS.IP, 0);
	      vm.step();
	      assert.assert(vm.regread(REGISTERS.SP) == vm.stack_start - 4, "decrements the stack pointer");
	      assert.assert(vm.memreadl(vm.stack_start - 4, 4) == 123, 'writes to memory at SP');
      }
    ],
    // 0xF
    []
];

VM.CPU.ArgMask = function(name, mask, shiftr)
{
    this.name = name;
    this.mask = mask;
    if(!mask) throw "Mask required: " + name;
    this.shiftr = shiftr || 0;
}

VM.CPU.ArgMask.prototype.get = function(ins)
{
    return (ins & this.mask) >> this.shiftr;
}

VM.CPU.ArgMask.prototype.shift = function(n)
{
    return (n << this.shiftr) & this.mask;
}

VM.CPU.Instruction = function(op, name, doc, arg_masks, has_literal, impl, tests)
{
    this.op = op;
    this.name = name;
    this.doc = doc;
    this.arg_masks = this.populate_argmasks(arg_masks);
    this.un = util.map_each(this.arg_masks, function(name, mask) {
        return function(ins) {
            return mask.get(ins);
        };
    });
    this.has_literal = has_literal;
    this.byte_size = VM.TYPES.SHORT.byte_size + this.has_literal.byte_size;
    this.impl = impl;
    this.tests = tests;
}

VM.CPU.Instruction.prototype.populate_argmasks = function(arg_masks)
{
    // populate arg masks from this instruction's definition
    var m = new Map();

    // dispatch table arg masks come in as VM.CPU.ArgMask instances
    util.map_each(arg_masks, function(name, mask) {
        if(mask.constructor != VM.CPU.ArgMask) {
            if(name.match(/\d+/)) {
                name = mask[0];
                mask = mask[1];
            }

            mask = new VM.CPU.ArgMask(name, mask[0], mask[1], mask[2]);
        }
        m[name.toLowerCase()] = mask;
    });
    // keep args from the dispatch tables from taking the map's first slots
    util.map_each(arg_masks, function(name, mask) {
        if(mask.constructor == VM.CPU.ArgMask) {
            m[name.toLowerCase()] = mask;
        }
    });

    return m;
}

VM.CPU.Instruction.prototype.call = function(vm, ins)
{
    return this.impl(vm, ins);
}

VM.CPU.Instruction.prototype.unmask = function(ins)
{
    var r = util.map_each(this.arg_masks, function(name, mask) {
        return mask.get(ins);
    });

    r[0] = ins;
    return r;
}

VM.CPU.Instruction.prototype.mask = function(opts)
{
    var n = opts.op | 0;
    
    util.map_each(this.arg_masks, function(name, mask) {
        n = n | mask.shift(opts[name] || 0);
    });
    
    return n;
}

VM.CPU.Instruction.prototype.encoder_list = function(args)
{
    if(args.constructor != Array) {
        args = Array.from(arguments);
    }
    
    var opts = { op: this.op };

    var i = 0;
    for(var arg_name in this.arg_masks) {
        if(arg_name == 'highop' || arg_name == 'lowop') continue;
        
        var v = args[i++];
        if(v) {
            opts[arg_name] = v;
        }
    }

    return opts;
}

VM.CPU.Instruction.prototype.run_tests = function(vm, inst)
{
    if(typeof(this.tests) == "function") {
        vm.reset();
        this.tests(vm, inst);
        return 1;
    } else if(this.tests) {
        var i = 0;
        for(; i < this.tests.length; i++) {
            vm.reset();
            this.tests[i](vm, inst);
        }

        return i;
    } else {
        return 0;
    }
}

VM.CPU.INS = [];
VM.CPU.INS_INST = [];
VM.CPU.INS_DISPATCH = new DispatchTable(0xF, 0);

function add_ins_to_tables(op, opts, masks)
{
    var ins = VM.CPU.INS_INST[op];
    if(!ins) {
        var arg_masks = {};
        var has_literal = false;
        util.map_each_n(masks, function(mask) {
            arg_masks[mask.name] = mask;
        });
        util.map_each(opts[2], function(name, mask) {
            if(name == 'data' || mask[0] == 'data') {
                if(typeof(mask[1]) == 'number')
                    has_literal = VM.TYPES[mask[1]];
                else if(mask[1] instanceof VM.Type)
                    has_literal = mask[1];
                else
                    throw "Unknown type: " + mask[1];
            } else {
                arg_masks[name] = mask;
            }
        });
        
        ins = VM.CPU.INS_INST[VM.CPU.INS[opts[0]]];
        if(!ins) {
            ins = new VM.CPU.Instruction(op, opts[0], opts[1], arg_masks, has_literal, opts[3], opts[4]);
        }
        VM.CPU.INS_INST[op] = ins;
    }
    if(!VM.CPU.INS[opts[0]]) {
        VM.CPU.INS[opts[0]] = op;
    }

    return ins;
}

function build_ins_tables(ins_defs, name, mask, shift, op, masks)
{
    if(!op) {
        op = 0;
    }
    if(!shift) {
        shift = 0;
    }
    if(!mask) {
        mask = 0xF;
    }
    if(!masks) masks = [];
    var tbl = new DispatchTable(mask, shift);
    tbl.arg_mask = new VM.CPU.ArgMask(name, mask, shift);
    
    for(var i = 0; i < ins_defs.length; i++) {
        var ins = ins_defs[i];
        if(ins == null) {
            continue;
        }

        var new_op = op | (i << shift);
        if(ins.mask != null && ins.ops != null) {
            var new_tbl = build_ins_tables(ins.ops, ins.name, ins.mask, ins.shift, new_op, masks.concat([tbl.arg_mask]))
            tbl.set(i, new_tbl);
        } else if(typeof(ins[0]) == 'string' && (typeof(ins[3]) == 'function' || ins[3] == null)) {
            var inst = add_ins_to_tables(new_op, ins, masks.concat([tbl.arg_mask]));
            tbl.set(i, inst);
        } else if(ins.length > 0 && ins.constructor == Array) {
            var new_tbl = build_ins_tables(ins, 'highop', 0xF << (shift+4), shift+4, new_op, masks.concat([tbl.arg_mask]))
            tbl.set(i, new_tbl);
        }
    }

    return tbl;
}

VM.CPU.INS_DISPATCH = build_ins_tables(VM.CPU.INS_DEFS, 'lowop', 0xF, 0);

VM.UnknownInstructionError = "Unknown instruction";
VM.InvalidRegisterError = "Invalid register error";
VM.MemoryFaultError = "Memory fault error";

VM.CPU.prototype.run = function(cycles)
{
    if(this.debug) console.log("CPU run", cycles);
    var i = 0;
    this.halted = false;
    this.keep_running = true;
    this.running = true;
    
    do {
		this.keep_running = this.step();
        i++;
	} while((cycles == null || i < cycles)
            && (this.keep_running != false && this.halted == false)
            || (this.interrupts_pending()
                && (this.check_condition(VM.CPU.STATUS.INT_ENABLED)
                    || this.check_condition(VM.CPU.STATUS.INT_FLAG))));

	return this;
}

VM.CPU.prototype.stop = function()
{
    this.halted = true;
    this.running = false;
}

VM.CPU.prototype.encode = function(opts)
{
    return VM.CPU.encode(opts);
}

VM.CPU.prototype.decode = function(ins, tbl)
{
    return VM.CPU.decode(ins, tbl);
}

VM.CPU.encode = function(opts)
{
    var ins = this.decode(opts.op);
    return ins.mask(opts);
}

VM.CPU.decode = function(ins, tbl)
{
    if(!tbl) {
        tbl = VM.CPU.INS_DISPATCH;
    }

    var i = tbl.get(ins);
    if(i.constructor == DispatchTable) {
        return this.decode(ins, i);
    } else {
        return i;
    }
}

VM.CPU.prototype.unknown_op = function(ins, ip)
{
    if(this.exceptional) {
        throw(VM.UnknownInstructionError);
    } else {
        this.interrupt(VM.CPU.INTERRUPTS.unknown_op);
    }
}

VM.CPU.prototype.do_step = function()
{
    if((this.halted || (this.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP) != 0)
       && !this.check_condition(VM.CPU.STATUS.INT_ENABLED|VM.CPU.STATUS.INT_FLAG)) {
        return false;
    }
    
    this.running = true;
    this.stepping = true;
    this.cycles++;
    
    if(!this.do_interrupt()) {
        let ip = this.regread(REGISTERS.IP);
	    let ins = this.memreadS(ip);

	    this.regwrite('ins', ins);
        this.regwrite(REGISTERS.IP, ip + VM.CPU.INSTRUCTION_SIZE);

        let i = this.decode(ins);
        if(i) {
          if(i.call(this, ins) == true && this.interrupts_pending() == 0) {
              this.stepping = false;
              return false;
            }
        } else {
            this.unknown_op(ins, ip);
        }
    }

    this.stepping = false;
	return this;
}

VM.CPU.prototype.step = function()
{
    try {
        return this.do_step();
    } catch(e) {
        this.stepping = false;
        if(e == DispatchTable.UnknownKeyError) {
            this.unknown_op(this.regread('ins'), this.regread(REGISTERS.IP));
        } else if(e instanceof VM.MMU.NotMappedError) {
            this.interrupt(VM.CPU.INTERRUPTS.mem_fault);
        } else if(e instanceof RangedHash.InvalidAddressError) {
            this.interrupt(VM.CPU.INTERRUPTS.mem_fault);
        } else if(e instanceof PagedHash.NotMappedError) {
            this.interrupt(VM.CPU.INTERRUPTS.mem_fault);
        } else {
          console.log("Ignoring exception", e);
            if(this.exceptional) {
                throw(e);
            }
        }

        return this;
    }
}

VM.CPU.prototype.dbstep = function(cycles)
{
    var ip = this.regread(REGISTERS.IP);

    if(!cycles) { cycles = 1; }
    
    for(var i = 0; i < cycles; i++) {
        this.step();
    }

    return this.debug_dump();
}

VM.CPU.prototype.debug_dump = function(ip_offset)
{
    console.log("Cycle", this.cycles);
    
    var ip = this.regread(REGISTERS.IP);
    if(ip_offset) ip += ip_offset;
    
    try {
        var op = this.memreadS(ip);
        var ins = this.decode(op)
        console.log("Instruction", "@0x" + ip.toString(16), "0x" + op.toString(16), "0x" + this.memreadL(ip + VM.CPU.INSTRUCTION_SIZE).toString(16));
        console.log("           ", "@" + ip, op, this.memreadL(ip + VM.CPU.INSTRUCTION_SIZE));
        console.log("  ", ins ? ins.name : 'unknown', ins.unmask(op));
    } catch(e) {
        console.log("Error decoding INS", ip)
    }
    var self = this;
    var stack = util.n_times(Math.min(this.debug_stack_size || 16, this.stack_start, this.regread(REGISTERS.SP)), function(n) {
        try {
            return self.memreadL(self.regread(REGISTERS.SP) + n * VM.CPU.REGISTER_SIZE);
        } catch(e) {
            return 0;
        }
    });;
    console.log("Registers");
    console.log("0x", util.map_each_n(this._reg, function(i, n) { return i.toString(16); }).join(", "));
    console.log("  ", this._reg.join(", "));

    console.log("Stack", this.regread(REGISTERS.SP), "0x" + this.regread(REGISTERS.SP).toString(16));
    console.log("0x", util.map_each_n(stack, function(i, n) { return i.toString(16); }).join(", "));
    console.log("  ", stack.join(", "));

    console.log();
    
    return this;
}

VM.CPU.prototype.push_register = function(reg)
{
    let v = this.regread(reg);
	let sp = this.regread(REGISTERS.SP) - 4;
	this.memwritel(sp, v);
	this.regwrite(REGISTERS.SP, sp);
    return this;
}

VM.CPU.prototype.push_value = function(v)
{
    if(typeof(v) == 'string') v = this.regread(v);
	let sp = this.regread(REGISTERS.SP) - 4;
	this.memwritel(sp, v);
	this.regwrite(REGISTERS.SP, sp);
    return this;
}

VM.CPU.prototype.pop = function(reg)
{
	this.regwrite(reg, this.memreadL(this.regread(REGISTERS.SP)));
    if(register_index(reg) != register_index(REGISTERS.SP)) {
		this.regwrite(REGISTERS.SP, this.regread(REGISTERS.SP) + 4);
    }
    return this;
}

VM.CPU.prototype.reset = function()
{
	for(var i = 0; i < 16; i++) {
		this.regwrite(i, 0);
	}
	this.regwrite(REGISTERS.STATUS, 0);
	this.regwrite(REGISTERS.SP, this.stack_start);
    this.halted = false;
    this._pending_interrupts = [];
    this.interrupt(VM.CPU.INTERRUPTS.reset);
	return this;
}

VM.CPU.prototype.map_memory = function(addr, size, responder)
{
    this.mem.map_memory(addr, size, responder);
    return this;
}

VM.CPU.prototype.memread = function(addr, count)
{
    return this.mem.memread(addr, count);
}

VM.CPU.prototype.memreadl = function(addr)
{
    return this.mem.memreadl(addr);
}

VM.CPU.prototype.memreadL = function(addr)
{
    return this.mem.memreadL(addr);
}

VM.CPU.prototype.memreadS = function(addr)
{
    return this.mem.memreadS(addr);
}

VM.CPU.prototype.memwrite = function(addr, data, type)
{
    return this.mem.memwrite(addr, data, type);
}

VM.CPU.prototype.memwritel = function(addr, n)
{
    return this.mem.memwritel(addr, n);
}

VM.CPU.prototype.memwriteL = function(addr, n)
{
    return this.mem.memwriteL(addr, n);
}

VM.CPU.prototype.memwrites = function(addr, n)
{
    return this.mem.memwrite(addr, n);
}

VM.CPU.prototype.memwriteS = function(addr, n)
{
    return this.mem.memwriteS(addr, n);
}

function register_index(reg)
{
    if(typeof(reg) == "number") {
        return reg;
    } else {
        var r = VM.CPU.REGISTERS[reg.toUpperCase()];
        if(r == null) throw VM.InvalidRegisterError;
        else return r;
    }
}

VM.CPU.prototype.regread = function(reg, type)
{
    var index = register_index(reg);
    if(type == VM.TYPES.ULONG || type == null) {
       return this._reg[index];
    } else {
        var offset = index * VM.CPU.REGISTER_SIZE;
        if(typeof(type) == 'number' || typeof(type) == 'string') type = VM.TYPES[type];
        if(!type) type = VM.TYPES.ULONG;
        return type.get(this._reg_view, offset, true);
    }
}

VM.CPU.prototype.regreadf = function(reg)
{
    return this.regread(reg, VM.TYPES.FLOAT);
}

VM.CPU.prototype.regwrite = function(reg, value, type)
{
    var index = register_index(reg);
    if(type == VM.TYPES.ULONG || type == null) {
        this._reg[index] = value;
    } else {
        var offset = index * VM.CPU.REGISTER_SIZE;
        if(typeof(type) == 'number' || typeof(type) == 'string') type = VM.TYPES[type];
        if(!type) type = VM.TYPES.ULONG;
        type.set(this._reg_view, offset, value, true);
    }
    
	return this;
}

VM.CPU.prototype.regwritef = function(reg, value)
{
    return this.regwrite(reg, value, VM.TYPES.FLOAT);
}

VM.CPU.prototype.set_status = function(bits)
{
    this.regwrite(REGISTERS.STATUS, this.regread(REGISTERS.STATUS) | bits);
    return this;
}

VM.CPU.prototype.clear_status = function(bits)
{
    this.regwrite(REGISTERS.STATUS, this.regread(REGISTERS.STATUS) & ~bits);
}

VM.CPU.prototype.check_condition = function(bits)
{
    return bits == 0 || (this.regread(REGISTERS.STATUS) & bits) != 0;
}

VM.CPU.prototype.interrupt = function(interrupt)
{
    if(this.debug) {
        console.log("Interrupt", interrupt, VM.CPU.INTERRUPTS[interrupt],
                    this.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP,
                    this.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED,
                    this.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_FLAG,
                    this.regread(REGISTERS.IP),
                    this.regread(REGISTERS.SP),
                    Date.now());
        this.debug_dump();
    }

    // todo need to queue when inside an ISR w/ INT_ENABLED = 0
    if((this.regread(REGISTERS.STATUS) & (VM.CPU.STATUS.INT_ENABLED | VM.CPU.STATUS.INT_FLAG)) != 0) {
        this._pending_interrupts.push(interrupt);
        /*
    if((this.regread(REGISTERS.STATUS) & VM.CPU.STATUS.SLEEP) != 0) {
      if(this.keep_running == false) {
        if(this.debug) console.log("CPU Waking");
        this.run(this.max_cycles);
      }
    }
*/
    }
    
    return this;
}

VM.CPU.prototype.interrupts_pending = function()
{
    return this._pending_interrupts.length;
}

VM.CPU.prototype.do_interrupt = function()
{
    if((this.regread(REGISTERS.STATUS) & VM.CPU.STATUS.INT_ENABLED)
       && this._pending_interrupts.length > 0) {
        this.push_register(REGISTERS.IP);
        this.push_register(REGISTERS.STATUS);
        this.set_status(VM.CPU.STATUS.INT_FLAG);
        this.disable_interrupts();
        var intr = this._pending_interrupts.shift();
        this.regwrite(REGISTERS.IP, this.regread(REGISTERS.ISR) + intr * VM.CPU.INTERRUPTS.ISR_BYTE_SIZE);
        if(this.debug) console.log("Doing interrupt", intr, this.regread(REGISTERS.IP));

        return true;
    } else {
        return false;
    }
}

VM.CPU.prototype.disable_interrupts = function()
{
    this.clear_status(VM.CPU.STATUS.INT_ENABLED);
    return this;
}

VM.CPU.prototype.enable_interrupts = function()
{
    this.set_status(VM.CPU.STATUS.INT_ENABLED);
    if(this.debug) console.log("Pending interrupts", this._pending_interrupts);
    return this;
}

VM.CPU.prototype.save_state = function()
{
  var self = this;
  
  return {
    registers: util.n_times(VM.CPU.REGISTER_COUNT, function(n) {
      return self.regread(n);
    })
  };
}

VM.CPU.prototype.restore_state = function(state)
{
  if(state['registers']) {
    for(var i = 0; i < VM.CPU.REGISTER_COUNT; i++) {
      this.regwrite(i, state.registers[i]);
    }
  }
}


function vm_run_dispatch_table_tests(tbl, vm, op)
{
    var num_tests = 0;
    var max = tbl.mask >> tbl.shift;
    if(!op) op = 0;

    for(var key = 0; key <= max; key++) {
        var new_op = (key << tbl.shift) | op;
        if(tbl.has(new_op)) {
            var v = tbl.get(new_op);
            if(v.run_tests) {
                var n = v.run_tests(vm, new_op);
                num_tests += n;
            } else if(v.get) {
                var n = vm_run_dispatch_table_tests(v, vm, new_op);
                num_tests += n;
            }
        }
    }

    return num_tests;
}

const RAM = require("vm/devices/ram.js");

VM.CPU.test_suite = function()
{
    var num_tests = 0;
    var mem = new VM.MemoryBus();
    var mem_size = 1<<16;
	var vm = new VM.CPU(mem, mem_size);
    vm.exceptional = true;

    // exercise memread/write's ability to span memory regions
    var split_at = PagedHash.PageSize;
    mem.map_memory(0, split_at, new RAM(split_at));
    mem.map_memory(split_at, mem_size - split_at, new RAM(mem_size - split_at));
    var seq = util.n_times(128, function(n) { return n; });
    vm.memwrite(0, seq);
    assert.equal(Array.from(vm.memread(0, seq.length)), seq, 'reads what was written');

    // run the instruction tests
    num_tests += vm_run_dispatch_table_tests(VM.CPU.INS_DISPATCH, vm);

    // unknown op interrupt
    vm.reset();
    vm.memwrite(0, [ 0xFF, 0xFF, 0xFF, 0xFF ]);
    assert.is_thrown(function() { vm.step(); }, VM.UnknownInstructionError, "because it is exceptional");
    
    vm.reset();
    vm.enable_interrupts();
    vm.exceptional = false;
    assert.assert(vm.step() == vm, 'wants to keep running');
    assert.assert(vm.interrupts_pending(), 'has an interrupt');

    console.log("" + num_tests + " tests ran.");
	return vm;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"asserts.js":66,"paged_hash.js":76,"util.js":77,"vm/devices/ram.js":93,"vm/dispatch_table.js":97,"vm/ranged_hash.js":101,"vm/types.js":104}],83:[function(require,module,exports){
(function (global){
if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

require('vm/devices/ram.js');
require('vm/devices/memory_bus.js');
require('vm/devices/mmu.js');
require('vm/devices/console.js');
require('vm/devices/gfx.js');
require('vm/devices/keyboard.js');
require('vm/devices/timer.js');
require('vm/devices/keystore.js');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"vm/devices/console.js":84,"vm/devices/gfx.js":85,"vm/devices/keyboard.js":89,"vm/devices/keystore.js":90,"vm/devices/memory_bus.js":91,"vm/devices/mmu.js":92,"vm/devices/ram.js":93,"vm/devices/timer.js":96}],84:[function(require,module,exports){
const DataStruct = require('data_struct.js');
const RAM = require('vm/devices/ram.js');
require('vm/types.js');

function Console(mem_size)
{
    mem_size = mem_size || 1024;

    this.name = "Console";
    this.data_struct = new DataStruct([
        [ 'buffer', mem_size, VM.TYPES.UBYTE ],
        [ 'flush', VM.TYPES.ULONG ]
    ]);
    this.ram = new RAM(this.data_struct.byte_size);
  this.data = this.data_struct.proxy(this.ram.data_view());
  this.callbacks = [ function(str) { console.log(str); } ];
}

Console.prototype.ram_size = function()
{
  return this.ram.length;
}

Console.prototype.add_callback = function(cb)
{
  this.callbacks.push(cb);
  return this;
}

Console.prototype.flush = function()
{
  var str = String.fromCharCode.apply(null, this.data.buffer.slice(0, this.data.flush)).trim();
  for(var i in this.callbacks) {
    this.callbacks[i](str);
  }
  this.ram.set(0, this.ram.length, 0);
}

Console.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

Console.prototype.write = function(addr, data)
{
  this.ram.write(addr, data);
  if(addr == this.data.ds.fields['flush'].offset) {
    this.flush();
  }
}

Console.prototype.step = function(s)
{
  return false;
}

if(typeof(module) != 'undefined') {
	module.exports = Console;
}

},{"data_struct.js":67,"vm/devices/ram.js":93,"vm/types.js":104}],85:[function(require,module,exports){
(function (global){
"use strict";

const Enum = require('enum.js');
const DataStruct = require('data_struct.js');
const RangedHash = require('vm/ranged_hash.js');
const RAM = require('vm/devices/ram.js');
const util = require('util.js');

const PixelBuffer = require("vm/devices/gfx/pixel_buffer");
const Layer = require("vm/devices/gfx/layer");
const Command = require("vm/devices/gfx/command");

function GFX(irq, canvases_for_layers, w, h, mem_size, pixel_width, pixel_height, img_srcs)
{
    this.name = "GFX";
    this.mem_size = mem_size;
    this.input_ram = new RAM(mem_size);
    this.input_struct = GFX.InputMemory(canvases_for_layers.length, mem_size);
    this.input_data = this.input_struct.proxy(this.input_ram.data_view());
    var self = this;
    this.layers = util.map_each_n(canvases_for_layers, function(l, n) {
        return new GFX.Layer(n, l, self.input_data.layers[n].view, w, h);
    });
    this.images = img_srcs;
    this.input_data.current_layer = 0;
    this.input_data.flags = GFX.Flags.SYNC;
    this.irq = irq;
    this.next_output_addr = 0;
    this.timer = null; //[];
    this.pixel_buffer = new GFX.PixelBuffer(pixel_width || w,
                                            pixel_height || h);
    this.pixel_offset = this.input_struct.byte_size;
}

const SIZEOF_FLOAT = Float32Array.BYTES_PER_ELEMENT;
const SIZEOF_SHORT = Uint16Array.BYTES_PER_ELEMENT;
const SIZEOF_LONG = Uint32Array.BYTES_PER_ELEMENT;

GFX.PixelBuffer = PixelBuffer;
GFX.Layer = Layer;
GFX.Command = Command;

GFX.MAX_LAYERS = 16;

GFX.UnknownCommandError = "Unknown command error";

GFX.Flags = new Enum({
    NONE: 0,
    SYNC: 1,
    RESYNC: 2
});

GFX.LayerMemory = new DataStruct([
    [ 'id', VM.TYPES.BYTE ],
    [ 'visible', VM.TYPES.UBYTE ],
    [ 'width', VM.TYPES.ULONG ],
    [ 'height', VM.TYPES.ULONG ],
    [ 'x', VM.TYPES.FLOAT, 0.0 ],
    [ 'y', VM.TYPES.FLOAT, 0.0 ],
    [ 'z', VM.TYPES.LONG, 0 ],
    [ 'alpha', VM.TYPES.FLOAT, 0.0 ]
], true, SIZEOF_LONG);

GFX.InputMemory = function(num_layers, mem_size, stack_size)
{
    stack_size = stack_size || 16;
    
    return new DataStruct([
        [ 'flags', VM.TYPES.ULONG ],
        [ 'last_error', VM.TYPES.ULONG ],
        [ 'error_offset', VM.TYPES.ULONG ],
        [ 'result', VM.TYPES.ULONG ],
        [ 'result_values', 8, VM.TYPES.FLOAT ],
        [ 'current_layer', VM.TYPES.ULONG ],
        [ 'layers', num_layers, GFX.LayerMemory ],
        [ 'swapping', VM.TYPES.ULONG ],
        [ 'ip', VM.TYPES.ULONG ],
        [ 'sp', VM.TYPES.ULONG ],
        [ 'call_stack', stack_size, VM.TYPES.ULONG ],
        [ 'input', (mem_size - num_layers * GFX.LayerMemory.byte_size - (17 + stack_size) * VM.TYPES.ULONG.byte_size), VM.TYPES.UBYTE ],
        [ 'swap', VM.TYPES.ULONG ]
    ], true, SIZEOF_LONG);
}

const GFX_COMMANDS = [
    [ "NOP", "" ],
    [ "COMPOSITE", "" ],
    [ "RESET", "" ],
    [ "CLEAR", "" ],
    [ "SET_FILL", "BBBB" ],
    [ "SET_LINE", "BBBB" ],
    [ "SET_LINE_CAP", "B" ],
    [ "SET_LINE_JOIN", "B" ],
    [ "SET_STROKE", "BBBB" ],
    [ "SET_STROKE_WIDTH", "f" ],
    [ "SET_LINE_WIDTH", "f" ],
    [ "SAVE", "" ],
    [ "RESTORE", "" ],
    [ "SET_LAYER", "B" ],
    [ "CALL", "L" ],
    [ "RET", "" ],
    [ "BEGIN", "" ],
    [ "END", "" ],
    [ "SCALE", "ff" ],
    [ "ROTATE", "f" ],
    [ "TRANSLATE", "ff" ],
    [ "RECT", "ffff" ],
    [ "FILL_RECT", "ffff" ],
    [ "MOVE", "ff" ],
    [ "LINE", "ff" ],
    [ "CURVE", "ffffff" ],
    [ "STROKE", "" ],
    [ "FILL", "" ],
    [ "GET_PIXELS", "LLLLLL" ],
    [ "PUT_PIXELS", "LLLLLL" ],
    [ "COPY_PIXELS", "LLLLLL" ],
    [ "PUT_IMAGE", "LLLLLLL" ]
];

GFX.LINE_CAPS = new Enum([
    "BUTT",
    "ROUND",
    "SQUARE"
]);

GFX.LINE_JOINS = new Enum([
    "BEVEL",
    "ROUND",
    "MITER"
]);

GFX.commands = {};
GFX.commands_by_name = {};

for(var i in GFX_COMMANDS) {
    var def = GFX_COMMANDS[i];
    var op = parseInt(i);
    var cmd = new GFX.Command(def[0], def[1]);
    GFX.commands[op] = cmd;
    GFX.commands_by_name[cmd.name] = cmd;
    GFX["CMD_" + cmd.name] = op;
}

GFX.StackOverflowError = 'Stack overflow';

GFX.ERRORS = {};
GFX.ERRORS[GFX.UnknownCommandError] = 1;
GFX.ERRORS[GFX.Command.ArgumentError] = 2;
GFX.ERRORS[RangedHash.InvalidAddressError] = 3;
GFX.ERRORS[GFX.StackOverflowError] = 4;

GFX.prototype.process_drawing_cmd = function()
{
    var ip = this.input_data.ip;
    var inc = 1;
    var off = this.input_data.ds.fields['input'].offset;
    var cmd = this.input_data.input[ip];

    if(ip >= this.input_data.input.byteLength) {
        return false;
    }

    if(this.debug == 2) {
        console.log("ip", ip, "cmd", cmd, GFX.commands[cmd], "RAM", this.input_ram.read(ip + off, 16), "SP", this.input_data.sp, "swap", this.input_data.swap, this.input_data.swapping);
    }

    if(this.context == null) {
        this.context = this.get_context('2d');
    }
    
    switch(cmd) {
    case GFX.CMD_NOP:
        break;
    case GFX.CMD_CLEAR:
        this.context.clearRect(0, 0, this.get_current_layer().width, this.get_current_layer().height);
        break;
    case GFX.CMD_SET_LAYER:
        this.set_layer(this.input_data.input[ip + 1]);
        this.context = this.get_context('2d');
        inc += 1;
        break;
    case GFX.CMD_SET_LINE_CAP:
        this.context.lineCap = GFX.LINE_CAPS[this.input_ram.read(ip + off + 1, 1)[0]].toLowerCase();
        inc += 1;
        break;
    case GFX.CMD_SET_LINE_JOIN:
        this.context.lineJoin = GFX.LINE_JOINS[this.input_ram.read(ip + off + 1, 1)[0]].toLowerCase();
        inc += 1;
        break;
    case GFX.CMD_SET_FILL:
        var c = Array.from(this.input_ram.read(ip + off + 1, 4));
        c[3] = c[3] / 255.0;
        this.context.fillStyle = 'rgba(' + c.join(',') + ')';
        inc += 4;
        break;
    case GFX.CMD_SET_STROKE:
        var c = Array.from(this.input_ram.read(ip + off + 1, 4));
        c[3] = c[3] / 255.0;
        this.context.strokeStyle = 'rgba(' + c.join(',') + ')';
        inc += 4;
        break;            
    case GFX.CMD_SET_LINE:
        var c = Array.from(this.input_ram.read(ip + off + 1, 4));
        c[3] = c[3] / 255.0;
        this.context.lineStyle = 'rgba(' + c.join(',') + ')';
        inc += 4;
        break;
    case GFX.CMD_SET_LINE_WIDTH:
        var c = this.input_ram.readf(ip + off + 1, 1);
        this.context.lineWidth = c[0];
        inc += VM.TYPES.FLOAT.byte_size;
        break;
    case GFX.CMD_SET_STROKE_WIDTH:
        var c = this.input_ram.readf(ip + off + 1, 1);
        this.context.strokeWidth = c[0];
        inc += VM.TYPES.FLOAT.byte_size;
        break;
    case GFX.CMD_SAVE:
        this.context.save();
        break;
    case GFX.CMD_RESTORE:
        this.context.restore();
        break;
    case GFX.CMD_BEGIN:
        this.context.beginPath();
        break;
    case GFX.CMD_END:
        this.context.closePath();
        break;
    case GFX.CMD_SCALE:
        var scale = this.input_ram.readf(ip + off + 1, 2);
        this.context.scale(scale[0], scale[1]);
        inc += VM.TYPES.FLOAT.byte_size * 2;
        break;
    case GFX.CMD_TRANSLATE:
        var dx = this.input_ram.readf(ip + off + 1, 2);
        this.context.translate(dx[0], dx[1]);
        inc += VM.TYPES.FLOAT.byte_size * 2;
        break;
    case GFX.CMD_ROTATE:
        var dx = this.input_ram.readf(ip + off + 1, 1);
        this.context.rotate(dx[0]);
        inc += VM.TYPES.FLOAT.byte_size;
        break;
    case GFX.CMD_FILL_RECT:
        var x = this.input_ram.readf(ip + off + 1, 4);
        this.context.fillRect(x[0], x[1], x[2], x[3]);
        inc += VM.TYPES.FLOAT.byte_size * 4;
        break;
    case GFX.CMD_RECT:
        var x = this.input_ram.readf(ip + off + 1, 4);
        this.context.rect(x[0], x[1], x[2], x[3]);
        inc += VM.TYPES.FLOAT.byte_size * 4;
        break;
    case GFX.CMD_MOVE:
        var x = this.input_ram.readf(ip + off + 1, 2);
        this.context.moveTo(x[0], x[1]);
        inc += VM.TYPES.FLOAT.byte_size * 2;
        break;
    case GFX.CMD_LINE:
        var x = this.input_ram.readf(ip + off + 1, 2);
        this.context.lineTo(x[0], x[1]);
        inc += VM.TYPES.FLOAT.byte_size * 2;
        break;
    case GFX.CMD_CURVE:
        var x = this.input_ram.readf(ip + off + 1, 6);
        this.context.bezierCurveTo(x[0], x[1], x[2], x[3], x[4], x[5]);
        inc += VM.TYPES.FLOAT.byte_size * 6;
        break;
    case GFX.CMD_STROKE:
        this.context.stroke();
        break;
    case GFX.CMD_FILL:
        this.context.fill();
        break;
    case GFX.CMD_CALL:
        inc += VM.TYPES.LONG.byte_size;
        this.input_data.ip += inc;
        this.call(this.input_ram.readL(ip + off + 1, 1)[0]);
        break;
    case GFX.CMD_RET:
        if(!this.call_return()) {
            return false;
        }
        break;
    case GFX.CMD_GET_PIXELS:
        inc += VM.TYPES.ULONG.byte_size * 6;
        var x = this.input_ram.readL(ip + off + 1, 6);
        var img = this.context.getImageData(x[0], x[1], x[2], x[3]);
        this.pixel_buffer.copy_image(img, 0, 0, x[4], x[5], x[2], x[3]);
        break;
    case GFX.CMD_PUT_PIXELS:
        inc += VM.TYPES.ULONG.byte_size * 6;
        var x = this.input_ram.readl(ip + off + 1, 6);
        this.pixel_buffer.put_pixels(this.context, x[0], x[1], x[2], x[3], x[4], x[5]);
        break;
    case GFX.CMD_COPY_PIXELS:
        inc += VM.TYPES.ULONG.byte_size * 6;
        var args = this.input_ram.readl(ip + off + 1, 6);
        this.pixel_buffer.copy_pixels(args[0], args[1], args[2], args[3], args[4], args[5]);
        break;
    case GFX.CMD_PUT_IMAGE:
        inc += VM.TYPES.ULONG.byte_size * 7;
        var x = this.input_ram.readl(ip + off + 1, 7);
        var n = x.shift();
        if(this.images[n]) {
            this.context.drawImage(this.images[n],
                                   x[2], x[3], x[4], x[5],
                                   x[0] + x[2], x[1] + x[3], x[4], x[5]);
        }
        break;
    default:
        this.write_error(GFX.UnknownCommandError, cmd);
        break;
    }

    if(cmd != GFX.CMD_CALL && cmd != GFX.CMD_RET) {
        if(this.debug == 2) console.log("IP += " + inc);
        this.input_data.ip += inc;
    }
    
    return true;
}

GFX.prototype.call = function(new_ip)
{
    if(this.input_data.sp < this.input_data.call_stack.length) {
        this.input_data.call_stack[this.input_data.sp++] = this.input_data.ip;
        this.input_data.ip = new_ip;
    } else {
        this.write_error(GFX.StackOverflowError, this.input_data.ip);
    }
}

GFX.prototype.call_return = function()
{
    if(this.input_data.sp > 0) {
        this.input_data.ip = this.input_data.call_stack[--this.input_data.sp];
        return true;
    } else {
        //this.stop_exec();
        return false;
    }
}

GFX.prototype.swap_buffers = function()
{
    if(this.debug) console.log("Swapping buffers", this.input_data.swapping, this.input_data.swap, this.timer);
    if(this.input_data.swapping == 0) {
        if(this.input_data.swap != 0) {
            if(this.debug) console.log("Commence swap");
            this.input_data.ip = this.input_data.swap - 1;
            this.input_data.swapping = this.input_data.swap;
            /*
      if(this.input_data.flags & (GFX.Flags.SYNC | GFX.Flags.RESYNC)) {
        this.request_animation();
      } else {
        this.run_anim();
      } 
*/
            
            return false;
        }
    }
    
    return this;
}

GFX.prototype.request_animation = function()
{
    if(this.debug) console.log("GFX request animation", this.timer, this.raf);
    /*
    if(this.timer == null) {
        this.raf = null;
        var self = this;
        this.timer = window.requestAnimationFrame(function(dt) {
          self.run_anim(dt);
        });
    } else {
        this.raf = true;
    }
*/
}

GFX.prototype.stop = function()
{
    if(this.timer) {
        window.cancelAnimationFrame(this.timer);
        this.timer = null;
        this.raf = null;
    }
    // if(this.timer.length > 0) {
    //     map_each(this.timer, function(t) {
    //         window.cancelAnimationFrame(t);
    //     });
    //     this.timer = [];
    // }
}

GFX.prototype.stop_exec = function()
{
    this.input_data.ip = 0;
    this.input_data.swapping = 0;
    this.input_data.swap = 0;

    this.trigger_interrupt();

    return this;
}

GFX.prototype.run_anim = function(dt)
{
    if(this.debug) console.log("GFX run_anim", dt, this.timer, this.raf, this.input_data.ip);
    
    this.timer = null;

    /*
    if((this.input_data.flags & GFX.Flags.RESYNC) || this.raf) {
        this.request_animation();
    }
  */

    var r;
    do {
        r = this.step_anim();
    } while(r != false);

    if(this.debug) console.log("GFX run_anim done", this.input_data.ip, this.input_data.last_error);
}

GFX.prototype.step = function()
{
    return this.step_anim();
}

GFX.prototype.trigger_interrupt = function()
{
    if(this.debug) console.log("GFX trigger interrupt");
    this.irq.trigger();
}

GFX.prototype.step_anim = function()
{
    if(this.input_data.swapping != 0) {
        try {
            if(this.process_drawing_cmd() != false) {
                return this;
            }
        } catch(err) {
            this.write_error(err, i);
        }

        this.stop_exec();
    }

    return false;
}

GFX.prototype.debug_dump = function()
{
    console.log("GFX", "layer", this.input_data.current_layer, "IP", this.input_data.ip, "SP", this.input_data.sp, "Swap", this.input_data.swap, this.input_data.swapping);
    return this;
}

GFX.BadLayerError = "Bad Layer";

GFX.prototype.set_layer = function(n)
{
    if(n < 0 || n >= this.layers.length) throw GFX.BadLayerError; 
    this.input_data.current_layer = n;
    return this;
}

GFX.prototype.get_context = function(type)
{
    return this.layers[this.input_data.current_layer].get_context(type);
}

GFX.prototype.get_current_layer = function()
{
    return this.layers[this.input_data.current_layer];
}

GFX.prototype.ram_size = function()
{
    return this.input_struct.byte_size + this.pixel_buffer.length;
}

GFX.prototype.read = function(addr, count, output, offset)
{
    if(addr < this.input_ram.length) {
        return this.input_ram.read(addr, count, output, offset);
    } else {
        return this.pixel_buffer.read(addr - this.input_ram.length, count, output, offset);
    }
}

GFX.prototype.write = function(addr, data)
{
    var n;
    if(addr < this.input_ram.length) {
        n = this.input_ram.write(addr, data);
        if(addr == this.input_struct.fields.swap.offset) {
            this.swap_buffers();
        }
    } else {
        n = this.pixel_buffer.write(addr - this.input_ram.length, data);
    }

    return n;
}

GFX.prototype.write_error = function(err, offset)
{
    var e = GFX.ERRORS[err];
    if(e) {
        this.input_data.last_error = err;
        this.input_data.error_offset = offset;
    } else {
        throw(err);
    }
}

GFX.prototype.writef = function(addr, v)
{
    var a = new Uint8Array(Float32Array.BYTES_PER_ELEMENT);
    var dv = new DataView(a.buffer, a.byteOffset);
    VM.TYPES.FLOAT.set(dv, 0, v);
    this.write(addr, a);
    return this;
}

GFX.prototype.write_resultf = function(result, a, b, c)
{
    this.input_data.result = result;
    this.input_data.result_values[0] = a;
    this.input_data.result_values[1] = b;
    this.input_data.result_values[2] = c;
    return this;
}

GFX.prototype.write_resultb = function(result, a, b, c)
{
    // todo actually write bytes or floats?
    this.input_data.result = result;
    this.input_data.result_values[0] = a;
    this.input_data.result_values[1] = b;
    this.input_data.result_values[2] = c;
    return this;
}

GFX.prototype.write_array = function(addr, arr) {
    return this.write(addr, GFX.encode_array(arr));
}

GFX.encode_array = function(arr, bytes) {
    if(!bytes) bytes = new Uint8Array(arr.length * VM.TYPES.LONG.byte_size);

    var bi = 0;
    for(var i = 0; i < arr.length; i++) {
        var cmd = GFX.commands[arr[i]];
        if(cmd == null) throw "Undefined: " + arr + " " + i;
        bytes[bi] = arr[i];
        bi += 1;
        bi += cmd.encode_array(arr.slice(i + 1, i + 1 + cmd.arity), new DataView(bytes.buffer, bytes.byteOffset + bi));
        i += cmd.arity;
    }

    return bytes.subarray(0, bi);
}

function gfx_test_cmds(r, g, b)
{
    return [
        GFX.CMD_SET_LAYER, 0,
        GFX.CMD_CLEAR,
        GFX.CMD_SET_LINE_CAP, GFX.LINE_CAPS.ROUND,
        GFX.CMD_SET_FILL, r, g, b, 255,
        GFX.CMD_FILL_RECT, 0, 0, 640, 480,
        GFX.CMD_SET_STROKE, 0, 255, 0, 255,
        GFX.CMD_SET_LINE, 255, 0, 0, 255,
        GFX.CMD_SET_LINE_WIDTH, 5,
        GFX.CMD_BEGIN,
        GFX.CMD_MOVE, 0, 0,
        GFX.CMD_LINE, 320, 240,
        GFX.CMD_LINE, 320, 0,
        GFX.CMD_STROKE,
        GFX.CMD_BEGIN,
        GFX.CMD_MOVE, 100, 0,
        GFX.CMD_SET_STROKE, 0, 0, 255, 128,
        GFX.CMD_SET_LINE_WIDTH, 10,
        GFX.CMD_LINE, 480, 320,
        GFX.CMD_CURVE, 0, 480, 0, 0, 640, 480,
        GFX.CMD_STROKE,
        GFX.CMD_RET
    ];
}

GFX.video_test_layers = function(video, target, cycles)
{
    var set_layer = [
        GFX.CMD_CLEAR,
        GFX.CMD_SET_LAYER, target,
        GFX.CMD_SCALE, 0.5, 0.5,
    ];

    video.input_data.layers[target].z = 1;
    video.input_data.layers[target].x = 640 * 0.25;
    video.input_data.layers[target].y = 480 * 0.25;
    video.input_data.layers[target].width = 320;
    video.input_data.layers[target].height = 240;
    video.input_data.layers[target].alpha = 0.5;
    video.write_array(video.input_data.ds.fields['input'].offset, set_layer.concat(gfx_test_cmds(255, 0, 0)));
    video.write(video.input_data.ds.fields['swap'].offset, [ 1, 0, 0, 0]);
    //video.input_data.swap = 1;
    //video.writef(GFX.INPUT_LAYERS + GFX.INPUT_LAYER_ALPHA, 0.5);

    if(!cycles) cycles = 100;
    util.n_times(cycles, function(n) {
        video.step();
    });
}

GFX.video_test_pixels = function(video, cycles)
{
    var width = video.pixel_buffer.width;
    var height = video.pixel_buffer.height;
    var channels = 4;
    
    var solid_pixels = [
        GFX.CMD_SET_LAYER, 0,
        GFX.CMD_CLEAR,
        GFX.CMD_PUT_PIXELS, 64, 64, 0, 0, 64, 64,
        GFX.CMD_PUT_PIXELS, 320, 32, 0, 0, 64, 64,
        GFX.CMD_RET
    ];

    var get_pixels = [
        GFX.CMD_SAVE,
        GFX.CMD_GET_PIXELS, 0, 0, width, height, 0, 0,
        GFX.CMD_CLEAR,
        GFX.CMD_PUT_PIXELS, 320, 32, 0, 0, width/2, height/2,
        GFX.CMD_RESTORE,
        GFX.CMD_RET
    ];

    var pixels = [];
    for(var x = 0; x < 64 * channels; x += channels) {
        pixels[x] = 255;
        pixels[x+1] = 0;
        pixels[x+2] = 0;
        pixels[x+3] = 128;
    }
    
    for(var row = 0; row < 64; row++) {
        var addr = video.input_struct.byte_size + row * width * channels;
        console.log("Writing pixels to " + addr);
        video.write(addr, pixels);
    }

    var off = video.input_data.ds.fields['input'].offset;
    var get_pixels_off = video.write_array(off, solid_pixels);
    off += get_pixels_off;
    off += video.write_array(off, get_pixels);
    
    console.log("Swapping");
    //video.input_data.swap = 1;
    video.write(video.input_data.ds.fields['swap'].offset, [ 1, 0, 0, 0]);

    setTimeout(function() {
        if(video.input_data.swapping == 0) {
            console.log("Step", get_pixels_off);
            video.write(video.input_data.ds.fields['swap'].offset, [ 1 + get_pixels_off, 0, 0, 0]);
        }
    }, 1000);
    /*
  do {
    console.log("Step");
    video.step();
  } while(video.input_data.swapping != 0);
*/
    /*
  util.n_times(cycles, function(n) {
    video.step_anim();
  });
*/
}

GFX.video_test = function(canvas, cycles)
{
    if(canvas.constructor != Array) canvas = [ canvas ];
    var video = new GFX(null, 8, canvas, 640, 480, 4096);

    // todo stored drawings: bitmap, offscreen canvas
    // todo every device needs a step: rename VM to CPU and have a VM to step everything
    // todo pixel access?
    // todo canvas resizing events
    var cmd_arr = GFX.encode_array(gfx_test_cmds(0, 0, 128));
    video.write(video.input_data.ds.fields['input'].offset, cmd_arr);
    //video.write_array(video.input_data.ds.fields['input'].offset, gfx_test_cmds(0, 0, 128));
    console.log("Command byte length", cmd_arr.byteLength);
    console.log("Setting swap to 1");
    video.write(video.input_data.ds.fields['swap'].offset, [ 1, 0, 0, 0]);
    //video.input_data.swap = 1;
    /*
  console.log("Stepping");
  do {
        video.step();
    } while(video.input_data.swapping != 0);
*/
    
    return video;
}

GFX.video_test_call = function(video)
{
    var call_cmds = [
        GFX.CMD_SAVE,
        GFX.CMD_TRANSLATE, 10.0, 0.0,
        GFX.CMD_CALL, 27,
        GFX.CMD_ROTATE, Math.PI / 8.0,
        GFX.CMD_CALL, 27,
        GFX.CMD_ROTATE, Math.PI / 8.0,
        GFX.CMD_CALL, 27,
        GFX.CMD_RESTORE,
        GFX.CMD_RET
    ];
    var cmd_arr = GFX.encode_array(gfx_test_cmds(0, 128, 128));
    var off = video.input_data.ds.fields['input'].offset;
    video.write(off, cmd_arr);
    off += cmd_arr.byteLength;
    video.write(off, GFX.encode_array(call_cmds));
    
    video.input_data.swap = cmd_arr.byteLength + 1;
    // trip the write callbacks
    video.write(video.input_data.ds.fields['swap'].offset, cmd_arr.byteLength + 1);
    
    return video;
}

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}
if(typeof(VM.Devices) == 'undefined') {
    VM.Devices = {};
}
VM.Devices.GFX = GFX;

if(typeof(module) != 'undefined') {
	module.exports = GFX;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"data_struct.js":67,"enum.js":68,"util.js":77,"vm/devices/gfx/command":86,"vm/devices/gfx/layer":87,"vm/devices/gfx/pixel_buffer":88,"vm/devices/ram.js":93,"vm/ranged_hash.js":101}],86:[function(require,module,exports){
Command = function(name, arglist)
{
    this.name = name;
    this.arglist = arglist;
    this.arity = arglist.length;
}

Command.ArgumentError = "ArgumentError";

Command.prototype.encode_array = function(args, dv)
{
    if(args.length != this.arity) {
        throw Command.ArgumentError;
    }

    var bi = 0;
    for(var i = 0; i < this.arity; i++) {
        switch(this.arglist[i]) {
        case 'b':
            dv.setInt8(bi, args[i]);
            bi += Int8Array.BYTES_PER_ELEMENT;
            break;
        case 'B':
            dv.setUint8(bi, args[i]);
            bi += Uint8Array.BYTES_PER_ELEMENT;
            break;
        case 'f':
            dv.setFloat32(bi, args[i], true);
            bi += Float32Array.BYTES_PER_ELEMENT;
            break;
        case 'l':
            dv.setInt32(bi, args[i], true);
            bi += Int32Array.BYTES_PER_ELEMENT;
            break;
        case 'L':
            dv.setUint32(bi, args[i], true);
            bi += Uint32Array.BYTES_PER_ELEMENT;
            break;
        default:
            throw "Unkown arglist specifier";
        }
    }

    return bi;
}

if(typeof(module) != 'undefined') {
    module.exports = Command;
}
},{}],87:[function(require,module,exports){
function Layer(id, canvas, data, w, h, x, y, z, alpha)
{
    this.canvas = canvas;
    this.data = data;
    var self = this;
    this.id(id);
    this.width(w);
    this.height(h);
    this.x(x || 0);
    this.y(y || 0);
    this.z(z || 0);
    this.alpha(alpha || 0.0);
}

Layer.FIELDS = {
    id: function(v) { },
    visible: function(v) { this.canvas.style.visibility = (v > 0) ? 'visible' : 'hidden'; },
    width: function(v) { this.canvas.style.width = this.canvas.width = v; },
    height: function(v) { this.canvas.style.height = this.canvas.height = v; },
    x: function(v) { this.canvas.style.left = v; },
    y: function(v) { this.canvas.style.top = v; },
    z: function(v) { this.canvas.style.zIndex = v; },
    alpha: function(v) { this.canvas.style.opacity = v; }
};

Layer.add_attr = function(name, setter)
{
    Layer.prototype[name] = function(v) {
        if(v) {
            this.data[name] = v;
        }
        return this.data[name];
    }
}

for(var f in Layer.FIELDS) {
    Layer.add_attr(f, Layer.FIELDS[f]);
}

Layer.prototype.get_context = function(type)
{
    if(this.context == null) {
        this.context = this.canvas.getContext(type || '2d');
    }

    return this.context;
}

if(typeof(module) != 'undefined') {
    module.exports = Layer;
}

},{}],88:[function(require,module,exports){
const RAM = require('vm/devices/ram.js');

PixelBuffer = function(width, height)
{
    this.width = width || w;
    this.height = height || h;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext('2d');
    this.buffer = this.context.createImageData(this.width, this.height);
    this.ram = new RAM(this.buffer.data);
    this.length = this.ram.length;
}

PixelBuffer.prototype.put_pixels = function(dest, x, y, sx, sy, w, h)
{
    this.context.putImageData(this.buffer, 0, 0, sx, sy, w, h);
    dest.drawImage(this.canvas,
                   sx, sy, w, h,
                   x + sx, y + sy, w, h);
}

PixelBuffer.prototype.copy_pixels = function(sx, sy, dx, dy, w, h)
{
    this.copy_image(this.buffer, sx, sy, dx, dy, w, h);
}

PixelBuffer.prototype.copy_image = function(img, sx, sy, dx, dy, w, h)
{
    if(w == null) w = img.width;
    if(h == null) h = img.height;
    var channels = 4;
    for(var row = 0; row < h; row++) {
        var di = (dy + row) * this.buffer.width * channels + dx * channels;
        if(di >= this.buffer.data.length) break;
        this.buffer.data.set(img.data.subarray((sy + row) * img.width * channels + (sx * channels),
                                               (sy + row) * img.width * channels + (sx + w) * channels),
                             di);
    }
}

PixelBuffer.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

PixelBuffer.prototype.write = function(addr, data)
{
    return this.ram.write(addr, data);
}

if(typeof(module) != 'undefined') {
    module.exports = PixelBuffer;
}

},{"vm/devices/ram.js":93}],89:[function(require,module,exports){
require('vm/types.js');
const DataStruct = require('data_struct.js');
const Enum = require('enum.js');
const RingBuffer = require('vm/ring_buffer.js');
const RAM = require('vm/devices/ram.js');

function Keyboard(el, irq)
{
  this.name = "Keyboard";
    this.running = false;
    this.focused = false;
    this.element = el;
    
    this.irq = irq;
    this.ram = new RAM(Keyboard.MemoryStruct_16.byte_size);
    this.mem = Keyboard.MemoryStruct_16.proxy(this.ram.data_view());
    this.buffer = new RingBuffer(Keyboard.MemoryStruct_16.fields.events.type, this.mem.events)

    this.install_keyhandlers();
    this.reset();
}

Keyboard.Modifiers = new Enum([
    [ "NONE", 0 ],
    [ "SHIFT", 1<<0 ],
    [ "CTRL", 1<<1 ],
    [ "ALT", 1<<2 ],
    [ "META", 1<<3 ],
    [ "REPEAT", 1<<4 ],
    [ "PRESSED", 1<<15  ]
]);

Keyboard.EventStruct = new DataStruct([
    [ 'char_code', VM.TYPES.USHORT ],
    [ 'key_code', VM.TYPES.USHORT ],
    [ 'modifiers', VM.TYPES.USHORT ],
    [ 'padding', VM.TYPES.USHORT ]
]);

Keyboard.MemoryStruct = function(n)
{
    return new DataStruct([
        [ 'events', RingBuffer.DataStruct(n, Keyboard.EventStruct) ]
    ]);
}
Keyboard.MemoryStruct_16 = Keyboard.MemoryStruct(16);

Keyboard.prototype.reset = function()
{
    this.buffer.clear();
}

Keyboard.prototype.step = function()
{
  this.running = true;
  return false;
}

Keyboard.prototype.stop = function()
{
  this.running = false;
}

Keyboard.prototype.install_keyhandlers = function()
{
    var self = this;

    this.element.addEventListener('click', function(ev) {
        if(self.element.classList.contains('focused') == false) {
            if(self.debug) console.log("Keyboard device focused");
            self.element.classList.add('focused');
            self.focused = true;
        }
    });

    document.body.addEventListener('click', function(ev) {
        if(ev.target != self.element) {
            if(self.debug) console.log("Keyboard device lost focus");
            self.element.classList.remove('focused');
            self.focused = false;
        }
    });
    
    window.onkeyup = function(ev) { if(self.focused) return self.on_key(false, ev); };
    window.onkeydown = function(ev) { if(self.focused) return self.on_key(true, ev); };
}

Keyboard.prototype.encode_modifiers = function(pressed, ev)
{
    var r = 0;
    if(pressed) r = r | Keyboard.Modifiers.PRESSED;
    if(ev.altKey) r = r | Keyboard.Modifiers.ALT;
    if(ev.ctrlKey) r = r | Keyboard.Modifiers.CTRL;
    if(ev.metaKey) r = r | Keyboard.Modifiers.META;
    if(ev.shiftKey) r = r | Keyboard.Modifiers.SHIFT;
    if(ev.repeat) r = r | Keyboard.Modifiers.REPEAT;
    return r;
}

Keyboard.prototype.buffer_size = function()
{
    return this.buffer.length();
}

Keyboard.prototype.buffer_full = function()
{
    return this.buffer.full();
}

Keyboard.prototype.on_key = function(pressed, ev)
{
    if(ev.target.tagName == 'INPUT') {
        if(this.debug) console.log(ev);
        return;
    }
    
  if(this.running != true) return;
  
    if(ev.key == 'r' && ev.ctrlKey) {
        return;
    }
    
    ev.preventDefault();
    if(ev.repeat) return;

    var kb_ev = {
        char_code: ev.charCode,
        modifiers: this.encode_modifiers(pressed, ev),
        key_code: ev.keyCode
    };

    if(this.debug) {
	    console.log("on_key " + pressed, ev, ev.code, this.mem.events.read_offset, this.mem.events.write_offset, this.buffer.empty(), this.buffer.length(), kb_ev);
    }

  this.buffer.push(kb_ev);
  // todo beep if the buffer is full?
  this.irq.trigger();
}

Keyboard.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

Keyboard.prototype.write = function(addr, data)
{
    return this.ram.write(addr, data);
}

Keyboard.prototype.ram_size = function()
{
    return this.ram.length;
}

if(typeof(module) != 'undefined') {
	module.exports = Keyboard;
}


},{"data_struct.js":67,"enum.js":68,"vm/devices/ram.js":93,"vm/ring_buffer.js":102,"vm/types.js":104}],90:[function(require,module,exports){
require('vm/types.js');
const DataStruct = require('data_struct.js');
const Enum = require('enum.js');
const RAM = require('vm/devices/ram.js');

function KeyStore(storage, memory, irq, name)
{
  this.name = name || 'KeyStore';
  this.storage = storage;
  this.memory = memory;
  this.irq = irq;
  this.ram = new RAM(KeyStore.Struct.byte_size);
  this.state = KeyStore.Struct.proxy(this.ram.data_view());
  this.reset();
}

KeyStore.Status = new Enum([
  [ "NONE", 0 ],
  [ "OK", 1 ],
  [ "NOT_FOUND", 2 ],
  [ "BUSY", 4 ],
  [ 'ERROR', 0x80 ],
  [ "BAD_COMMAND", (0x80 | 2) ]
]);

KeyStore.Command = new Enum([
  [ "NONE", 0 ],
  [ "ENABLE", 1 ],
  [ "DISABLE", 2 ],
  [ "RESET", 3 ],
  [ "STAT", 4 ],
  [ "READ", 5 ],
  [ "WRITE", 6 ],
  [ "DELETE", 7 ],
  [ "NUMBER", 8 ]
]);

KeyStore.Struct = new DataStruct([
  [ 'status', VM.TYPES.ULONG ],
  [ 'command', VM.TYPES.ULONG ],
  [ 'offset', VM.TYPES.ULONG ],
  [ 'key', VM.TYPES.ULONG ],
  [ 'key_size', VM.TYPES.ULONG ],
  [ 'data_pointer', VM.TYPES.ULONG ],
  [ 'data_size', VM.TYPES.ULONG ],
  [ 'data_out_pointer', VM.TYPES.ULONG ],
  [ 'data_out_size', VM.TYPES.ULONG ]
]);

KeyStore.prototype.ram_size = function()
{
  return this.ram.length;
}

KeyStore.prototype.reset = function()
{
  this.ram.set(0, this.ram.length, 0);

  this.state.status = KeyStore.Status.BUSY;
  this.storage.disable((err) => {
    if(err) {
      this.state.status = KeyStore.Status.ERROR;
    } else {
      this.state.status = KeyStore.Status.NONE;
    }
  });
}

KeyStore.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

KeyStore.prototype.read_key = function()
{
  return this.memory.memread(this.state.key, this.state.key_size);
}

KeyStore.prototype.process_command = function()
{
  if(this.debug) console.log('KeyStore command', this.state.command, KeyStore.Command[this.state.command], this.state.status);
  var cmd = KeyStore.Commands[this.state.command];
  if(cmd == null) cmd = KeyStore.Commands[KeyStore.Command.NUMBER];
  return cmd.call(this);
}

KeyStore.Commands = {};

KeyStore.Commands[KeyStore.Command.NONE] = function()
{
  if(this.state.status == KeyStore.Status.BUSY) return this;
  this.state.status = KeyStore.Status.OK;
  this.state.command = 0;
  return this;
}

KeyStore.Commands[KeyStore.Command.NUMBER] = function()
{
  if(this.state.status == KeyStore.Status.BUSY) return this;
  this.state.status = KeyStore.Status.BAD_COMMAND;
  this.state.command = 0;
  return this;
}

KeyStore.Commands[KeyStore.Command.DELETE] = function()
{
  if(this.state.status == KeyStore.Status.BUSY) return this;
  this.state.status = KeyStore.Status.BUSY;

  var key = this.read_key();
  this.storage.removeItem(key, (new_key, state) => {
    this.state.status = state ? KeyStore.Status.OK : KeyStore.Status.ERROR;
    this.state.command = 0;
    this.irq.trigger();
  });

  return this;
}

KeyStore.Commands[KeyStore.Command.WRITE] = function()
{
  if(this.state.data_out_size > 0) {
    if(this.state.status == KeyStore.Status.BUSY) return this;
    this.state.status = KeyStore.Status.BUSY;

    var key = this.read_key();
    var data = this.memory.memread(this.state.data_out_pointer, this.state.data_out_size);
    if(this.debug) console.log("Write", key, data);
    this.storage.setItem(key, data, (new_key, success) => {
      this.state.status = success ? KeyStore.Status.OK : KeyStore.Status.ERROR;
      this.state.command = 0;
      if(success) {
        var key_size = Math.min(new_key.length, this.state.data_size);
        if(this.debug) console.log("Wrote", new_key, success, key_size, this.state.status, this.irq);
        this.memory.memwrite(this.state.data_pointer, new_key.slice(0, key_size));
        this.state.data_size = key_size;
      }
      this.irq.trigger();
    });
  } else {
    KeyStore.Commands[KeyStore.Command.DELETE].call(this);
  }

  return this;
}

KeyStore.Commands[KeyStore.Command.READ] = function()
{
  if(this.state.status == KeyStore.Status.BUSY) return this;
  this.state.status = KeyStore.Status.BUSY;
  
  var key = this.read_key();
  var value = this.storage.getValue(key, this.state.offset, this.state.data_size, (read_key, data) => {
    if(this.debug) console.log("Read", key, read_key, data ? data.length : 0, this.state.offset, this.state.data_size, data);
    this.state.command = 0;
    if(data != null) {
      var size = Math.min(data.length, this.state.data_size);
      this.memory.memwrite(this.state.data_pointer, data.slice(0, size));
      this.state.data_size = size;
      this.state.status = KeyStore.Status.OK;
    } else {
      this.state.data_size = 0;
      this.state.status = KeyStore.Status.NOT_FOUND | KeyStore.Status.ERROR;
    }
    this.irq.trigger();
  });

  return this;
}

KeyStore.Commands[KeyStore.Command.STAT] = function()
{
  if(this.state.status == KeyStore.Status.BUSY) return this;
  this.state.status = KeyStore.Status.BUSY;

  var key = this.read_key();
  var data = this.storage.getSize(key, (read_key, size) => {
    this.state.command = 0;
    if(size != null) {
      this.state.data_size = size;
      this.state.status = KeyStore.Status.OK;
    } else {
      this.state.data_size = 0;
      this.state.status = KeyStore.Status.NOT_FOUND | KeyStore.Status.ERROR;
    }
    this.irq.trigger();
  });
  return this;
}

KeyStore.Commands[KeyStore.Command.ENABLE] = function()
{
  if(this.state.status != KeyStore.Status.NONE) return this;
  this.state.status = KeyStore.Status.BUSY;

  this.storage.enable((err) => {
    this.state.command = 0;
    if(err) {
      this.state.status = KeyStore.Status.ERROR;
    } else {
      this.state.status = KeyStore.Status.OK;
    }
    this.irq.trigger();
  });
  return this;
}

KeyStore.Commands[KeyStore.Commands.DISABLE] = function()
{
  if(this.state.status == KeyStore.Status.NONE) return this;
  this.state.status = KeyStore.Status.BUSY;

  this.storage.disable((err) => {
    this.state.command = 0;
    if(err) {
      this.state.status = KeyStore.Status.ERROR;
    } else {
      this.state.status = KeyStore.Status.NONE;
    }
    this.irq.trigger();
  });
  return this;
}

function in_range(n, min, max)
{
  if(n >= min && n < max) { return true; }
  else { return false; }
}

KeyStore.prototype.write = function(addr, data)
{
  var n = this.ram.write(addr, data);
  if(in_range(this.state.ds.fields.command.offset, addr, addr + data.length)) this.process_command();
  return n;
}

if(typeof(module) != 'undefined') {
	module.exports = KeyStore;
}
if(typeof(VM) != 'undefined') {
    VM.LocalKeyStore = KeyStore;
}

},{"data_struct.js":67,"enum.js":68,"vm/devices/ram.js":93,"vm/types.js":104}],91:[function(require,module,exports){
(function (global){
"use strict";

const RangedHash = require('vm/ranged_hash.js');
const PagedHash = require('paged_hash.js');

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

VM.MemoryBus = function()
{
  this.name = "MemoryBus";
  this.memory_map = new PagedHash();
}

VM.MemoryBus.NotMappedError = function(addr)
{
  this.msg = "Address not mapped: " + addr;
  this.addr = addr;
}

VM.MemoryBus.prototype.step = function()
{
  return false;
}

VM.MemoryBus.prototype.map_memory = function(addr, size, responder)
{
    this.memory_map.add(addr, size, responder);
    return this;
}

VM.MemoryBus.prototype.start_address_for = function(dev)
{
  var range = this.memory_map.range_for(dev);
  if(range) {
    return range.addr;
  }
}

VM.MemoryBus.prototype.memread = function(addr, count)
{
    if(this.debug) console.log("MemoryBus read", addr, typeof(count) == 'number', count);
    
    if(typeof(count) == "number") {
        var buffer = new Uint8Array(count);
        var a;
        for(var offset = 0; offset < count; offset++) {
            a = addr + offset;
          //var mem = this.memory_map.gete(a);
          //var inc = mem.value.read(a - mem.start, count, buffer, offset);
          var mem = this.memory_map.get(a);
          if(mem == null || mem.value == null) throw new VM.MemoryBus.NotMappedError(addr);
            var inc = mem.value.read(a - mem.addr, count, buffer, offset);
            if(inc == 0) break;
            offset += inc - 1;
        }
        return buffer;
    } else {
        var type = count;
        if(type == null) type = VM.TYPES.ULONG;
        else if(typeof(type) == 'string') type = VM.TYPES[count];
        
        var b = this.memread(addr, type.byte_size);
        var dv = new DataView(b.buffer, b.byteOffset);
        return type.get(dv, 0, true);
    }
}

VM.MemoryBus.prototype.memread1 = function(addr, type)
{
  var mem = this.memory_map.get(addr);
  if(mem == null) throw new VM.MemoryBus.NotMappedError(addr);
  
  var out = this.memread(addr, type.byte_size);
  var dv = new DataView(out.buffer, out.byteOffset);
  return type.get(dv, 0, true);
}

VM.MemoryBus.prototype.memreadl = function(addr)
{
    return this.memread1(addr, VM.TYPES.LONG);
}

VM.MemoryBus.prototype.memreadL = function(addr)
{
    return this.memread1(addr, VM.TYPES.ULONG);
}

VM.MemoryBus.prototype.memreadS = function(addr)
{
    return this.memread1(addr, VM.TYPES.USHORT);
}

VM.MemoryBus.prototype.memwrite = function(addr, data, type)
{
    if(type) {
        var b = new Uint8Array(type.byte_size);
        var dv = new DataView(b.buffer, b.byteOffset);
        type.set(dv, 0, data, true);
	      return this.memwrite(addr, b);
    } else {
        var a, offset;
        for(offset = 0; offset < data.length; offset++) {
            a = addr + offset;
          //var mem = this.memory_map.gete(a);
          //var inc = mem.value.write(a - mem.start, data.slice(offset));
            var mem = this.memory_map.get(a);
            if(mem == null) throw new VM.MemoryBus.NotMappedError(addr);
            var inc = mem.value.write(a - mem.addr, data.slice(offset));
            if(inc == 0) {
                break;
            }
            offset += inc - 1; // double inc w/o - 1
        }
        
        return offset;
    }
}

VM.MemoryBus.prototype.memwrite1 = function(addr, value, type)
{
  var mem = this.memory_map.get(addr);
  if(mem == null) throw new VM.MemoryBus.NotMappedError(addr);

  var bytes = new Uint8Array(type.byte_size);
  var dv = new DataView(bytes.buffer);
  type.set(dv, 0, value, true);
  return this.memwrite(addr, bytes);
}

VM.MemoryBus.prototype.memwritel = function(addr, n)
{
    return this.memwrite1(addr, n, VM.TYPES.LONG);
}

VM.MemoryBus.prototype.memwriteL = function(addr, n)
{
    return this.memwrite1(addr, n, VM.TYPES.ULONG);
}

VM.MemoryBus.prototype.memwrites = function(addr, n)
{
    return this.memwrite1(addr, n, VM.TYPES.SHORT);
}

VM.MemoryBus.prototype.memwriteS = function(addr, n)
{
    return this.memwrite1(addr, n, VM.TYPES.USHORT);
}

VM.MemoryBus.prototype.save_state = function()
{
  var memories = [];

  this.memory_map.map(function(m, n) {
    memories[m.id] = {
      addr: m.addr,
      size: m.size,
      value: m.value['save_state'] ? m.value.save_state() : null
    };
  });
  
  return {
    memories: memories
  };
}

VM.MemoryBus.prototype.restore_state = function(state)
{
  if(state['memories']) {
    for(var i = 0; i < state.memories.length; i++) {
      var m = state.memories[i];
      var mem = this.memory_map.get(m.addr);
      if(m.value
         && mem.size == m.size
         && mem.value
         && mem.value['restore_state']) {
        mem.value.restore_state(m.value);
      }
    }
  }
}

VM.MemoryBus.test_suite = function()
{
  const RAM = require('vm/devices/ram');
  const assert = require('asserts.js');

  var mem = new VM.MemoryBus();
  var size = PagedHash.PageSize;
  mem.map_memory(0, size, new RAM(size));
  mem.map_memory(size, size, new RAM(size));

  // read/write
  assert.assert(mem.memwrite(0, [ 1, 2, 3, 4 ]) == 4, 'returns number bytes writen');
  assert.assert(mem.memread(0, 4).toString() == [ 1, 2, 3, 4 ].toString(), 'reads the bytes that were writen');
  
  // read and write at a divide
  assert.assert(mem.memwrite(size - 2, [ 1, 2, 3, 4]) == 4, 'returns number of bytes writen');
  assert.assert(mem.memread(size - 2, 4).toString() == [ 1, 2, 3, 4 ].toString(), 'reads the bytes that were writen');

  // integers at the divide
  for(var offset = 0; offset < 4; offset++) {
    mem.memwriteL(size - offset, 0x12345678);
    assert.assert(mem.memreadL(size - offset) == 0x12345678, 'reads the integer that was writen offset by ' + offset);
    assert.assert(mem.memreadS(size - offset + 1) == 0x3456, 'reads shorts');
  }
  
  return mem;
}

if(typeof(module) != 'undefined') {
	module.exports = VM.MemoryBus;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"asserts.js":66,"paged_hash.js":76,"vm/devices/ram":93,"vm/ranged_hash.js":101}],92:[function(require,module,exports){
(function (global){
"use strict";

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

VM.MMU = function()
{
}

VM.MMU.prototype.step = function()
{
  return false;
}

if(typeof(module) != 'undefined') {
	module.exports = VM.MMU;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],93:[function(require,module,exports){
(function (global){
function RAM(amount)
{
    if(typeof(amount) == 'number') {
        this.set_data(new Uint8Array(amount));
    } else {
        this.set_data(amount);
    }
}

RAM.prototype.set_data = function(arr)
{
  this._data = arr;
  this.length = arr.length;
  this._view = this.data_view();
}

RAM.prototype.data_view = function(offset)
{
    return new DataView(this._data.buffer, this._data.byteOffset + (offset || 0));
}

RAM.prototype.read = function(addr, count, output, offset)
{
    if(output) {
        var i;
        for(i = 0; i < count; i++) {
            if(addr + i >= this._data.length) {
                break;
            }
            output[offset + i] = this._data[addr + i];
        }
        return i;
    } else {
		    return this._data.subarray(addr, addr + count);
    }
}

RAM.prototype.write = function(addr, data)
{
    if(data.length == null) data = [ data ];
    
    var i;
	  for(i = 0; i < data.length; i++) {
        if(addr + i >= this._data.length) {
            break;
        }
		    this._data[addr + i] = data[i];
	  }
	  return i;
}

RAM.prototype.set = function(addr, count, value)
{
    for(var i = 0; i < count; i++) {
        this.write(addr + i, value);
    }
}

RAM.prototype.step = function()
{
  return false;
}

RAM.prototype.save_state = function()
{
  return {
    length: this.length,
    memory: this.read(0, this.length)
  };
}

RAM.prototype.restore_state = function(state)
{
  if(state['memory']) {
    this.set_data(new Uint8Array(state.memory));
  } else if(state['length']) {
    this.set_data(new Uint8Array(state.length));
  }
}

var RAM_TYPE_ACCESSORS = [
    [ "f", "Float32" ],
    [ "l", "Int32" ],
    [ "L", "Uint32" ],
    [ "s", "Int16" ],
    [ "S", "Uint16" ]
];

for(var i = 0; i < RAM_TYPE_ACCESSORS.length; i++) {
    var a = RAM_TYPE_ACCESSORS[i];
    
    var x = function(sym, type) {
        var type_array = eval(type + "Array");
        RAM.prototype["read" + sym] = function(addr, count, endian) {
            var bytes = this.read(addr, type_array.BYTES_PER_ELEMENT * count);
            var dv = new DataView(bytes.buffer, bytes.byteOffset);
            var result = [];
            for(var i = 0; i < count; i++) {
                result[i] = dv["get" + type](i * type_array.BYTES_PER_ELEMENT, endian || true);
            }
            return result;
        }

        RAM.prototype["write" + sym] = function(addr, data, endian) {
            var bytes = new Uint8Array(data.length * type_array.BYTES_PER_ELEMENT);
            var dv = new DataView(this._data.buffer, this._data.byteOffset + addr);

            for(var i = 0; i < data.length; i++) {
                dv["set" + type](i * type_array.BYTES_PER_ELEMENT, data[i], endian || true);
            }
            return this;
        }
    };

    x(a[0], a[1]);
}

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
  VM = {};
}
if(typeof(VM.Devices) == 'undefined') {
  VM.Devices = {};
}
VM.Devices.RAM = RAM;

if(typeof(module) != 'undefined') {
  module.exports = RAM;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],94:[function(require,module,exports){
"use strict";

const DataStruct = require('data_struct.js');
const VMJS = require('vm.js');
const RAM = require('vm/devices/ram.js');

var now, start_time;

if(typeof(performance) != 'undefined') {
    now = function() {
        return performance.now();
    }

    start_time = function() {
        return performance.timing.navigationStart;;
    }
} else {
    now = function() {
        return Date.now();
    }

    var start = now();
    start_time = function() {
        return start;
    }
}

function RTC()
{
    this.name = 'RTC';
    this.input_ram = new RAM(RTC.InputMemory.byte_size);
    this.input_data = RTC.InputMemory.proxy(this.input_ram.data_view());
    this.input_data.on_time = start_time();
}

RTC.InputMemory = new DataStruct([
    [ 'calendar_ms', VM.TYPES.ULONG ],
    [ 'on_time', VM.TYPES.FLOAT ],
    [ 'runtime_usec', VM.TYPES.ULONG ],
    [ 'runtime_ms', VM.TYPES.FLOAT ],
    [ 'runtime_sec', VM.TYPES.ULONG ]
]);

RTC.prototype.ram_size = function()
{
    return this.input_ram.length;
}

RTC.prototype.read = function(addr, count, output, offset)
{
    this.update();
    return this.input_ram.read(addr, count, output, offset);
}

RTC.prototype.update = function()
{
    var t = now();
    this.input_data.runtime_ms = t;
    this.input_data.runtime_usec = (t * 1000)|0;
    this.input_data.runtime_sec = (t / 1000)|0;
    this.input_data.calendar_ms = Date.now();
}

if(typeof(module) != 'undefined') {
    module.exports = RTC;
}

},{"data_struct.js":67,"vm.js":80,"vm/devices/ram.js":93}],95:[function(require,module,exports){
const VM = require("vm.js");
const Xterm = require('xterm');
const Colors = require('colors/safe');
const util = require('more_util');
const InputStream = require('vm/node/devices/input_stream');
const OutputStream = require('vm/node/devices/output_stream');
const TextDecoder = require('util/text_decoder');
const TextEncoder = require('util/text_encoder');

function Terminal(element, term_opts)
{
    Colors.enabled = true;

    term_opts = util.merge_options({
      cursorBlink: true,
      local_echo: true
    }, term_opts);
    
  this.term = new Xterm.Terminal(term_opts);
  this.local_echo = term_opts.local_echo;
    this.buffer = "";
    var self = this;
    this.on_terminal('data', function(c) {
        self.push_byte(c);
        if(c == '\r') self.push_byte('\n');
    });
    this.term.open(element);
}

Terminal.prototype.on_terminal = function(event, fn)
{
    return this.term.on(event, fn);
}

Terminal.prototype.push_byte = function(data)
{
  if(this.debug) console.log("Terminal push", data, data.charCodeAt(0));
  if(data == "\x7F" || data == "\x08") {
    this.buffer = this.buffer.slice(0, this.buffer.length - 1);
  } else {
    this.buffer += data;
  }
  
  if(this.local_echo) {
    if(data == "\x7F" || data == "\x08") {
      data = "\x08 \x08";
    }
    this.write(data);
  }

  return this;
}

Terminal.prototype.read = function(amount)
{
    if(amount == null) amount = this.buffer.length;
    var r = this.buffer.substring(0, amount);
    if(this.debug) console.log("Terminal", amount, r, this.buffer);
    this.buffer = this.buffer.substring(amount);
    return r;
}

Terminal.prototype.readableLength = function()
{
    return this.buffer.length;
}

Terminal.prototype.write = function(data)
{
  if(this.debug) console.log("Terminal write:", data, data.split(''));
  this.term.write(data);
  return this;
}

Terminal.Readable = function(terminal)
{
    this.terminal = terminal;
    this.encoder = new TextEncoder();
    this.callbacks = [];

    var self = this;

  this.terminal.on_terminal('data', function(c) {
    if(c.charCodeAt(0) < 32) {
      self.on_data();
    }
  });
}

Terminal.Readable.prototype.pause = function()
{
  this.is_paused = true;
  return this;
}

Terminal.Readable.prototype.resume = function()
{
  this.is_paused = false;
  return this;
}

Terminal.Readable.prototype.on = function(event, fn)
{
  this.callbacks[event] = fn;
  if(event == 'readable') {
    if(this.debug) console.log("Terminal calling readable", this.terminal.buffer);
    fn();
  }
    return this;
}

Terminal.Readable.prototype.on_data = function()
{
  if(!this.is_paused) {
    var data = this.read();
    var cb = this.callbacks['data'];
    if(cb) cb(data);
  }
}

Terminal.Readable.prototype.read = function(amount)
{
    var line = this.terminal.read(amount);
    return this.encoder.encode(line);
}

Terminal.Readable.prototype.readableLength = function()
{
    return this.terminal.readableLength();
}


Terminal.Writable = function(terminal)
{
    this.decoder = new TextDecoder();
    this.terminal = terminal;
    this.callbacks = [];
}

Terminal.Writable.prototype.on = function(event, fn)
{
    this.callbacks[event] = fn;
    return this;
}

Terminal.Writable.prototype.write = function(data, encoding, callback)
{
  if(typeof(data) != 'string') {
    data = this.decoder.decode(data, { stream: data.length != 0 });
  }
  this.terminal.write(data);
  if(callback) setTimeout(callback, 1); // Writeables expect an async callback
  return this;
}

Terminal.Writable.prototype.end = function()
{
    this.write(""); // flush the decoder
    return this;
}

Terminal.prototype.get_readable = function()
{
    return new Terminal.Readable(this);
}

Terminal.prototype.get_input_device = function(mem_size, irq)
{
    return new InputStream(this.get_readable(), mem_size, irq);
}

Terminal.prototype.get_writable = function()
{
    return new Terminal.Writable(this);
}

Terminal.prototype.get_output_device = function(mem_size, irq)
{
    return new OutputStream(this.get_writable(), mem_size, irq);
}

Terminal.prototype.clear = function()
{
  this.term.clear();
}

if(typeof(module) != 'undefined') {
    module.exports = Terminal;
}
if(typeof(VM) != 'undefined') {
    VM.Terminal = Terminal;
}


},{"colors/safe":11,"more_util":75,"util/text_decoder":78,"util/text_encoder":79,"vm.js":80,"vm/node/devices/input_stream":99,"vm/node/devices/output_stream":100,"xterm":35}],96:[function(require,module,exports){
const Enum = require('enum.js');
const DataStruct = require('data_struct.js');
const VMJS = require('vm.js');
const RAM = require('vm/devices/ram.js');

function Timer(irq, frequency)
{
  this.name = "Timer";
    this.irq = irq;
    this.frequency = frequency;
    if(this.frequency == null) this.frequency = 1<<20;
    this.ram = new RAM(Timer.MemoryStruct.byte_size);
    this.data = Timer.MemoryStruct.proxy(this.ram.data_view());
    this.timers = new Array(4);
    this.reset();
}

Timer.Flags = new Enum([
    'NONE',
    'ZERO'
]);

Timer.TimerStruct = new DataStruct([
    [ 'flags', VM.TYPES.ULONG ],
    [ 'counter', VM.TYPES.ULONG ],
    [ 'divider', VM.TYPES.ULONG ],
    [ 'maximum', VM.TYPES.ULONG ],
]);

Timer.MemoryStruct = new DataStruct([
    [ 'last_timer', VM.TYPES.ULONG ],
    [ 'timers', 4, Timer.TimerStruct ]
]);

Timer.prototype.stop = function()
{
    for(var i = 0; i < this.timers.length; i++) {
        this.cancel_timer(i);
    }
}

Timer.prototype.reset = function()
{
    this.stop();
    for(var i = 0; i < this.timers.length; i++) {
        this.data.timers[i].flags = 0;
        this.data.timers[i].counter = 0;
        this.data.timers[i].divider = VM.TYPES.ULONG.max;
        this.data.timers[i].maximum = VM.TYPES.ULONG.max;
    }
}

Timer.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

Timer.prototype.write = function(addr, data)
{
    var n = this.ram.write(addr, data);
    this.step();
    return n;
}

Timer.prototype.tick_timers = function()
{
    for(var i = 0; i < this.timers.length; i++) {
        this.update_timer(i);
    }
}

Timer.prototype.step = function()
{
  return false;
}

Timer.prototype.update_timer = function(timer)
{
    if(timer >= 0 && timer < this.timers.length) {
        if(this.data.timers[timer].divider == VM.TYPES.ULONG.max || this.data.timers[timer].maximum == 0) {
            this.cancel_timer(timer);
        } else {
            if(this.timers[timer] && this.timers[timer][1] != this.timer_interval(timer)) {
                this.cancel_timer(timer);
            }
            
            if(this.timers[timer] == null) {
                this.start_timer(timer);
            }
        }
    }
}

Timer.prototype.cancel_timer = function(timer)
{
    if(this.timers[timer]) {
        window.clearInterval(this.timers[timer][0]);
        this.timers[timer] = null;
    }
}

Timer.timer_interval = function(freq, divider, max)
{
    return ((freq >> divider) * max); // & (VM.TYPES.ULONG.max - 1);
}

Timer.timer_max = function(freq, divider, sec)
{
    return sec / (freq >> divider);
}

Timer.prototype.timer_interval = function(timer)
{
    if(timer >= 0 && timer < this.timers.length) {
        return Timer.timer_interval(this.frequency, this.data.timers[timer].divider, this.data.timers[timer].maximum);
    } else {
        return 0;
    }
}

Timer.prototype.start_timer = function(timer)
{
    if(timer >= 0 && timer < this.timers.length) {
        if(this.timers[timer] == null) {
            var t = this.timer_interval(timer);
            var self = this;
            this.timers[timer] = [ window.setInterval(function() {
                self.tick(timer)
                self.step();
            }, t * 1000), t ];
        }
    } else {
        return false;
    }
}

Timer.prototype.tick = function(timer)
{
    if(timer >= 0 && timer < this.timers.length) {
        //console.log("Ticking " + timer);
        this.data.timers[timer].counter += 1;
        this.data.last_timer = timer;
        this.irq.trigger();
    }
}

Timer.prototype.ram_size = function()
{
    return this.ram.length;
}

if(typeof(module) != 'undefined') {
  module.exports = Timer;
}

},{"data_struct.js":67,"enum.js":68,"vm.js":80,"vm/devices/ram.js":93}],97:[function(require,module,exports){
function DispatchTable(mask, shift, ops)
{
    this.mask = mask;
    this.shift = shift;
    this.max = this.mask >> this.shift;
    this.ops = ops || {};
}

DispatchTable.UnknownKeyError = "Unknown Key";

DispatchTable.prototype.unmask_op = function(op)
{
    return (op & this.mask) >> this.shift;
}

DispatchTable.prototype.mask_op = function(op)
{
    return (op << this.shift) & this.mask;
}

DispatchTable.prototype.set = function(i, value)
{
    this.ops[i] = value;
    return this;
}

DispatchTable.prototype.get = function(op)
{
    var ins = this.ops[this.unmask_op(op)];
    if(ins) return ins;
    else throw DispatchTable.UnknownKeyError;
}

DispatchTable.prototype.find = function(op)
{
    try {
        return this.get(op);
    } catch(e) {
        if(e != DispatchTable.UnknownKeyError) throw(e);
        else return null;
    }
}

DispatchTable.prototype.has = function(op)
{
    try {
        this.get(op);
        return true;
    } catch(e) {
        return false;
    }
}

DispatchTable.prototype.keys = function()
{
    var k = [];
    for(var i in this.ops) {
        i = this.mask_op(parseInt(i));
        if(this.has(i)) k.push(i.toString());
    }
    return k;
}

DispatchTable.prototype.each = function(f)
{
    return this.each_with_index(function(F) { return function(k,v) { return F(v); } }(f));
}

DispatchTable.prototype.each_with_index = function(f)
{
    var r = [];
    for(var i in this.ops) {
        var k = this.mask_op(i);
        var o = this.get(k);
        if(o) r.push(f(k, o));
    }
    return r;
}

DispatchTable.test = function()
{
    var dt = new DispatchTable(0xFF00, 8, {
        15: 'hello',
        32: 'world'
    });
    dt.set(43, 'boo');

    assert(dt.get(15 << 8) == 'hello', "gets the correct value");
    assert(dt.get(32 << 8) == 'world', "gets the correct value");
    assert(dt.get(43 << 8) == 'boo', "gets the correct value");
    assert_throws(function() { dt.get(15); }, DispatchTable.UnknownKeyError, "throws an error for a bad opcode");
    assert_throws(function() { dt.get(31 << 8); }, DispatchTable.UnknownKeyError, "throws an error for a bad opcode");

    var values = [];
    values = dt.each_with_index(function(k, v) {
        return v;
    });
    assert(values.sort().join('') == 'boohelloworld', 'has an each_with_index with values: ' + values.sort().join(''));
    values = dt.each_with_index(function(k, v) {
        return k;
    });
    assert_equal(values.sort(), [ 15<<8, 32<<8, 43<<8 ].sort(), 'has an each_with_index with keys');
    
    var values = [];
    values = dt.each(function(v) {
        return v;
    });
    assert(values.sort().join('') == 'boohelloworld', 'has an each');
    
    return true;
}

function DispatchTableProxy(mask, shift, ops)
{
    return new Proxy(new DispatchTable(mask, shift, ops),
                     {
                         has: function(hash, prop) {
                             return hash.has(parseInt(prop));
                         },
                         ownKeys: function(hash) {
                             return hash.keys();
                         },
                         getOwnPropertyDescriptor: function(hash, prop) {
                             return { enumerable: true, configurable: true };
                         },
                         get: function(hash, prop) {
                             if(prop == 'target') return hash;
                             return hash.get(prop);
                         },
                         set: function(hash, prop, value) {
                             return hash.set(prop, value);
                         }
                     });
}

DispatchTableProxy.test = function()
{
    var  dt = DispatchTableProxy(0xF0, 4, {
        3: 1234,
        4: 4567
    });

    assert(dt[3<<4] == 1234, 'looks up array accesses');
    dt[10] = 'hello';
    assert(dt[10<<4] == 'hello', 'sets array accesses unshifted');

    var keys = [];
    for(var i in dt) {
        keys.push(i);
    }
    assert(keys[0] == 3<<4);
    assert(keys[1] == 4<<4);
    assert(keys[2] == 10<<4);

    return true;
}

if(typeof(module) != 'undefined') {
  module.exports = DispatchTable;
}

},{}],98:[function(require,module,exports){
function InterruptHandle(container, irq)
{
  this.container = container;
  this.irq = irq;
}

InterruptHandle.prototype.trigger = function()
{
  this.container.interrupt(this.irq);
  return this;
}

InterruptHandle.prototype.toInt = function()
{
  return this.irq;
}

InterruptHandle.prototype.toString = function(base)
{
  return this.irq.toString(base);
}

if(typeof(module) != 'undefined') {
  module.exports = InterruptHandle;
}

},{}],99:[function(require,module,exports){
"use strict";

const DataStruct = require('data_struct.js');
const RAM = require('vm/devices/ram.js');
const RingBuffer = require('vm/ring_buffer.js');
require('vm/types.js');

const TextEncoder = require('util/text_encoder');

function InputStream(stream, mem_size, irq)
{
  mem_size = mem_size || 1024;

  this.name = "InputStream";
  this.stream = stream;
  this.irq = irq;
  
  this.data_struct = new DataStruct([
    [ 'ready', VM.TYPES.ULONG ],
    [ 'eos', VM.TYPES.ULONG ],
    [ 'buffer', mem_size, VM.TYPES.UBYTE ],
    [ 'terminator', VM.TYPES.ULONG ] // provides a null terminator and pads reads of the last 3 bytes
  ]);
  this.ram = new RAM(this.data_struct.byte_size);
  this.data = this.data_struct.proxy(this.ram.data_view());
  this.reset();

  if(this.stream) {
    //this.stream.pause();

    var self = this;
    this.stream.on('close', function() {
      self.data.eos = 1;
      self.trigger_interrupt();
    });
  
    this.stream.on('readable', function() {
      self.data.eos = 0;
      self.trigger_interrupt();
    });

    this.stream.on('data', function(data) {
      self.read_more(data);
    });
  }
}

InputStream.prototype.trigger_interrupt = function()
{
  this.irq.trigger();
}

InputStream.prototype.encode = function(data)
{
  if(this.encoder == null) {
    this.encoder = new TextEncoder();
  }
      
  return this.encoder.encode(data, { stream: true });
}

InputStream.prototype.set_data = function(data)
{
  if(data && data.length > 0) {
    var length = data.length;
    
    if(typeof(data) == 'string') {
      var bytes = this.encode(data);
      this.data.buffer.set(bytes);
      length = bytes.length;
    } else {
      this.data.buffer.set(data);
    }    
  
    this.data.buffer.fill(0, length);
    this.data.ready = length;
    this.data.eos = 0;
  } else {
    this.data.buffer.fill(0);
    this.data.ready = 0;
  }
}

InputStream.prototype.read_more = function(data)
{
  this.stream.pause();

  if(this.debug) {
    console.log("InputStream", data && data.length, this.data.eos, this.data.ready, "Read ", data,  this.encode(data));
  }

  this.set_data(data);
  if(data == null || data.length == 0) {
    return false;
  }
  
  this.trigger_interrupt();
  return this;
}

InputStream.prototype.ram_size = function()
{
  return this.ram.length;
}

InputStream.prototype.reset = function()
{
  this.data.ready = 0;
  this.data.eos = 0;
  this.data.terminator = 0;
  this.ram.set(0, this.ram.length, 0);
}

InputStream.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

InputStream.prototype.write = function(addr, data)
{
  this.ram.write(addr, data);
  if(addr == this.data.ds.fields['ready'].offset && this.data.ready == 0) {
    this.stream.resume();
  }
}

InputStream.prototype.step = function()
{
  return false;
}

if(typeof(module) != 'undefined') {
  module.exports = InputStream;
}

},{"data_struct.js":67,"util/text_encoder":79,"vm/devices/ram.js":93,"vm/ring_buffer.js":102,"vm/types.js":104}],100:[function(require,module,exports){
(function (Buffer){
"use strict";

const Enum = require('enum.js');
const DataStruct = require('data_struct.js');
const RAM = require('vm/devices/ram.js');
require('vm/types.js');

const TextDecoder = require('util/text_decoder');

function OutputStream(stream, mem_size, irq)
{
  mem_size = mem_size || 1024;

  this.name = "OutputStream";
  this.stream = stream;
  this.irq = irq;
  
  this.data_struct = new DataStruct([
    [ 'eos', VM.TYPES.ULONG ],
    [ 'cmd', VM.TYPES.ULONG ],
    [ 'buffer', mem_size, VM.TYPES.UBYTE ],
    [ 'flush', VM.TYPES.ULONG ]
  ]);
  this.ram = new RAM(this.data_struct.byte_size);
  this.data = this.data_struct.proxy(this.ram.data_view());

  if(this.stream) {
    var self = this;
    this.stream.on('close', function() {
      self.set_eos(OutputStream.EOSStates.CLOSED);
    });
    this.stream.on('error', function() {
      self.set_eos(OutputStream.EOSStates.ERROR);
    });
    this.stream.on('drain', function() {
      self.set_eos(OutputStream.EOSStates.OK);
    });
  }
}

OutputStream.EOSStates = new Enum([
  "OK",
  "CLOSED",
  "ERROR",
  "FULL"
]);

OutputStream.prototype.trigger_interrupt = function()
{
  this.irq.trigger();
}

OutputStream.prototype.set_eos = function(state)
{
  if(this.debug) console.log("OutputStream set EOS", state);
  this.data.eos = state;
  this.trigger_interrupt();
}

OutputStream.prototype.ram_size = function()
{
  return this.ram.length;
}

OutputStream.prototype.decode = function(bytes)
{
  if(this.decoder == null) {
    this.decoder = new TextDecoder();
  }
  return this.decoder.decode(bytes, { stream: true });
}

OutputStream.prototype.flush = function()
{
  var self = this;
  var bytes = this.data.buffer.slice(0, this.data.flush);
  // node doesn't always like Uint8Array's
  if(typeof(Buffer) != 'undefined') {
    bytes = Buffer.from(bytes);
  }
  var r = this.stream.write(bytes,
                            null,
                            function() {
                              if(self.data.flush > 0) {
                                if(self.debug) console.log("OutputStream flushed", bytes);
                                self.data.eos = OutputStream.EOSStates.OK;
                                self.ram.set(0, self.ram.length, 0);
                                self.trigger_interrupt();
                              }
                            });
  if(r == false) {
    if(this.debug) console.log("OutputStream write returned false");
    this.data.eos = OutputStream.EOSStates.FULL;
    this.trigger_interrupt();
  }
}

OutputStream.prototype.read = function(addr, count, output, offset)
{
    return this.ram.read(addr, count, output, offset);
}

OutputStream.prototype.write = function(addr, data)
{
  var n = this.ram.write(addr, data);
  if(addr == this.data.ds.fields['flush'].offset && this.data.flush > 0) {
    this.flush();
  } else if(addr == this.data.ds.fields['cmd'].offset) {
    this.process_cmd();
  }

  return n;
}

OutputStream.prototype.process_cmd = function()
{
  switch(this.data.cmd) {
  case 1:
    this.stream.end();
    break;
  default:
    break;
  }

  this.data.cmd = 0;
  return this;
}

OutputStream.prototype.step = function()
{
  /*
  if(this.data.flush > 0) {
    this.flush();
  }
*/

  return false;
}

if(typeof(module) != 'undefined') {
  module.exports = OutputStream;
}

}).call(this,require("buffer").Buffer)
},{"buffer":109,"data_struct.js":67,"enum.js":68,"util/text_decoder":78,"vm/devices/ram.js":93,"vm/types.js":104}],101:[function(require,module,exports){
function RangedHashImp()
{
    this._items = [];
}

var ranged_hash_proxy = {
    get: function(hash, prop) {
        if(hash[prop]) {
            return hash[prop];
        } else {
            return hash.get(prop);
        }
    }
};

function RangedHash()
{
    var hash = new RangedHashImp();
    return new Proxy(hash, ranged_hash_proxy);
}

RangedHash.AddressUsedError = function(starting, ending) {
  this.msg = "Address ranged is already mapped";
  this.starting = starting;
  this.ending = ending;
}
RangedHash.AddressUsedError.prototype.toString = function() {
  var addr = 'null';
  if(this.starting != null) {
    addr = this.starting.toString(10) + " 0x" + this.starting.toString(16);
    if(this.ending != null) {
      addr += " to ";
      addr += this.ending.toString(10) + " 0x" + this.ending.toString(16);
    }
  }
  return this.msg + ": " + addr;
}

RangedHash.InvalidAddressError = function(addr) {
  this.msg = "Invalid address";
  this.addr = addr;
}
RangedHash.InvalidAddressError.prototype.toString = function() {
  var addr = 'null';
  if(this.addr != null) {
    addr = this.addr.toString(10) + " 0x" + this.addr.toString(16);
  }
  return this.msg + ": " + addr;
}
RangedHash.InvalidRangeError = "Invalid range";


function RangeElement(start, ending, value)
{
    if(ending <= start) {
        throw RangedHash.InvalidRangeError;
    }
    
    this.start = start;
    this.ending = ending;
    this.value = value;
    this.length = this.ending - this.start;
}

RangedHashImp.prototype.add = function(start, ending, value)
{
    try {
      var it = this.get(start);
      if(it) {
        throw new RangedHash.AddressUsedError(start, ending);
      }
    } catch(err) {
      if(err instanceof RangedHash.InvalidAddressError) {
        this._items.push(new RangeElement(start, ending, value));
      } else {
        throw(err);
      }
    }
}

RangedHashImp.prototype.remove = function(addr)
{
    var it = this.getn(addr);
    delete this._items[it];
}

RangedHashImp.prototype.getn = function(addr)
{
    for(var i in this._items) {
        var it = this._items[i];
        if(addr >= it.start && addr < it.ending) {
            return i;
        }
    }

  throw new RangedHash.InvalidAddressError(addr);
}

RangedHashImp.prototype.gete = function(addr)
{
    return this._items[this.getn(addr)];
}

RangedHashImp.prototype.get = function(addr)
{
    return this.gete(addr).value;
}

RangedHashImp.prototype.each = function(cb)
{
    for(var i in this._items) {
        cb(this._items[i], i);
    }
    return this;
}

RangedHashImp.prototype.collect = function(cb)
{
    var r = [];
    for(var i in this._items) {
        r.push(cb(this._items[i], i));
    }
    return r;
}

if(typeof(module) != 'undefined') {
  module.exports = RangedHash;
}
if(typeof(window) != 'undefined') {
  window.RangedHash = RangedHash;
}

},{}],102:[function(require,module,exports){
(function (global){
if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

const DataStruct = require('data_struct.js');

// Ring buffers https://www.snellman.net/blog/archive/2016-12-13-ring-buffers/
VM.RingBuffer = function(data_struct, buffer)
{
    if(typeof(data_struct) == 'number') {
        this.ds = VM.RingBuffer.DataStruct(data_struct, buffer);
        this.buffer = this.ds.allocate();
    } else {
        this.ds = data_struct;
        this.buffer = buffer || this.ds.allocate();
    }
}

VM.RingBuffer.DataStruct = function(size, element_type)
{
    return new DataStruct([
        [ 'read_offset', VM.TYPES.ULONG ],
        [ 'write_offset', VM.TYPES.ULONG ],
        [ 'buffer', size, element_type || VM.TYPES.ULONG ]
    ]);
}

VM.RingBuffer.prototype.length = function()
{
    var n = this.buffer.write_offset - this.buffer.read_offset;
    if(n < 0) {
        n = this.capacity() + n;
    }
    return n;
}

VM.RingBuffer.prototype.freed = function()
{
  return this.capacity() - this.length();
}

VM.RingBuffer.prototype.full = function()
{
    return this.length() == (this.buffer.buffer.length - 1);
}

VM.RingBuffer.prototype.empty = function()
{
    return this.buffer.read_offset == this.buffer.write_offset;
}

VM.RingBuffer.prototype.clear = function()
{
    this.buffer.read_offset = this.buffer.write_offset = 0;
    return this;
}

VM.RingBuffer.prototype.push = function(item)
{
    if(!this.full()) {
        if(typeof(item) == 'object') {
            this.buffer.buffer[this.buffer.write_offset].update_from(item);
        } else {
            this.buffer.buffer[this.buffer.write_offset] = item;
        }
        this.buffer.write_offset = (this.buffer.write_offset + 1) % this.buffer.buffer.length;
        return this;
    } else {
        return null;
    }
}

VM.RingBuffer.prototype.shift = function()
{
    if(!this.empty()) {
        var item = this.buffer.buffer[this.buffer.read_offset];
        this.buffer.read_offset = (this.buffer.read_offset + 1) % this.buffer.buffer.length;
        return item;
    } else {
        return null;
    }
}

VM.RingBuffer.prototype.pop = function()
{
}

VM.RingBuffer.prototype.unshift = function()
{
}

VM.RingBuffer.prototype.capacity = function()
{
    return this.buffer.buffer.length;
}

VM.RingBuffer.test_suite = function()
{
  var assert = require("asserts");
    var n = 32;
    var ds = VM.RingBuffer.DataStruct(n);
    var a = new VM.RingBuffer(ds);
    assert.equal(a.length(), 0, 'no items');
    assert.equal(a.capacity(), n, 'correct limit');
    assert.equal(a.freed(), n, 'no items, so full limit');
    assert.equal(a.full(), false, 'is empty');
    assert.equal(a.empty(), true, 'is empty');

    a.push(123);
    assert.equal(a.length(), 1, 'has an item');
    assert.equal(a.freed(), a.capacity() - 1, 'less a free slot');
    assert.equal(a.shift(), 123, 'shifts off the pushed item');
    assert.equal(a.length(), 0, 'back to empty');
    assert.equal(a.empty(), true, 'back to empty');
    assert.equal(a.freed(), n, 'no items, so full limit');

    for(var i = 0; i < (n - 1); i++) {
        assert.assert(a.push(i), 'returns null on fail ' + i);
        assert.equal(a.length(), i + 1, 'one for one increases');
    }
    assert.equal(a.full(), true, 'is full');
    assert.equal(a.push(123), null, 'adds no more');

    for(var i = 0; i < (n - 1); i++) {
        assert.equal(a.shift(), i, 'shifts off the order the were pushed');
        assert.equal(a.length(), (n - 1) - (i + 1), 'size decreases');
    }
    assert.equal(a.empty(), true, 'is empty');
    assert.equal(a.full(), false, 'not full');
    assert.equal(a.shift(), null, 'shifts null when empty');

    a.push(123).push(456);
    assert.equal(a.length(), 2, 'length matches');
    a.clear();
    assert.equal(a.empty(), true, 'now empty');
    assert.equal(a.length(), 0, 'length is 0');

    var ds = new DataStruct([
        [ 'a', VM.TYPES.ULONG ],
        [ 'b', VM.TYPES.BYTE ]
    ]);
    var b_data = VM.RingBuffer.DataStruct(4, ds);
    var b = new VM.RingBuffer(b_data)
    var x = ds.allocate().update_from({a: 123, b: 45});
    
    assert.assert(b.push(x), 'pushes structs');
    assert.equal(b.shift(), x, 'shifts structs');
    
    return a;
}

if(typeof(module) != 'undefined') {
  module.exports = VM.RingBuffer;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"asserts":66,"data_struct.js":67}],103:[function(require,module,exports){
function Worker()
{
}

function dirname(path)
{
  var parts = path.split('/');
  return parts.slice(0, parts.length - 1).join('/');
}

function pathjoin(base, name)
{
  return base + '/' + name;
}

Worker.register = function(script, location)
{
  var root = dirname(location.pathname);
  
  return navigator.serviceWorker.register(pathjoin(root, script), {
    scope: root + "/"
  }).then((reg) => {
    console.log("Worker registered");
    this.registration = reg;
  }).catch((error) => {
    console.log("Worker register error", error);
    this.error = error;
    this.registration = null;
  });
}

if(typeof(module) != 'undefined') {
  module.exports = Worker;
}
},{}],104:[function(require,module,exports){
(function (global){
"use strict";

const util = require('util.js');

if((typeof(window) != 'undefined' && !window['VM']) ||
   (typeof(global) != 'undefined' && !global['VM'])) {
    VM = {};
}

VM.Type = function(name, id, js_name, min, max)
{
    this.name = name;
    this.id = id;
    this.js_name = js_name;
    this.array = eval(this.js_name + 'Array');
    this.byte_size = this.array.BYTES_PER_ELEMENT;
    this.array_getter = "get" + this.js_name;
    this.array_setter = "set" + this.js_name;
    this.min = min;
    this.max = max;
}

VM.Type.prototype.get = function(dv, offset, endian)
{
    if(endian == null) endian = true;
    return dv[this.array_getter](offset, endian);
}

VM.Type.prototype.set = function(dv, offset, value, endian)
{
    if(endian == null) endian = true;
    return dv[this.array_setter](offset, value, true);
}

VM.Type.prototype.proxy = function(buffer, offset, length)
{
    return new this.array(buffer, offset, length);
}

VM.TYPE_SIGNED = (1<<3);
const FLOAT32_MAX = 3.402823e+38;
const FLOAT64_MAX = 3.402823e+307;

VM.TYPE_DEFS = {
    LONG: [ VM.TYPE_SIGNED | 0, 'Int32', -0x7FFFFFFF, 0x7FFFFFFF ],
    BYTE: [ VM.TYPE_SIGNED | 1, 'Int8', -0x7F, 0x7F ],
    SHORT: [ VM.TYPE_SIGNED | 2, 'Int16', -0x7FFF, 0x7FFF ],
    FLOAT: [ 4, 'Float32', -FLOAT32_MAX, FLOAT32_MAX ],
    DOUBLE: [ 5, 'Float64', -FLOAT64_MAX, FLOAT64_MAX ],
    ULONG: [ 0, 'Uint32', 0, 0xFFFFFFFF ],
    UBYTE: [ 1, 'Uint8', 0, 0xFF ],
    USHORT: [ 2, 'Uint16', 0, 0xFFFF ],
    POINTER: [ 6, 'Uint32', 0, 0xFFFFFFFF ],
};

VM.TYPES = util.map_each(VM.TYPE_DEFS, function(name, def) {
    return new VM.Type(name, def[0], def[1], def[2], def[3]);
});
for(var name in VM.TYPES) {
    var t = VM.TYPES[name];
    VM.TYPES[t.id] = t;
}

VM.TYPE_IDS = util.map_each(VM.TYPES, function(name, def) {
    return def.id;
});
VM.TYPE_IDS[VM.TYPE_IDS.FLOAT | VM.TYPE_SIGNED] = VM.TYPE_IDS.FLOAT;
VM.TYPES[VM.TYPE_IDS.FLOAT | VM.TYPE_SIGNED] = VM.TYPES.FLOAT;
VM.TYPE_IDS[VM.TYPE_IDS.DOUBLE | VM.TYPE_SIGNED] = VM.TYPE_IDS.DOUBLE;
VM.TYPES[VM.TYPE_IDS.DOUBLE | VM.TYPE_SIGNED] = VM.TYPES.DOUBLE;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util.js":77}],105:[function(require,module,exports){
require('vm.js');

function vm_generate_c_register_classes()
{
    var s = [];
    
    for(var i = 0; i < VM.CPU.REGISTERS.SP; i++) {
        var c = "RC_INT | RC_FLOAT | RC_R" + i;
        if(i % 2 == 1) {
            c = c + " | RC_INT_BSIDE"
        }
        s.push(c);
    }
    for(var i = VM.CPU.REGISTERS.SP; i < VM.CPU.REGISTER_COUNT; i++) {
        s.push("RC_R" + i);
    }
    
    return "ST_DATA const int reg_classes[NB_REGS] = {\n" + s.join(",\n") + "\n};";
}

function vm_generate_c_register_class_names()
{
    var regs = [];
    
    for(var i in VM.CPU.REGISTERS) {
        var n = VM.CPU.REGISTERS[i];
        if(!regs[n]) {
            regs[n] = i;
        }
    }

    var s = map_each_n(regs, function(r, n) {
        return "#define RC_" + r + "\t0x" + (1 << (n + 2)).toString(16);
    });
    for(var i = 0; i < VM.CPU.REGISTER_COUNT; i++) {
        s.push("#define RC_R" + i + "\t0x" + (1 << (i + 2)).toString(16));
    }
    return s.sort().join("\n");
}

function vm_generate_c_registers()
{
    var regs = [];
    
    for(var i in VM.CPU.REGISTERS) {
        var n = VM.CPU.REGISTERS[i];
        if(!regs[n]) {
            regs[n] = i;
        }
    }

    var s = map_each_n(regs, function(r, n) {
        return "#define BC_REG_" + r + "\t0x" + n.toString(16);
    });
    for(var i = 0; i < VM.CPU.REGISTER_COUNT; i++) {
        s.push("#define BC_REG_R" + i + "\t0x" + i.toString(16));
    }
    return s.sort().join("\n");
}

function each_ins(ins_list, f, acc)
{
    if(!acc) acc = [];
    if(!ins_list) ins_list = VM.CPU.INS_DISPATCH;

    var max = ins_list.max;
    for(var i = 0; i <= max; i++) {
        try {
            var inst = ins_list.get(ins_list.mask_op(i));
            if(inst.name) {
                acc.push(f(inst));
            } else if(inst.mask) {
                each_ins(inst, f, acc);
            }
        } catch(e) {
            if(e != DispatchTable.UnknownKeyError) throw(e);
        }
    }

    return acc;
}

function vm_generate_c_ops()
{
    return each_ins(VM.CPU.INS_DISPATCH, function(ins, n) {
        return "#define BC_OP_" + ins.name + "\t0x" + ins.op.toString(16);
    }).sort().join("\n");
}

function vm_generate_c_header()
{
    return [ "#ifndef BACAW_VM_H",
             "#define BACAW_VM_H",
             "",
             "#define NB_REGS\t" + VM.CPU.REGISTER_COUNT,
             "",
             vm_generate_c_registers(),
             "",
             vm_generate_c_register_class_names(),
             "",
             vm_generate_c_register_classes(),
             "",
             vm_generate_c_ops(),
             "",
             "#endif /* BACAW_VM_H_ */"
           ].join("\n");
}

},{"vm.js":80}],106:[function(require,module,exports){
const DispatchTable = require('vm/dispatch_table.js');
const util = require('util.js');
require('vm.js');

function html_append(el, o)
{
    if(typeof(o) == 'object') {
        el.appendChild(o);
    } else {
        el.innerHTML = o;
    }
}

function html_table(arr, row_headings, col_headings)
{
    var el = document.createElement("table");

    if(col_headings) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        tr.appendChild(td);
        el.appendChild(tr);

        for(var col = 0; col < col_headings.length; col++) {
            var td = document.createElement('td');
            tr.appendChild(td);
            html_append(td, col_headings[col]);
        }
    }
    
    for(var row = 0; row < arr.length; row++) {
        var data = arr[row];
        var tr = document.createElement('tr');
        el.appendChild(tr);

        if(row_headings && row_headings[row]) {
            var td = document.createElement('td');
            html_append(td, row_headings[row]);
            tr.appendChild(td);
        }
        
        for(var col = 0; col < data.length; col++) {
            var td = document.createElement('td');
            html_append(td, data[col]);
            tr.appendChild(td);
        }
    }
    
    return el;
}

function html_attr_table(o)
{
    var dl = document.createElement('table');
    
    for(var i in o) {
        var tr = document.createElement('tr');
        dl.appendChild(tr);
        
        var dt = document.createElement('th');
        dt.textContent = i;
        tr.appendChild(dt);
        var dd = document.createElement('td');
        dd.textContent = o[i];
        tr.appendChild(dd);
    }

    return dl;
}

function html_dl(o)
{
    var dl = document.createElement('dl');
    for(var key in o) {
        var dt = document.createElement('dt');
        html_append(dl, key);
        dl.appendChild(dt);
        
        var dd = document.createElement('dd');
        html_append(dd, o[key]);
        dl.appendChild(dd);
    }
    return dl;
}

function html_dl_arr(o)
{
    var dl = document.createElement('dl');
    for(var key = 0; key < o.length; key++) {
        var values = o[key];
        var dt = document.createElement('dt');
        html_append(dt, values[0]);
        dl.appendChild(dt);
        
        var dd = document.createElement('dd');
        html_append(dd, values[1]);
        dl.appendChild(dd);
    }
    return dl;
}

function build_ins_doc_def(ins)
{
    var docdiv = document.createElement('div');
    docdiv.className = 'hover doc';
    var id = 'ins-' + ((ins && ins.name) || "noname") + '-doc';
    docdiv.id = id;

    if(ins) {
        var a = document.createElement('a');
        a.name = id;
        docdiv.appendChild(a);
        
        var p = document.createElement('span');
        p.className = 'bacaw';
        p.textContent = util.map_each_n((ins.op.toString(16).padStart(2, '0').match(/../g) || []).reverse(), function(n) {
            return n;
        }).join();
        docdiv.appendChild(p);
        
        var doc_p = document.createElement('p');
        doc_p.textContent = ins.doc;
        docdiv.appendChild(doc_p);
        var args = [];
        function push_arg_mask(mask) {
            var v = mask.shiftr;
            var k = mask.mask.toString(16);
            k = k.padStart(VM.CPU.INSTRUCTION_SIZE * 2, '0');
            args.push([i, k, ">>" + v]);
        }
        for(var i in ins.arg_masks) {
            push_arg_mask(ins.arg_masks[i]);
        }

        if(ins.has_literal) {
            args.push([ "", 'data', ins.has_literal.name ]);
        }
        
        docdiv.appendChild(html_table(args));
    }
    
    return docdiv;
}

function build_ins_doc_table()
{
    var tbl = [];
    var row_headings = [];
    var col_headings = [];

    for(var col = 0; col < 16; col++) {
        var p = document.createElement('span');
        p.className = 'bacaw';
        p.textContent = col.toString(16) + "0";
        col_headings[col] = p;
    }

    for(var row = 0; row < 16; row++) {
        var p = document.createElement('span');
        p.className = 'bacaw';
        p.textContent = row.toString(16);
        row_headings[row] = p;

        tbl[row] = [];
        for(var col = 0; col < 16; col++) {
            var div = document.createElement('div');
            div.className = 'instruction';

            var ins;
            try {
                ins = VM.CPU.INS_DISPATCH.get(row);
                if(ins.constructor == DispatchTable) {
                    ins = ins.get(col << 4);
                }
            } catch(e) {
                if(e != DispatchTable.UnknownKeyError) throw(e);
                ins = null;
            }
            
            //var ins = VM.CPU.INS_INST[row | (col << 4)];
            if(ins) {
                div.onclick = function(i) { return function(ev) {
                    window.location.hash = "ins-" + i.name + "-doc";
                } }(ins);

                var ins_p = document.createElement('p');
                ins_p.className = 'name';
                ins_p.textContent = ins.name;

                if(ins.impl) {
                    ins_p.className += ' implemented';
                } else {
                    ins_p.className += ' not-implemented';
                }
                div.appendChild(ins_p);
            }
            tbl[row][col] = div;
        }
    }

    var table = html_table(tbl, row_headings, col_headings);
    return table;
}

function collect_ins(ins_list, acc)
{
    if(!acc) acc = [];
    if(!ins_list) ins_list = VM.CPU.INS_DISPATCH;

    var max = ins_list.max;
    for(var i = 0; i <= max; i++) {
        try {
            var inst = ins_list.get(ins_list.mask_op(i));
            if(inst.name) {
                acc.push([inst.name, build_ins_doc_def(inst)]);
            } else if(inst.mask) {
                collect_ins(inst, acc);
            }
        } catch(e) {
            if(e != DispatchTable.UnknownKeyError) throw(e);
        }
    }

    return acc;
}

function build_ins_list()
{
    return html_dl_arr(collect_ins(VM.CPU.INS_DISPATCH).sort(function(a, b) {
        if(a[0] < b[0]) return -1
        else if(a[0] > b[0]) return 1
        else return 0;
    }));
}

function build_ins_doc()
{
    var tbl = build_ins_doc_table();
    var list = build_ins_list();
    var div = document.createElement('div');
    div.appendChild(tbl);
    div.appendChild(list);
    return div;
}

function build_reg_doc()
{
    var div = document.createElement('div');
    var tbl = [];
    for(var i in VM.CPU.REGISTERS) {
        if(!tbl[VM.CPU.REGISTERS[i]]) {
            tbl[VM.CPU.REGISTERS[i]] = [ VM.CPU.REGISTERS[i].toString(16),
                                     i
                                   ];
        }
    }
    for(var i = 0; i < VM.CPU.REGISTER_COUNT; i++) {
        if(!tbl[i]) {
            tbl[i] = [ i.toString(16).padStart(2, '0'), "R" + i ];
        }
    }
    div.appendChild(html_table(tbl));
    return div;
}

if(typeof(module) != 'undefined') {
  module.exports = {
    build_reg_doc: build_reg_doc,
    build_ins_doc: build_ins_doc
  };
}

},{"util.js":77,"vm.js":80,"vm/dispatch_table.js":97}],107:[function(require,module,exports){
(function (global){
"use strict";

require('vm');
const Terminal = require('vm/devices/terminal');
const DevCon = require('vm/devices/console.js');
const RAM = require('vm/devices/ram.js');
const Timer = require('vm/devices/timer.js');
const RTC = require('vm/devices/rtc.js');
const KeyStore = require('vm/devices/keystore.js');
const KeyValue = require('key_value');
const VMWorker = require('vm/service_worker');



const Binaries = {
};

const BinaryURLs = [
  'north-stage0.bin',
  'north-stage1.bin',
  'north-stage0-min.bin',
  'north-stage1-min.bin'
];

const DefaultStage = 'north-stage1.bin';

function basename(path)
{
  var parts = path.split('/');
  return parts[parts.length - 1];
}

function index_init(mem_size, terminal, buttons)
{
  console.log("Initializing...");

  var run = document.getElementById(buttons.run);
  var reset = document.getElementById(buttons.reset);
  var reload = document.getElementById(buttons.reload);
  var stage_selector = document.getElementById(buttons.stage_selector);

  var worker = null;

  VMWorker.register('service_worker.js', window.location).then((reg) => {
    worker = reg;
    console.log("ServiceWorker register", reg);
  }).catch((error) => {
    console.log("ServiceWorker failed to register", error);
  });

  var term = new Terminal(document.getElementById(terminal), {
    fontFamily: '"Unscii 8", Inconsolata, Unifont, "GNU Unifont", courier-new, courier, monospace',
    fontSize: 16,
    scrollBar: false
  });

  var vm = vm_init(mem_size, term, {
    run: function(vm) {
      run.value = 'Stop';
    },
    stopped: function(vm) {
      run.value = 'Run';
    }
  });

  run.onclick = function() {
    if(vm.running) {
      vm.stop();
    } else {
      vm.run();
    }
  }

  reset.onclick = function() {
    term.clear();
    vm.reset();
  }

  reload.onclick = function() {
    var stage = Binaries[stage_selector.value];
    if(stage == null) stage = Binaries[DefaultStage];
    vm.mem.memwrite(0, stage);
  }

  stage_selector.onchange = function() {
    vm.mem.memwrite(0, Binaries[stage_selector.value]);
  }
  
  for(var url of BinaryURLs) {
    global.fetch(url).then((resp) => {
      if(resp.ok) {
        resp.arrayBuffer().then((body) => {
          var name = basename((new URL(resp.url)).pathname);
          var el = document.createElement('option');
		      el.value = name;
		      el.innerText = name;
		      stage_selector.appendChild(el);

          Binaries[name] = new Uint8Array(body);
          if(name == DefaultStage) {
	          stage_selector.value = name;
            vm.mem.memwrite(0, Binaries[name]);
          }
        });
      }
    });
  }
}

function vm_init(mem_size, terminal, callbacks)
{
  var vm = new VM.Container(callbacks);
  if(typeof(window) != 'undefined') window.vm = vm;
  
  var mem = new VM.MemoryBus();
  //var rom = new ROM(Binaries.stage0);
  //mem.map_memory(0, rom.length, rom);
  //mem.map_memory(1024*1024, mem_size, new RAM(mem_size));
  mem.map_memory(0, mem_size, new RAM(mem_size));
  vm.add_device(mem);
  
  var cpu = new VM.CPU(mem, mem_size);
  vm.add_device(cpu);
  
  var devcon = new DevCon();
  var devcon_addr = 0xF0001000;
  mem.map_memory(devcon_addr, devcon.ram_size(), devcon);
  vm.add_device(devcon);
  
  var timer_addr = 0xF0002000;
  var timer_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 2);
  var timer = new Timer(timer_irq, 1<<20);
  mem.map_memory(timer_addr, timer.ram_size(), timer);
  vm.add_device(timer);
  
  var rtc_addr = 0xF0006000;
  var rtc = new RTC();
  mem.map_memory(rtc_addr, rtc.ram_size(), rtc);
  vm.add_device(rtc);

  var local_store = new KeyValue.Storage(localStorage);
  var local_storage_addr = 0xF0007000;
  var local_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 6);
  var local_storage = new KeyStore(local_store, mem, local_storage_irq, 'LocalStorage');
  vm.mem.map_memory(local_storage_addr, local_storage.ram_size(), local_storage);
  vm.add_device(local_storage);

  var session_store = new KeyValue.Storage(sessionStorage);
  var session_storage_addr = 0xF0008000;
  var session_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 7);
  var session_storage = new KeyStore(session_store, mem, session_storage_irq, 'SessionStorage');
  vm.mem.map_memory(session_storage_addr, session_storage.ram_size(), session_storage);
  vm.add_device(session_storage);

  var db_store = new KeyValue.IDB('bacaw', (state) => { console.log('IDBStore', state); });
  var db_storage_addr = 0xF0009000;
  var db_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 8);
  var db_storage = new KeyStore(db_store, mem, db_storage_irq, 'IndexedDB Storage');
  vm.mem.map_memory(db_storage_addr, db_storage.ram_size(), db_storage);
  vm.add_device(db_storage);

  var ipfs_store = new KeyValue.IPFS(global.IPFS);
  var ipfs_storage_addr = 0xF000A000;
  var ipfs_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 9);
  var ipfs_storage = new KeyStore(ipfs_store, mem, ipfs_storage_irq, 'IPFS Storage');
  vm.mem.map_memory(ipfs_storage_addr, ipfs_storage.ram_size(), ipfs_storage);
  vm.add_device(ipfs_storage);

  var http_store = new KeyValue.HTTP(global.fetch);
  var http_storage_addr = 0xF000B000;
  var http_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 10);
  var http_storage = new KeyStore(http_store, mem, http_storage_irq, "HTTP Storage");
  vm.mem.map_memory(http_storage_addr, http_storage.ram_size(), http_storage);
  vm.add_device(http_storage);
  
  var table_store = new KeyValue.Table();
  var table_storage_addr = 0xF000C000;
  var table_storage_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 11);
  var table_storage = new KeyStore(table_store, mem, table_storage_irq, "Table Storage");
  vm.mem.map_memory(table_storage_addr, table_storage.ram_size(), table_storage);
  vm.add_device(table_storage);
  
  var input_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 4);
  var input_addr = 0xF0004000;
  var input_term = terminal.get_input_device(1024, input_irq);
  vm.mem.map_memory(input_addr, input_term.ram_size(), input_term);
  vm.add_device(input_term);

  var output_irq = vm.interrupt_handle(VM.CPU.INTERRUPTS.user + 3);
  var output_addr = 0xF0003000;
  var output_term = terminal.get_output_device(1024, output_irq);
  vm.mem.map_memory(output_addr, output_term.ram_size(), output_term);
  vm.add_device(output_term);

  vm.info = {
    devcon: {
      addr: devcon_addr
    },
    timer: {
      addr: timer_addr,
      irq: timer_irq
    },
    rtc: {
      addr: rtc_addr
    },
    input: {
      addr: input_addr, irq: input_irq
    },
    output: {
      addr: output_addr, irq: output_irq
    }
  };

  return vm;
}

if(typeof(module) != 'undefined') {
  module.exports = index_init;
}

if(typeof(window) != 'undefined') {
  window.index_init = index_init;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"key_value":69,"vm":116,"vm/devices/console.js":84,"vm/devices/keystore.js":90,"vm/devices/ram.js":93,"vm/devices/rtc.js":94,"vm/devices/terminal":95,"vm/devices/timer.js":96,"vm/service_worker":103}],108:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],109:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":108,"ieee754":110}],110:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],111:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],112:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

exports.homedir = function () {
	return '/'
};

},{}],113:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],114:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],115:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":114,"_process":113,"inherits":111}],116:[function(require,module,exports){
var indexOf = function (xs, item) {
    if (xs.indexOf) return xs.indexOf(item);
    else for (var i = 0; i < xs.length; i++) {
        if (xs[i] === item) return i;
    }
    return -1;
};
var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    if (context) {
        forEach(Object_keys(ctx), function (key) {
            context[key] = ctx[key];
        });
    }

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.isContext = function (context) {
    return context instanceof Context;
};

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};

},{}]},{},[107]);
