/* Pilart Music Fest 2026 · entradas digitales
   comun.js: llamada a la API, SHA-256, huella, utilidades de pantalla y de guardado.
   JavaScript hasta ES2017. Ningún dato del servidor o del usuario se inserta como HTML: siempre como texto. */
(function () {
  'use strict';
  var PMF = window.PMF = window.PMF || {};
  var EV = PMF.EVENTO || {};

  // ---------- Dónde está la raíz del sitio (este archivo vive en la raíz) ----------
  var yo = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  PMF.RAIZ = yo ? yo.replace(/comun\.js(\?.*)?$/, '') : './';

  // ---------- Modo demostración: solo en localhost y solo si se pidió ----------
  var esLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var pideDemo = false;
  try { pideDemo = window.localStorage.getItem('PMF_DEMO') === '1'; } catch (e) { pideDemo = false; }
  PMF.DEMO = esLocal && pideDemo;
  var demoLista = null;
  if (PMF.DEMO) {
    demoLista = new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = PMF.RAIZ + '_demo/demo.js';
      s.onload = function () { ok(); };
      s.onerror = function () { mal(new Error('demo')); };
      document.head.appendChild(s);
    });
  }
  PMF.hayServidor = function () { return PMF.DEMO || (typeof PMF.API === 'string' && PMF.API.length > 0); };

  // ---------- SHA-256 (síncrono) ----------
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function utf8(s) {
    var o = [], i, c;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
        var d = s.charCodeAt(i + 1);
        if (d >= 0xDC00 && d <= 0xDFFF) { c = 0x10000 + ((c - 0xD800) << 10) + (d - 0xDC00); i++; }
      }
      if (c < 0x80) { o.push(c); }
      else if (c < 0x800) { o.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
      else if (c < 0x10000) { o.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
      else { o.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    return o;
  }
  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var m = bytes.slice(0), l = bytes.length * 8, i, j;
    m.push(0x80);
    while (m.length % 64 !== 56) { m.push(0); }
    var alto = Math.floor(l / 4294967296), bajo = l >>> 0;
    m.push((alto >>> 24) & 255, (alto >>> 16) & 255, (alto >>> 8) & 255, alto & 255, (bajo >>> 24) & 255, (bajo >>> 16) & 255, (bajo >>> 8) & 255, bajo & 255);
    var w = [];
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (i = 0; i < m.length; i += 64) {
      for (j = 0; j < 16; j++) { w[j] = ((m[i + j * 4] << 24) | (m[i + j * 4 + 1] << 16) | (m[i + j * 4 + 2] << 8) | m[i + j * 4 + 3]) | 0; }
      for (j = 16; j < 64; j++) {
        var s0 = rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + hh) | 0;
    }
    var o = [];
    for (i = 0; i < 8; i++) { o.push((H[i] >>> 24) & 255, (H[i] >>> 16) & 255, (H[i] >>> 8) & 255, H[i] & 255); }
    return o;
  }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64url(bytes) {
    var s = '', i;
    for (i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
      s += B64[b0 >> 2];
      s += B64[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)];
      if (b1 !== undefined) { s += B64[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)]; }
      if (b2 !== undefined) { s += B64[b2 & 63]; }
    }
    return s;
  }
  PMF.utf8 = utf8;
  PMF.sha256 = sha256;
  PMF.sha256hex = function (texto) {
    var b = sha256(utf8(texto)), s = '', i;
    for (i = 0; i < b.length; i++) { s += (b[i] < 16 ? '0' : '') + b[i].toString(16); }
    return s;
  };
  /* Huella de un código: base64url(SHA-256(código en UTF-8)), sin "=", primeros 22 caracteres. */
  PMF.huella = function (codigo) { return b64url(sha256(utf8(codigo))).substring(0, 22); };

  // ---------- Al azar ----------
  PMF.azar = function (n) {
    var a = new Uint8Array(n || 16), s = '', i;
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (i = 0; i < a.length; i++) { s += B64[a[i] & 63]; }
    return s;
  };

  // ---------- Guardado en el celular ----------
  PMF.guarda = {
    lee: function (k) { try { var v = window.localStorage.getItem(k); return v === null ? null : JSON.parse(v); } catch (e) { return null; } },
    pon: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    saca: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* nada */ } }
  };

  // ---------- Llamada al servidor ----------
  /* Devuelve una promesa con la respuesta ({ok:true,…} o {ok:false,e}). Si no hay señal o la respuesta no se entiende, la promesa falla con {red:true}. */
  PMF.api = function (pedido) {
    if (!PMF.hayServidor()) { return Promise.resolve({ ok: false, e: 'apagado' }); }
    if (PMF.DEMO) {
      return demoLista.then(function () {
        return new Promise(function (ok, mal) {
          window.setTimeout(function () {
            var corte = false;
            try { corte = window.localStorage.getItem('PMF_DEMO_SIN_SENAL') === '1'; } catch (e) { corte = false; }
            if (corte) { mal({ red: true }); return; }
            try { ok(JSON.parse(JSON.stringify(window.PMF_DEMO_API(JSON.parse(JSON.stringify(pedido)))))); }
            catch (e2) { ok({ ok: false, e: 'error' }); }
          }, 250);
        });
      }, function () { return { ok: false, e: 'apagado' }; });
    }
    return new Promise(function (ok, mal) {
      var listo = false, ctl = null, op = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(pedido), redirect: 'follow', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' };
      if (typeof window.AbortController === 'function') { ctl = new window.AbortController(); op.signal = ctl.signal; }
      var reloj = window.setTimeout(function () {
        if (listo) { return; }
        listo = true;
        if (ctl) { try { ctl.abort(); } catch (e) { /* nada */ } }
        mal({ red: true });
      }, 25000);
      window.fetch(PMF.API, op).then(function (r) { return r.text(); }).then(function (t) {
        if (listo) { return; }
        listo = true; window.clearTimeout(reloj);
        var j = null;
        try { j = JSON.parse(t); } catch (e) { j = null; }
        if (!j || typeof j !== 'object') { mal({ red: true }); return; }
        ok(j);
      }, function () {
        if (listo) { return; }
        listo = true; window.clearTimeout(reloj);
        mal({ red: true });
      });
    });
  };

  // ---------- Armado de pantallas (siempre texto, nunca HTML con datos) ----------
  function agrega(padre, hijo) {
    if (hijo === null || hijo === undefined || hijo === false) { return; }
    if (Array.isArray(hijo)) { for (var i = 0; i < hijo.length; i++) { agrega(padre, hijo[i]); } return; }
    if (typeof hijo === 'string' || typeof hijo === 'number') { padre.appendChild(document.createTextNode(String(hijo))); return; }
    padre.appendChild(hijo);
  }
  /* h(etiqueta, estilo, hijos, atributos). En atributos, "on" es {evento: función}. */
  function h(tag, estilo, hijos, attrs) {
    var e = document.createElement(tag), k;
    if (estilo) { e.setAttribute('style', estilo); }
    if (attrs) {
      for (k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) { continue; }
        if (k === 'on') { for (var ev in attrs.on) { if (Object.prototype.hasOwnProperty.call(attrs.on, ev)) { e.addEventListener(ev, attrs.on[ev]); } } }
        else if (k === 'value') { e.value = attrs[k]; }
        else if (k === 'disabled') { e.disabled = !!attrs[k]; }
        else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) { e.setAttribute(k, attrs[k] === true ? '' : String(attrs[k])); }
      }
    }
    agrega(e, hijos);
    return e;
  }
  PMF.h = h;
  PMF.agrega = agrega;
  PMF.vaciar = function (e) { while (e.firstChild) { e.removeChild(e.firstChild); } };
  /* Íconos fijos (constantes de este archivo, sin datos). */
  var ICONOS = {
    flecha: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9d2f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
    ayuda: '<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"></circle><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.6M12 17.2h.01"></path></svg>',
    tilde: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0f7a45" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
    cruz: '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#b3261e" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>'
  };
  PMF.icono = function (nombre) {
    var s = document.createElement('span');
    s.setAttribute('style', 'display:flex;flex-shrink:0');
    s.innerHTML = ICONOS[nombre] || '';
    return s;
  };

  // ---------- Formatos ----------
  PMF.n3 = function (n) { var s = String(n); while (s.length < 3) { s = '0' + s; } return s; };
  PMF.nums = function (a) { /* "N° 045 · 046 · 047" */
    if (!a || !a.length) { return ''; }
    var p = [], i; for (i = 0; i < a.length; i++) { p.push(PMF.n3(a[i])); }
    return 'N° ' + p.join(' · ');
  };
  PMF.rango = function (a) { /* "N° 051 a 054" si son seguidos */
    if (!a || !a.length) { return ''; }
    if (a.length === 1) { return 'N° ' + PMF.n3(a[0]); }
    var seg = true, i; for (i = 1; i < a.length; i++) { if (a[i] !== a[i - 1] + 1) { seg = false; } }
    return seg ? 'N° ' + PMF.n3(a[0]) + ' a ' + PMF.n3(a[a.length - 1]) : PMF.nums(a);
  };
  PMF.lista = function (a) { /* "N° 363, 364 y 365" */
    if (!a || !a.length) { return ''; }
    var p = [], i; for (i = 0; i < a.length; i++) { p.push(PMF.n3(a[i])); }
    if (p.length === 1) { return 'N° ' + p[0]; }
    return 'N° ' + p.slice(0, -1).join(', ') + ' y ' + p[p.length - 1];
  };
  PMF.pct = function (parte, total) { /* "182 de 350 (52 %)" */
    parte = Number(parte) || 0; total = Number(total) || 0;
    return parte + ' de ' + total + (total > 0 ? ' (' + Math.round(parte * 100 / total) + ' %)' : '');
  };
  PMF.miles = function (n) {
    n = Math.round(Number(n) || 0);
    var neg = n < 0, s = String(Math.abs(n)), o = '';
    while (s.length > 3) { o = '.' + s.substring(s.length - 3) + o; s = s.substring(0, s.length - 3); }
    return (neg ? '-' : '') + s + o;
  };
  PMF.pesos = function (n) { return PMF.miles(n) + ' pesos'; };
  PMF.entradas = function (n) { return n === 1 ? '1 entrada' : n + ' entradas'; };
  PMF.personas = function (n) { return n === 1 ? '1 persona' : n + ' personas'; };
  PMF.sinTildes = function (s) {
    s = String(s || '').toLowerCase();
    if (typeof s.normalize === 'function') { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    return s.replace(/\s+/g, ' ').replace(/^ | $/g, '');
  };
  PMF.horaAhora = function () { var d = new Date(), a = d.getHours(), b = d.getMinutes(); return (a < 10 ? '0' : '') + a + ':' + (b < 10 ? '0' : '') + b; };
  PMF.pon = function (plantilla, datos) {
    var s = String(plantilla), k;
    for (k in datos) { if (Object.prototype.hasOwnProperty.call(datos, k)) { s = s.split('{' + k + '}').join(String(datos[k])); } }
    return s;
  };
  /* "Familia Serra" / "familia de Juan Olivari" a partir de lo que manda el servidor. */
  PMF.familia = function (fam, mayus) { return (mayus ? 'Familia ' : 'familia ') + String(fam || ''); };
  PMF.vibrar = function (patron) { try { if (navigator.vibrate) { navigator.vibrate(patron); } } catch (e) { /* nada */ } };
  function copiaVieja(texto) {
    var t = h('textarea', 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0', null, { readonly: true });
    t.value = texto; document.body.appendChild(t);
    var bien = false;
    try { t.focus(); t.select(); t.setSelectionRange(0, texto.length); bien = document.execCommand('copy'); } catch (e) { bien = false; }
    document.body.removeChild(t);
    return bien;
  }
  PMF.copiar = function (texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiaVieja(texto); });
    }
    return Promise.resolve(copiaVieja(texto));
  };

  // ---------- Piezas compartidas ----------
  var FONDO = 'radial-gradient(ellipse 260px 300px at 0% 0%, rgba(207,25,101,0.4) 0%, rgba(207,25,101,0) 70%), radial-gradient(ellipse 260px 300px at 100% 0%, rgba(74,63,140,0.6) 0%, rgba(74,63,140,0) 70%), #150d33';
  PMF.FONDO = FONDO;
  PMF.FONDO_INV = 'radial-gradient(ellipse 300px 320px at 50% 0%, rgba(207,25,101,0.35) 0%, rgba(207,25,101,0) 70%), linear-gradient(180deg, #4a3f8c 0%, #150d33 62%)';
  PMF.pieza = {
    /* El logo del Pilart Music Fest 2026 es de colores: va sobre una placa blanca para que se lea sobre el fondo oscuro. */
    logo: function () {
      return h('div', 'align-self:center;padding:10px 20px;border-radius:18px;background:#ffffff;display:flex;align-items:center;justify-content:center', [
        h('img', 'display:block;height:104px;width:auto', null, { src: PMF.RAIZ + 'img/logo-fest.png', alt: 'Pilart Music Fest 2026', width: 700, height: 645 })
      ]);
    },
    pie: function (margen) {
      return h('div', 'margin:' + (margen || '26px') + ' 0 0;padding-top:18px;border-top:1px solid rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;gap:14px', [
        h('img', 'display:block;height:38px;width:auto', null, { src: PMF.RAIZ + 'img/logo-academy.png', alt: 'Pilart Music Academy', width: 400, height: 204 }),
        h('span', 'font-size:13px;font-weight:700', EV.redes || '')
      ]);
    },
    fecha: function (margen) {
      return h('div', 'margin:' + (margen || '16px') + ' 0 0;padding:12px 14px;border-radius:12px;background:linear-gradient(90deg, #cf1965 0%, #4a3f8c 100%);text-align:center', [
        h('p', 'margin:0;font-size:17px;font-weight:800;font-style:italic', EV.dia || ''),
        h('p', 'margin:4px 0 0;font-size:13px;font-weight:600', EV.linea || '')
      ]);
    },
    pantalla: function (fondo, color, relleno) {
      return h('div', 'box-sizing:border-box;min-height:100vh;padding:' + (relleno === undefined ? '22px 22px 30px' : relleno) + ';color:' + (color || '#ffffff') + ';background:' + (fondo || FONDO) + ';display:flex;flex-direction:column', null, { 'class': 'pantalla' });
    },
    resorte: function () { return h('div', 'flex-grow:1'); },
    aviso: function (texto) { /* aviso chico (sin señal) */
      return h('p', 'margin:12px 0 0;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.1);font-size:12px;font-weight:600;line-height:1.4;text-align:center;color:#ffffff', texto);
    }
  };
  /* Pantalla neutra: no explica nada. */
  PMF.noDisponible = function (raiz) {
    var p = PMF.pieza.pantalla();
    agrega(p, [
      PMF.pieza.logo(),
      h('div', 'flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0', [
        h('h1', 'margin:0;text-align:center;font-size:26px;line-height:1.15;font-weight:800', 'No disponible'),
        h('p', 'margin:10px 0 0;text-align:center;font-size:14px;line-height:1.5;color:#d9d2f2', 'Esta página no está disponible.')
      ]),
      PMF.pieza.pie()
    ]);
    PMF.vaciar(raiz); raiz.appendChild(p);
    document.body.style.background = '#150d33';
  };
  /* Hoja que sube desde abajo (boceto 3). Devuelve {caja, cerrar, fijar}. */
  PMF.hoja = function (alCerrar) {
    var caja = h('div', 'box-sizing:border-box;width:100%;max-width:480px;max-height:92vh;overflow:auto;padding:26px 24px;border-radius:24px 24px 0 0;background:#ffffff;color:#150d33;display:flex;flex-direction:column', [
      h('div', 'align-self:center;flex-shrink:0;width:44px;height:5px;border-radius:3px;background:#d9d6e8', null, { 'aria-hidden': 'true' })
    ], { role: 'dialog', 'aria-modal': 'true' });
    var velo = h('div', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:50;background:rgba(10,6,26,0.55);display:flex;align-items:flex-end;justify-content:center', caja);
    var abierta = true;
    function cerrar() {
      if (!abierta) { return; }
      abierta = false;
      if (velo.parentNode) { velo.parentNode.removeChild(velo); }
      if (alCerrar) { alCerrar(); }
    }
    velo.addEventListener('click', function (ev) { if (ev.target === velo && !velo.getAttribute('data-fija')) { cerrar(); } });
    document.body.appendChild(velo);
    return {
      caja: caja, velo: velo, cerrar: cerrar,
      fijar: function (si) { if (si) { velo.setAttribute('data-fija', '1'); } else { velo.removeAttribute('data-fija'); } },
      limpiar: function () { while (caja.childNodes.length > 1) { caja.removeChild(caja.lastChild); } }
    };
  };
  /* Selector de cantidad del boceto 3 (− número +). */
  PMF.contador = function (valor, min, max, alCambiar) {
    var num = h('span', 'font-size:26px;font-weight:800', String(valor));
    var est = 'width:48px;height:48px;border:0;border-radius:10px;background:#f1eef9;color:#4a3f8c;font-size:24px;font-weight:800';
    function mover(d) { var v = Math.max(min, Math.min(max, valor + d)); if (v !== valor) { valor = v; num.textContent = String(v); if (alCambiar) { alCambiar(v); } } }
    var caja = h('div', 'margin:8px 0 0;display:flex;align-items:center;justify-content:space-between;padding:8px;border:1px solid #d9d6e8;border-radius:12px', [
      h('button', est, '−', { type: 'button', 'aria-label': 'Una menos', on: { click: function () { mover(-1); } } }),
      num,
      h('button', est, '+', { type: 'button', 'aria-label': 'Una más', on: { click: function () { mover(1); } } })
    ]);
    return { caja: caja, valor: function () { return valor; } };
  };
  /* Selector de cantidad de los bocetos 7 y 11 (botones blancos y violeta). */
  PMF.contadorClaro = function (valor, min, max, alCambiar) {
    var num = h('div', 'flex-grow:1;height:56px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800', String(valor));
    function mover(d) { var v = Math.max(min, Math.min(max, valor + d)); if (v !== valor) { valor = v; num.textContent = String(v); if (alCambiar) { alCambiar(v); } } }
    var caja = h('div', 'margin:8px 0 0;display:flex;align-items:center;gap:12px', [
      h('button', 'flex-shrink:0;width:56px;height:56px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8;color:#4a3f8c;font-size:26px;font-weight:800', '−', { type: 'button', 'aria-label': 'Una menos', on: { click: function () { mover(-1); } } }),
      num,
      h('button', 'flex-shrink:0;width:56px;height:56px;border:0;border-radius:12px;background:#4a3f8c;color:#ffffff;font-size:26px;font-weight:800', '+', { type: 'button', 'aria-label': 'Una más', on: { click: function () { mover(1); } } })
    ]);
    return { caja: caja, valor: function () { return valor; } };
  };

  // ---------- Service worker (para que ande sin señal) ----------
  PMF.registrarSW = function () {
    if (!('serviceWorker' in navigator)) { return; }
    if (location.protocol !== 'https:' && !esLocal) { return; }
    try { navigator.serviceWorker.register(PMF.RAIZ + 'sw.js').then(function () { /* listo */ }, function () { /* sin service worker: igual anda con señal */ }); } catch (e) { /* nada */ }
  };
})();
