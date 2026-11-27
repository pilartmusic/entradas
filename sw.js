/* Pilart Music Fest 2026 · entradas digitales · service worker.
   Guarda el esqueleto (html, css, js, imágenes) y las fuentes para que las páginas abran sin señal.
   Para el esqueleto: primero la red (así una corrección llega enseguida) y, si no hay señal, lo guardado.
   NUNCA guarda respuestas del servidor de entradas (son pedidos POST a otro dominio: ni se tocan).
   Al cambiar archivos conviene subir el número de VERSION. */
var VERSION = 'pmf-entradas-v2';
var ESQUELETO = ['./', 'index.html', '404.html', 'app.css', 'config.js', 'comun.js', 'qr.js', 'entradas.js', 'puerta.js', 'puerta/', 'puerta/index.html', 'vendor/jsQR.js', 'vendor/jsQR-LICENSE.txt', 'img/logo-fest.png', 'img/logo-academy.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(ESQUELETO.map(function (u) {
      return fetch(u, { cache: 'reload', credentials: 'same-origin' }).then(function (r) { if (r && r.ok) { return c.put(u, r); } }).catch(function () { /* se guardará al usarse */ });
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { if (k.indexOf('pmf-entradas-') === 0 && k !== VERSION) { return caches.delete(k); } }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  if (url.origin === self.location.origin) {
    if (url.pathname.indexOf('/_demo/') >= 0) { return; }
    e.respondWith(new Promise(function (ok) {
      var hecho = false;
      function deCache(ultimo) {
        caches.match(req, { ignoreSearch: true }).then(function (c) {
          if (hecho) { return; }
          if (c) { hecho = true; ok(c); } else if (ultimo) { hecho = true; ok(Response.error()); }
        }, function () { if (!hecho && ultimo) { hecho = true; ok(Response.error()); } });
      }
      var reloj = setTimeout(function () { deCache(false); }, 4000);
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (r) {
        if (r && r.ok) { var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }).catch(function () { /* nada */ }); }
        if (!hecho) { hecho = true; clearTimeout(reloj); ok(r); }
      }, function () { clearTimeout(reloj); deCache(true); });
    }));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(function (c) {
      if (c) { return c; }
      return fetch(req).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) { var copia = r.clone(); caches.open(VERSION).then(function (ch) { ch.put(req, copia); }).catch(function () { /* nada */ }); }
        return r;
      });
    }));
  }
  /* Cualquier otro pedido (el servidor de entradas) pasa directo, sin guardarse. */
});
