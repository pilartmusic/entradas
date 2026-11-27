/* Pilart Music Fest 2026 · entradas digitales
   qr.js: generador de QR propio, sin dependencias.
   Modo byte (UTF-8), corrección M, versiones 1 a 10, las 8 máscaras con penalización.
   Uso: PMFQR.matriz(texto) -> {n, m} · PMFQR.canvas(texto, ladoPx) · PMFQR.dibujar(ctx, texto, x, y, lado) · PMFQR.svg(texto)
   JavaScript hasta ES2017. */
(function (raiz) {
  'use strict';

  // Por versión (corrección M): [codewords de corrección por bloque, bloques grupo 1, datos por bloque g1, bloques grupo 2, datos por bloque g2]
  var TABLA = [null,
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
  var ALINEA = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var MARGEN = 4;

  // ---- Campo de Galois GF(256), polinomio 0x11D ----
  var EXP = [], LOG = [];
  (function () {
    var x = 1, i;
    for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) { x ^= 0x11D; } }
    for (i = 255; i < 512; i++) { EXP[i] = EXP[i - 255]; }
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  function generador(grado) {
    var g = [1], i, j;
    for (i = 0; i < grado; i++) {
      var n = [];
      for (j = 0; j <= g.length; j++) { n[j] = 0; }
      for (j = 0; j < g.length; j++) {
        n[j] ^= g[j];
        n[j + 1] ^= gmul(g[j], EXP[i]);
      }
      g = n;
    }
    return g; // coeficientes de mayor a menor; g[0] = 1
  }

  function resto(datos, gen) {
    var grado = gen.length - 1, r = [], i, j;
    for (i = 0; i < grado; i++) { r[i] = 0; }
    for (i = 0; i < datos.length; i++) {
      var f = datos[i] ^ r[0];
      r.shift(); r.push(0);
      if (f !== 0) { for (j = 0; j < grado; j++) { r[j] ^= gmul(gen[j + 1], f); } }
    }
    return r;
  }

  function utf8(s) {
    var o = [], i, c;
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

  function capacidad(v) { var t = TABLA[v]; return t[1] * t[2] + t[3] * t[4]; }

  function codewords(texto) {
    var bytes = utf8(String(texto)), v, cap = 0;
    for (v = 1; v <= 10; v++) {
      cap = capacidad(v);
      var cab = 4 + (v < 10 ? 8 : 16);
      if (bytes.length * 8 + cab <= cap * 8) { break; }
    }
    if (v > 10) { throw new Error('QR: texto demasiado largo'); }
    var bits = [];
    function pon(val, n) { for (var k = n - 1; k >= 0; k--) { bits.push((val >>> k) & 1); } }
    pon(4, 4);
    pon(bytes.length, v < 10 ? 8 : 16);
    var i;
    for (i = 0; i < bytes.length; i++) { pon(bytes[i], 8); }
    var total = cap * 8;
    pon(0, Math.min(4, total - bits.length));
    while (bits.length % 8 !== 0) { bits.push(0); }
    var datos = [];
    for (i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var k = 0; k < 8; k++) { b = (b << 1) | bits[i + k]; }
      datos.push(b);
    }
    var rell = 0xEC;
    while (datos.length < cap) { datos.push(rell); rell = (rell === 0xEC) ? 0x11 : 0xEC; }

    // Bloques y corrección
    var t = TABLA[v], gen = generador(t[0]), bloques = [], ecs = [], pos = 0, g, n;
    for (g = 0; g < 2; g++) {
      var cuantos = g === 0 ? t[1] : t[3], largo = g === 0 ? t[2] : t[4];
      for (n = 0; n < cuantos; n++) {
        var bl = datos.slice(pos, pos + largo); pos += largo;
        bloques.push(bl); ecs.push(resto(bl, gen));
      }
    }
    var sal = [], maxd = Math.max(t[2], t[4]);
    for (i = 0; i < maxd; i++) { for (n = 0; n < bloques.length; n++) { if (i < bloques[n].length) { sal.push(bloques[n][i]); } } }
    for (i = 0; i < t[0]; i++) { for (n = 0; n < ecs.length; n++) { sal.push(ecs[n][i]); } }
    return { v: v, cw: sal };
  }

  function construir(texto) {
    var c = codewords(texto), v = c.v, n = v * 4 + 17, x, y, i, j;
    var m = [], f = [];
    for (y = 0; y < n; y++) { m[y] = []; f[y] = []; for (x = 0; x < n; x++) { m[y][x] = false; f[y][x] = false; } }
    function fun(px, py, oscuro) { m[py][px] = !!oscuro; f[py][px] = true; }

    // Temporización
    for (i = 0; i < n; i++) { fun(6, i, i % 2 === 0); fun(i, 6, i % 2 === 0); }
    // Buscadores con su separador
    function buscador(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) {
        for (var dx = -4; dx <= 4; dx++) {
          var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
          if (xx >= 0 && xx < n && yy >= 0 && yy < n) { fun(xx, yy, d !== 2 && d !== 4); }
        }
      }
    }
    buscador(3, 3); buscador(n - 4, 3); buscador(3, n - 4);
    // Alineación
    var al = ALINEA[v];
    for (i = 0; i < al.length; i++) {
      for (j = 0; j < al.length; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) { continue; }
        for (var dy = -2; dy <= 2; dy++) { for (var dx = -2; dx <= 2; dx++) { fun(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); } }
      }
    }
    // Formato (se reserva ahora y se escribe por máscara)
    function formato(mask) {
      var dato = (0 << 3) | mask, r = dato, k; // nivel M = 00
      for (k = 0; k < 10; k++) { r = (r << 1) ^ ((r >>> 9) * 0x537); }
      var bits = ((dato << 10) | r) ^ 0x5412;
      function bit(q) { return ((bits >>> q) & 1) !== 0; }
      for (k = 0; k <= 5; k++) { fun(8, k, bit(k)); }
      fun(8, 7, bit(6)); fun(8, 8, bit(7)); fun(7, 8, bit(8));
      for (k = 9; k < 15; k++) { fun(14 - k, 8, bit(k)); }
      for (k = 0; k < 8; k++) { fun(n - 1 - k, 8, bit(k)); }
      for (k = 8; k < 15; k++) { fun(8, n - 15 + k, bit(k)); }
      fun(8, n - 8, true);
    }
    formato(0);
    // Versión (7 en adelante)
    if (v >= 7) {
      var r = v;
      for (i = 0; i < 12; i++) { r = (r << 1) ^ ((r >>> 11) * 0x1F25); }
      var vb = (v << 12) | r;
      for (i = 0; i < 18; i++) {
        var o = ((vb >>> i) & 1) !== 0, a = n - 11 + (i % 3), b = Math.floor(i / 3);
        fun(a, b, o); fun(b, a, o);
      }
    }
    // Datos en zigzag
    var cw = c.cw, total = cw.length * 8, k = 0;
    for (var der = n - 1; der >= 1; der -= 2) {
      if (der === 6) { der = 5; }
      for (var vert = 0; vert < n; vert++) {
        for (j = 0; j < 2; j++) {
          x = der - j;
          var arriba = ((der + 1) & 2) === 0;
          y = arriba ? n - 1 - vert : vert;
          if (!f[y][x] && k < total) {
            m[y][x] = ((cw[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0;
            k++;
          }
        }
      }
    }
    // Máscaras
    function cond(mask, px, py) {
      switch (mask) {
        case 0: return (px + py) % 2 === 0;
        case 1: return py % 2 === 0;
        case 2: return px % 3 === 0;
        case 3: return (px + py) % 3 === 0;
        case 4: return (Math.floor(px / 3) + Math.floor(py / 2)) % 2 === 0;
        case 5: return (px * py) % 2 + (px * py) % 3 === 0;
        case 6: return ((px * py) % 2 + (px * py) % 3) % 2 === 0;
        default: return ((px + py) % 2 + (px * py) % 3) % 2 === 0;
      }
    }
    function aplicar(mask) {
      for (var yy = 0; yy < n; yy++) { for (var xx = 0; xx < n; xx++) { if (!f[yy][xx] && cond(mask, xx, yy)) { m[yy][xx] = !m[yy][xx]; } } }
    }
    function penal() {
      var p = 0, xx, yy, col, run, osc = 0;
      function linea(get) {
        var color = get(0), largo = 1, q, hist = '';
        for (q = 0; q < n; q++) { hist += get(q) ? '1' : '0'; }
        for (q = 1; q < n; q++) {
          if (get(q) === color) { largo++; if (largo === 5) { p += 3; } else if (largo > 5) { p++; } }
          else { color = get(q); largo = 1; }
        }
        var ix = -1;
        while ((ix = hist.indexOf('10111010000', ix + 1)) !== -1) { p += 40; }
        ix = -1;
        while ((ix = hist.indexOf('00001011101', ix + 1)) !== -1) { p += 40; }
      }
      for (yy = 0; yy < n; yy++) { linea(function (q) { return m[yy][q]; }); }
      for (xx = 0; xx < n; xx++) { linea(function (q) { return m[q][xx]; }); }
      for (yy = 0; yy < n - 1; yy++) {
        for (xx = 0; xx < n - 1; xx++) {
          col = m[yy][xx];
          if (col === m[yy][xx + 1] && col === m[yy + 1][xx] && col === m[yy + 1][xx + 1]) { p += 3; }
        }
      }
      for (yy = 0; yy < n; yy++) { for (xx = 0; xx < n; xx++) { if (m[yy][xx]) { osc++; } } }
      run = Math.floor(Math.abs(osc * 20 - n * n * 10) / (n * n));
      p += run * 10;
      return p;
    }
    var mejor = 0, minimo = Infinity, mk;
    for (mk = 0; mk < 8; mk++) {
      aplicar(mk); formato(mk);
      var pe = penal();
      if (pe < minimo) { minimo = pe; mejor = mk; }
      aplicar(mk); // deshace (XOR)
    }
    aplicar(mejor); formato(mejor);
    return { n: n, m: m, v: v, mascara: mejor };
  }

  function dibujar(ctx, texto, x, y, lado, oscuro, claro) {
    var q = construir(texto), tot = q.n + MARGEN * 2, i, j;
    ctx.fillStyle = claro || '#ffffff';
    ctx.fillRect(x, y, lado, lado);
    ctx.fillStyle = oscuro || '#000000';
    for (j = 0; j < q.n; j++) {
      for (i = 0; i < q.n; i++) {
        if (q.m[j][i]) {
          var x0 = Math.round(x + (i + MARGEN) * lado / tot), x1 = Math.round(x + (i + 1 + MARGEN) * lado / tot);
          var y0 = Math.round(y + (j + MARGEN) * lado / tot), y1 = Math.round(y + (j + 1 + MARGEN) * lado / tot);
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      }
    }
  }

  function canvas(texto, ladoCss) {
    var q = construir(texto), tot = q.n + MARGEN * 2;
    var esc = Math.max(4, Math.ceil((ladoCss || 220) * 2 / tot)); // módulos de tamaño entero: bordes nítidos
    var c = document.createElement('canvas');
    c.width = tot * esc; c.height = tot * esc;
    c.style.width = (ladoCss || 220) + 'px'; c.style.height = (ladoCss || 220) + 'px';
    c.style.imageRendering = 'pixelated';
    dibujar(c.getContext('2d'), texto, 0, 0, tot * esc);
    return c;
  }

  function svg(texto) {
    var q = construir(texto), tot = q.n + MARGEN * 2, d = '', i, j;
    for (j = 0; j < q.n; j++) { for (i = 0; i < q.n; i++) { if (q.m[j][i]) { d += 'M' + (i + MARGEN) + ' ' + (j + MARGEN) + 'h1v1h-1z'; } } }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + tot + ' ' + tot + '" shape-rendering="crispEdges"><rect width="' + tot + '" height="' + tot + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  raiz.PMFQR = { matriz: construir, dibujar: dibujar, canvas: canvas, svg: svg, MARGEN: MARGEN };
})(typeof window !== 'undefined' ? window : this);
