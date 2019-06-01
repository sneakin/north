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

VMWorker.install(self);

self.addEventListener('install', (event) => {
  console.log("Service worker installing");
  event.waitUntil(
    caches.open(Version).then((cache) => {
      return cache.addAll(manifest);
    }).catch((error) => {
      console.log("Service worker failed to cache", error, error.code, error.message, error.name);
    }));
});

self.addEventListener('activate', (event) => {
  console.log("Service worker activated");
  caches.has(OldVersion).then(() => {
    caches.delete(OldVersion).then(() => {
      console.log("Deleted old cache");
    });
  });
});

self.addEventListener('fetch', (event) => {
  console.log("Service worker fetching", event.request);
  event.respondWith(caches.match(event.request).then((response) => {
    if(response !== undefined) {
      return response;
    } else {
      return fetch(event.request).then((response) => {
        var r = response.clone();
        caches.open(Version).then((cache) => {
          cache.put(event.request, r).then(() => {
            console.log("Cached", event.request);
          }).catch((error) => {
            console.log("Failed caching", error, error.code, error.message, error.name);
          });
          return response;
        }).catch((error) => {
          console.log("Error fetching", event.request, error);
        });
        return response;
      }).catch((error) => {
        return new Response('' + error.code + ': ' + error.message, {
          status: 404,
          statusText: 'Not found'
        })
      });
    }
  }));
});

self.addEventListener('message', (event) => {
  console.log("Service worker received message", event);
});
