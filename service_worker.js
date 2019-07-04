(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
const moreutil = require('more_util');

function clear_old_cache(old_version, version)
{
  caches.has(old_version).then(() => {
    caches.delete(old_version).then(() => {
      console.log("Deleted old cache", old_version);
    });
  });
}

function cache_manifest(version, manifest)
{
  caches.open(version).then((cache) => {
    return cache.addAll(manifest);
  }).catch((error) => {
    console.log("Offline Cacher failed to cache", error, error.code, error.message, error.name);
  });
}

function cache_resource(request, response, options) {
  var r = response.clone();
  caches.open(options.version).then((cache) => {
    cache.put(request, r).then(() => {
      console.log("Cached", request);
    }).catch((error) => {
      console.log("Failed caching", error, error.code, error.message, error.name);
    });
  });
}

function fetch_from_cache(request, options)
{
  return caches.match(request).then((response) => {
    if(response !== undefined) {
      return response;
    } else {
      return options.error_page(404, 'Not found');
    }
  }).catch((error) => {
    return options.error_page(error.code, error.message);
  });
}

function fetch_first(event, options)
{
  // try the network, cache, or fail
  return event.respondWith(fetch(event.request).then((response) => {
    cache_resource(event.request, response, options);
    return response;
  }).catch((error) => {
    console.log("Offline Cacher error ", error);
    return fetch_from_cache(event.request, options);
  }));
}

function error_page(code, message)
{
  return new Response('Error: ' + code + ': ' + message, {
    status: code,
    statusText: message
  });
}

const Worker = {
  fetch_first: fetch_first,
  error_page: error_page
};

Worker.Defaults = {
  fetcher: Worker.fetch_first,
  error_page: Worker.error_page
};


Worker.install = function(self, options) {
  options = moreutil.merge_options(Worker.Defaults, options);

  if(options.manifest) {
    self.addEventListener('install', (event) => {
      console.log("Offline Cacher installing");
      event.waitUntil(cache_manifest(options.version, options.manifest));
    });
  }

  if(options.old_version) {
    self.addEventListener('activate', (event) => {
      console.log("Offline Cacher activated");
      clear_old_cache(options.old_version, options.version);
    });
  }

  if(options.fetcher) {
    self.addEventListener('fetch', (event) => {
      console.log("Offline Cacher fetching", event.request);
      return options.fetcher(event, options);
    });
  }
}

if(typeof(module) != 'undefined') {
  module.exports = Worker;
}

},{"more_util":1}],3:[function(require,module,exports){
const moreutil = require('more_util');
const Cacher = require('vm/service_worker/offline_cacher');

function Worker()
{
}

Worker.Defaults = {
  cacher: {
    fetcher: Cacher.fetch_first
  }
};

Worker.install = function(self, options) {
  options = moreutil.merge_options(Worker.Defaults, options);

  Cacher.install(self, options.cacher);

  self.addEventListener('install', (event) => {
    console.log("VM worker installing");
  });

  self.addEventListener('activate', (event) => {
    console.log("VM worker activated");
  });

  // messages?
}

if(typeof(module) != 'undefined') {
  module.exports = Worker;
}

},{"more_util":1,"vm/service_worker/offline_cacher":2}],4:[function(require,module,exports){
const VMWorker = require('vm/service_worker/worker');
const OldVersion = 'v0';
const Version = 'v1';
const manifest = [
  './index.html',
  './index.js',
  './ipfs.js',
  './index.css',
  './xterm.css',
  './unscii-8.ttf',
  './north-stage0.bin',
  './north-stage0-min.bin',
  './north-stage1.bin',
  './north-stage1-min.bin'
];

function error_page(code, message)
{
  return new Response('Error: ' + code + ': ' + message, {
    status: code,
    statusText: message
  });
}

VMWorker.install(self, {
  cacher: {
    version: Version,
    old_version: OldVersion,
    manifest: manifest,
    fetch_error: error_page
  }
});

self.addEventListener('install', (event) => {
  console.log("Service worker installing");
});

self.addEventListener('activate', (event) => {
  console.log("Service worker activated");
});

self.addEventListener('message', (event) => {
  console.log("Service worker received message", event);
});

},{"vm/service_worker/worker":3}]},{},[4]);
