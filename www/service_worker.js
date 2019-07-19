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
