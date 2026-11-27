/* Pilart Music Fest 2026 · entradas digitales
   puerta.js: páginas del equipo (control de la puerta, invitaciones, venta en puerta).
   La clave se valida solo en el servidor y nunca se guarda: en el celular queda solo la sesión.
   En el celular del control se guarda la lista del contrato (huellas, familia, cantidades, números), la sesión y la cola de ingresos sin subir.
   JavaScript hasta ES2017. */
(function () {
  'use strict';
  var PMF = window.PMF, h = PMF.h, P = PMF.pieza, EV = PMF.EVENTO, G = PMF.guarda;
  var app = document.getElementById('app');
  var K_SES = 'pmf_s', K_LISTA = 'pmf_lista', K_COLA = 'pmf_cola', K_DISP = 'pmf_disp', K_N = 'pmf_n', K_ALERTAS = 'pmf_alertas';
  var VERDE = '#0f7a45', ROJO = '#b3261e', OSCURO = '#150d33';
  var ses = null, alSalir = null;

  function mostrar(nodo) { PMF.vaciar(app); app.appendChild(nodo); window.scrollTo(0, 0); }
  function dispositivo() { var d = G.lee(K_DISP); if (!d || typeof d !== 'string') { d = PMF.azar(16); G.pon(K_DISP, d); } return d; }
  function limpio(s, max) { return String(s || '').replace(/\s+/g, ' ').replace(/^ | $/g, '').substring(0, max || 60); }

  // ---------- Borrado de lo guardado ----------
  function borrarSesionYLista() { ses = null; G.saca(K_SES); G.saca(K_LISTA); }
  function pasoLaFecha() {
    var f = EV.borrarDespuesDe; if (!f) { return false; }
    return new Date().getTime() > new Date(f[0], f[1] - 1, f[2], 23, 59, 59).getTime();
  }
  function sesionVencida(s) {
    if (!s || !s.vence) { return false; }
    var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(String(s.vence));
    if (!m) { return false; }
    return new Date().getTime() > new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();
  }
  function detener() { if (alSalir) { try { alSalir(); } catch (e) { /* nada */ } alSalir = null; } }
  /* Respuestas que cortan todo: apagado general o sesión vencida. La cola de ingresos sin subir se conserva. */
  function corte(r) {
    if (!r || r.ok) { return false; }
    if (r.e === 'apagado') { detener(); borrarSesionYLista(); PMF.noDisponible(app); return true; }
    if (r.e === 'sesion') { detener(); borrarSesionYLista(); pantallaClave('La sesión se cerró. Poné la clave de nuevo.'); return true; }
    return false;
  }

  // ---------- Confirmación (hoja) ----------
  function confirmar(titulo, texto, boton, alAceptar) {
    var o = PMF.hoja();
    PMF.agrega(o.caja, [
      h('h2', 'margin:18px 0 0;font-size:22px;font-weight:800;color:#4a3f8c', titulo),
      h('p', 'margin:8px 0 0;font-size:14px;line-height:1.5;color:#3d3654', texto),
      h('button', 'margin:22px 0 0;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', boton, { type: 'button', on: { click: function () { o.cerrar(); alAceptar(); } } }),
      h('button', 'margin:14px 0 0;height:44px;border:0;background:transparent;color:#6b6585;font-size:14px;font-weight:600', 'Cancelar', { type: 'button', on: { click: function () { o.cerrar(); } } })
    ]);
  }

  // =====================================================================
  //  La clave
  // =====================================================================
  function pantallaClave(mensaje) {
    var rol = 'control', puesto = 1, ocupado = false;
    var p = P.pantalla();
    var ROLES = [['control', 'Control de la puerta'], ['inv', 'Invitaciones'], ['venta', 'Venta en puerta']];
    var SI = 'height:52px;border:0;border-radius:12px;background:#ffffff;color:#150d33;font-size:15px;font-weight:800';
    var NO = 'height:52px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);color:#ffffff;font-size:15px;font-weight:700';
    var CAMPO = 'margin:8px 0 0;height:52px;box-sizing:border-box;padding:0 16px;border:2px solid #4a3f8c;border-radius:12px;background:#ffffff;color:#150d33;font-size:18px;font-weight:600;width:100%';
    var ETI = 'display:block;margin:18px 0 0;font-size:13px;font-weight:700;color:#d9d2f2';
    var botonesRol = [], botonesPuesto = [], i;
    var cajaPuesto = h('div', null);
    function pintarRol() {
      for (var a = 0; a < botonesRol.length; a++) { botonesRol[a].setAttribute('style', ROLES[a][0] === rol ? SI : NO); botonesRol[a].setAttribute('aria-pressed', ROLES[a][0] === rol ? 'true' : 'false'); }
      for (var b = 0; b < botonesPuesto.length; b++) { botonesPuesto[b].setAttribute('style', (b + 1) === puesto ? SI : NO); botonesPuesto[b].setAttribute('aria-pressed', (b + 1) === puesto ? 'true' : 'false'); }
      cajaPuesto.className = rol === 'control' ? '' : 'oculto';
    }
    function botonRol(par) { return h('button', NO, par[1], { type: 'button', on: { click: function () { rol = par[0]; pintarRol(); } } }); }
    function botonPuesto(n) { return h('button', NO, 'Control ' + n, { type: 'button', on: { click: function () { puesto = n; pintarRol(); } } }); }
    for (i = 0; i < ROLES.length; i++) { botonesRol.push(botonRol(ROLES[i])); }
    botonesPuesto.push(botonPuesto(1)); botonesPuesto.push(botonPuesto(2));
    PMF.agrega(cajaPuesto, [h('p', ETI, '¿En qué control estás?'), h('div', 'margin:8px 0 0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px', botonesPuesto)]);
    var nombre = h('input', CAMPO, null, { id: 'nombre', type: 'text', maxlength: 30, autocomplete: 'off', autocapitalize: 'words' });
    var clave = h('input', CAMPO, null, { id: 'clave', type: 'password', maxlength: 60, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' });
    var aviso = h('div', 'margin:16px 0 0;padding:12px 14px;border-radius:12px;background:#cf1965;color:#ffffff;font-size:14px;font-weight:700;line-height:1.4', mensaje || '');
    aviso.className = mensaje ? '' : 'oculto';
    function decir(t) { aviso.textContent = t; aviso.className = t ? '' : 'oculto'; }
    var entrar = h('button', 'margin:22px 0 0;width:100%;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:18px;font-weight:800', 'Entrar', { type: 'submit' });
    function enviar(ev) {
      if (ev) { ev.preventDefault(); }
      if (ocupado) { return; }
      var nom = limpio(nombre.value, 30), cl = String(clave.value || '');
      if (!nom) { decir('Escribí tu nombre.'); nombre.focus(); return; }
      if (!cl) { decir('Escribí la clave.'); clave.focus(); return; }
      ocupado = true; entrar.disabled = true; entrar.textContent = 'Entrando…'; decir('');
      var pedido = { a: 'entrar', rol: rol, clave: cl, disp: dispositivo(), nombre: nom, puesto: rol === 'control' ? puesto : 0 };
      clave.value = ''; cl = '';
      function soltar() { ocupado = false; entrar.disabled = false; entrar.textContent = 'Entrar'; }
      PMF.api(pedido).then(function (r) {
        pedido.clave = '';
        soltar();
        if (r && r.ok && r.s) {
          ses = { s: r.s, rol: r.rol || rol, nombre: r.nombre || nom, puesto: r.puesto || puesto, vence: r.vence || '' };
          G.pon(K_SES, ses);
          abrirRol();
          return;
        }
        if (r && r.e === 'apagado') { borrarSesionYLista(); PMF.noDisponible(app); return; }
        if (r && r.e === 'clave') { decir('Clave incorrecta. Probá de nuevo.'); clave.focus(); return; }
        if (r && r.e === 'bloqueado') { decir('Clave bloqueada por demasiados intentos. Probá de nuevo en ' + (r.min ? (r.min === 1 ? '1 minuto' : r.min + ' minutos') : 'unos minutos') + '.'); return; }
        if (r && r.e === 'dato') { decir('Revisá el nombre y el control elegido.'); return; }
        decir('No se pudo entrar. Probá de nuevo en un momento.');
      }, function () { pedido.clave = ''; soltar(); decir('No hay señal. Para entrar con la clave hace falta internet.'); });
    }
    var form = h('form', 'display:flex;flex-direction:column', [
      h('p', ETI, '¿Qué vas a hacer?'),
      h('div', 'margin:8px 0 0;display:flex;flex-direction:column;gap:8px', botonesRol),
      h('label', ETI, 'Tu nombre', { 'for': 'nombre' }), nombre,
      cajaPuesto,
      h('label', ETI, 'Clave', { 'for': 'clave' }), clave,
      aviso,
      entrar
    ], { novalidate: true, autocomplete: 'off', on: { submit: enviar } });
    PMF.agrega(p, [
      P.logo(),
      h('h1', 'margin:20px 0 0;font-size:22px;font-weight:800', 'Acceso del equipo'),
      h('p', 'margin:6px 0 0;font-size:13px;line-height:1.45;color:#d9d2f2', 'Solo para el equipo del Pilart Music Fest.'),
      form,
      P.resorte(),
      P.pie()
    ]);
    pintarRol();
    document.body.style.background = OSCURO;
    mostrar(p);
  }

  function abrirRol() {
    detener();
    if (!ses) { pantallaClave(); return; }
    if (ses.rol === 'control') { control(); }
    else if (ses.rol === 'inv') { invitaciones(); }
    else if (ses.rol === 'venta') { venta(); }
    else { borrarSesionYLista(); pantallaClave(); }
  }
  function salir(hayCola) {
    confirmar('¿Salir?', hayCola ? 'Hay ingresos sin subir: quedan guardados en este celular y se suben cuando vuelvas a entrar con la clave.' : 'Para volver a entrar vas a necesitar la clave.', 'Sí, salir', function () {
      var s = ses ? ses.s : '';
      detener(); borrarSesionYLista();
      if (s) { PMF.api({ a: 'salir', s: s }).then(function () { /* listo */ }, function () { /* sin señal: la sesión vence sola */ }); }
      pantallaClave();
    });
  }

  // =====================================================================
  //  Control de la puerta
  // =====================================================================
  function control() {
    var L = G.lee(K_LISTA), cola = G.lee(K_COLA) || [], idx = {}, viejos = {};
    var enviando = false, fallo = false, pausado = false, vivo = true;
    var flujo = null, lector = null, leyendo = false, relojLector = null, relojSync = null, relojBarra = null, ultimoTexto = '', ultimoTs = 0;
    var lienzo = document.createElement('canvas');

    function indexar() {
      idx = {}; viejos = {};
      if (!L) { return; }
      var i;
      for (i = 0; L.q && i < L.q.length; i++) { idx[L.q[i][0]] = L.q[i]; }
      for (i = 0; L.viejos && i < L.viejos.length; i++) { viejos[L.viejos[i]] = true; }
      if (!L.ten) { L.ten = {}; } if (!L.usadas) { L.usadas = {}; } if (!L.tot) { L.tot = { ent: 0, ing: 0, inv: 0, invIng: 0 }; }
    }
    function guardar() { if (L) { G.pon(K_LISTA, L); } G.pon(K_COLA, cola); }
    function hora(ts) { var d = new Date(ts), a = d.getHours(), b = d.getMinutes(); return (a < 10 ? '0' : '') + a + ':' + (b < 10 ? '0' : '') + b; }
    /* Aplica un ingreso a la lista local. Devuelve los números que entraron. */
    function aplicar(ev) {
      if (!L) { return []; }
      var q, t, sale, c = Math.max(1, Number(ev.c) || 1);
      if (ev.k === 'E') {
        q = idx[ev.h]; if (!q) { return []; }
        t = L.ten[q[2]]; sale = [];
        if (t && t.nums) { var i = t.nums.indexOf(q[3]); if (i >= 0) { t.nums.splice(i, 1); L.tot.ing = (L.tot.ing || 0) + 1; sale = [q[3]]; } }
        if (!L.usadas[ev.h]) { L.usadas[ev.h] = { n: q[3], fam: t ? t.fam : '', hora: hora(ev.ts), ctl: ses.puesto }; }
        return sale;
      }
      if (ev.k === 'M') { t = L.ten[ev.hid]; } else { q = idx[ev.h]; t = q ? L.ten[q[2]] : null; }
      if (!t) { return []; }
      if (t.k === 'I') {
        var entra = Math.min(c, Math.max(0, (t.cant || 0) - (t.ing || 0)));
        t.ing = (t.ing || 0) + entra; L.tot.invIng = (L.tot.invIng || 0) + entra;
        return [];
      }
      sale = (t.nums || []).splice(0, c);
      L.tot.ing = (L.tot.ing || 0) + sale.length;
      return sale;
    }
    function registrar(ev, texto) {
      var n = (Number(G.lee(K_N)) || 0) + 1; G.pon(K_N, n);
      ev.id = dispositivo() + '-' + n; ev.ts = new Date().getTime();
      var nums = aplicar(ev);
      cola.push({ ev: ev, m: texto });
      guardar(); pintarBarra();
      if (navigator.onLine !== false) { sincronizar(); }
      return nums;
    }

    // ----- Sincronización -----
    function sincronizar(alTerminar) {
      if (!vivo || !ses) { return; }
      if (enviando) { if (alTerminar) { alTerminar(false); } return; }
      enviando = true;
      var lote = [], metas = {}, i;
      for (i = 0; i < cola.length && i < 150; i++) { lote.push(cola[i].ev); metas[cola[i].ev.id] = cola[i].m; }
      var pedido = (lote.length === 0 && !L) ? { a: 'lista', s: ses.s } : { a: 'sync', s: ses.s, ev: lote };
      PMF.api(pedido).then(function (r) {
        enviando = false;
        if (!vivo) { return; }
        if (r && r.ok) {
          fallo = false;
          var nueva = r.lista || (r.q ? r : null), idos = {}, alertas = [], j;
          for (j = 0; j < lote.length; j++) { idos[lote[j].id] = true; }
          for (j = 0; r.res && j < r.res.length; j++) {
            var x = r.res[j];
            if (x && (x.r === 'dup' || x.r === 'anulado' || x.r === 'parcial' || x.r === 'no')) { alertas.push(textoAlerta(x, metas[x.id])); }
          }
          cola = cola.filter(function (c) { return !idos[c.ev.id]; });
          if (nueva) {
            L = { v: nueva.v, hora: nueva.hora, tot: nueva.tot, q: nueva.q, ten: nueva.ten, usadas: nueva.usadas, viejos: nueva.viejos };
            indexar();
            for (j = 0; j < cola.length; j++) { aplicar(cola[j].ev); } /* lo que se aceptó mientras viajaba el pedido */
          }
          guardar(); pintarBarra(); pintarPie();
          if (alertas.length) { sumarAlertas(alertas); }
          if (alTerminar) { alTerminar(true); }
          if (cola.length) { window.setTimeout(function () { sincronizar(); }, 800); }
          return;
        }
        if (corte(r)) { return; }
        fallo = true; pintarBarra();
        if (alTerminar) { alTerminar(false); }
      }, function () {
        enviando = false; fallo = true;
        if (!vivo) { return; }
        pintarBarra();
        if (alTerminar) { alTerminar(false); }
      });
    }
    function textoAlerta(x, que) {
      var d = x.det || {}, cuando = (d.hora ? ' a las ' + d.hora : '') + (d.ctl ? ' por el Control ' + d.ctl : '');
      que = que || 'un ingreso';
      if (x.r === 'dup') {
        if (d.n) { return 'ATENCIÓN: la entrada N° ' + PMF.n3(d.n) + (d.fam ? ' (' + PMF.familia(d.fam) + ')' : '') + ' ya había ingresado' + cuando + '.'; }
        return 'ATENCIÓN: ' + que + ' ya había ingresado' + cuando + '.';
      }
      if (x.r === 'parcial') { return 'ATENCIÓN: con ' + que + ' ' + (x.exc === 1 ? 'entró 1 persona de más: esa entrada' : 'entraron ' + (x.exc || 'algunas') + ' personas de más: esas entradas') + ' ya había' + (x.exc === 1 ? '' : 'n') + ' ingresado por otro control.'; }
      if (x.r === 'anulado') { return 'ATENCIÓN: ese QR ya no valía (' + que + '). Las entradas se habían pasado, recuperado o devuelto.'; }
      return 'ATENCIÓN: el sistema no reconoció ' + que + '.';
    }
    function sumarAlertas(nuevas) {
      var a = G.lee(K_ALERTAS) || [];
      a = a.concat(nuevas); G.pon(K_ALERTAS, a);
      mostrarAlertas();
    }
    var capaAlerta = null;
    function mostrarAlertas() {
      var a = G.lee(K_ALERTAS) || [];
      if (capaAlerta && capaAlerta.parentNode) { capaAlerta.parentNode.removeChild(capaAlerta); }
      capaAlerta = null;
      if (!a.length) { return; }
      var items = [], i;
      for (i = 0; i < a.length; i++) { items.push(h('p', 'margin:' + (i ? '14px' : '0') + ' 0 0;font-size:20px;line-height:1.3;font-weight:800;text-align:center', a[i])); }
      capaAlerta = h('div', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:90;overflow:auto;background:' + ROJO + ';color:#ffffff;display:flex;justify-content:center', [
        h('div', 'box-sizing:border-box;width:100%;max-width:480px;min-height:100%;padding:30px 24px 26px;display:flex;flex-direction:column;align-items:center', [
          h('div', 'flex-shrink:0;width:110px;height:110px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center', PMF.icono('cruz'), { 'aria-hidden': 'true' }),
          h('p', 'margin:22px 0 0;font-size:16px;font-weight:700;letter-spacing:2px;text-align:center', a.length === 1 ? 'INGRESO PARA REVISAR' : a.length + ' INGRESOS PARA REVISAR'),
          h('div', 'margin:18px 0 0;width:100%;box-sizing:border-box;padding:18px;border-radius:14px;background:rgba(0,0,0,0.2)', items),
          h('p', 'margin:18px 0 0;font-size:14px;line-height:1.5;text-align:center;opacity:0.92', 'Este celular lo dejó pasar porque todavía no tenía la lista al día. Ya quedó anotado para revisar: avisale a quien coordina la puerta.'),
          h('div', 'flex-grow:1;min-height:20px'),
          h('button', 'flex-shrink:0;width:100%;height:60px;border:0;border-radius:14px;background:#ffffff;color:' + ROJO + ';font-size:18px;font-weight:800', 'Entendido', { type: 'button', on: { click: function () { G.saca(K_ALERTAS); mostrarAlertas(); } } })
        ])
      ], { role: 'alertdialog', 'aria-modal': 'true' });
      document.body.appendChild(capaAlerta);
      PMF.vibrar([300, 120, 300, 120, 300]);
    }

    // ----- Esqueleto -----
    var franjaT = h('span', 'font-size:14px;font-weight:800', 'Sin señal · modo sin conexión');
    var franjaS = h('span', 'font-size:12px;font-weight:600', '');
    var franja = h('div', 'padding:14px 20px;background:#cf1965;display:flex;flex-direction:column;gap:2px', [franjaT, franjaS]);
    var cuenta = h('span', 'font-size:13px;font-weight:600;text-align:right;white-space:nowrap', '');
    var barra = h('div', 'padding:16px 14px;background:rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:space-between;gap:8px', [
      h('span', 'font-size:13px;font-weight:700', 'Control ' + (ses.puesto || 1) + ' · ' + EV.corto), cuenta
    ], { 'class': 'barra-ctl' });
    var espera = h('div', 'flex-grow:1;padding:20px 20px 24px;display:flex;flex-direction:column');
    var otra = h('div', 'flex-grow:1;display:flex;flex-direction:column');
    var raiz = h('div', 'box-sizing:border-box;min-height:100vh;color:#ffffff;background:' + OSCURO + ';display:flex;flex-direction:column', [franja, barra, espera, otra]);

    function pintarBarra() {
      cuenta.textContent = L ? 'Ingresaron ' + PMF.pct(L.tot.ing, L.tot.ent) : 'Sin lista';
      var sin = fallo || navigator.onLine === false, viejo = false, ahora = new Date().getTime(), i;
      for (i = 0; i < cola.length; i++) { if (ahora - cola[i].ev.ts > 8000) { viejo = true; } }
      franja.className = (sin || viejo) ? '' : 'oculto';
      franjaT.textContent = sin ? 'Sin señal · modo sin conexión' : 'Subiendo ingresos…';
      franjaS.textContent = cola.length === 0 ? 'Los ingresos se guardan en este celular y se suben solos cuando vuelve la señal.'
        : (cola.length === 1 ? '1 ingreso guardado en este celular. Se sube solo cuando vuelve la señal.' : cola.length + ' ingresos guardados en este celular. Se suben solos cuando vuelve la señal.');
    }
    function color(c) { raiz.style.background = c; document.body.style.background = c; }
    function irEspera() {
      PMF.vaciar(otra); otra.className = 'oculto'; espera.className = '';
      color(OSCURO); pausado = false; ultimoTs = new Date().getTime(); pintarPie();
      if (video && flujo) { try { var pr = video.play(); if (pr && pr.then) { pr.then(function () { /* ok */ }, function () { /* nada */ }); } } catch (e) { /* nada */ } }
      window.scrollTo(0, 0);
    }
    function irOtra(nodo, c) {
      pausado = true;
      PMF.vaciar(otra); otra.appendChild(nodo); otra.className = ''; espera.className = 'oculto';
      color(c); window.scrollTo(0, 0);
    }

    // ----- Pantallas de resultado -----
    function cuerpoResultado(hijos) { return h('div', 'flex-grow:1;padding:30px 24px 26px;display:flex;flex-direction:column;align-items:center', hijos); }
    function circulo(icono) { return h('div', 'flex-shrink:0;width:110px;height:110px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center', PMF.icono(icono), { 'aria-hidden': 'true' }); }
    function botonProxima(c) { return h('button', 'flex-shrink:0;width:100%;height:60px;border:0;border-radius:14px;background:#ffffff;color:' + c + ';font-size:18px;font-weight:800', 'Escanear la próxima', { type: 'button', on: { click: irEspera } }); }
    function titulo2(a, b, tam) { return h('h1', 'margin:8px 0 0;text-align:center;font-size:' + (tam || 32) + 'px;line-height:1.15;font-weight:800', [a, h('br'), b]); }
    function rojo(lineaA, lineaB, filas, nota) {
      var f = [], i;
      for (i = 0; filas && i < filas.length; i++) {
        f.push(h('div', 'display:flex;justify-content:space-between;gap:12px', [h('span', 'opacity:0.85', filas[i][0]), h('strong', 'text-align:right', filas[i][1])]));
      }
      PMF.vibrar([400, 150, 400]);
      irOtra(cuerpoResultado([
        circulo('cruz'),
        h('p', 'margin:22px 0 0;font-size:16px;font-weight:700;letter-spacing:2px', 'NO VÁLIDA'),
        titulo2(lineaA, lineaB, 34),
        f.length ? h('div', 'margin:24px 0 0;width:100%;box-sizing:border-box;padding:16px 18px;border-radius:14px;background:rgba(0,0,0,0.2);display:flex;flex-direction:column;gap:8px;font-size:16px', f) : null,
        nota ? h('p', 'margin:18px 0 0;font-size:14px;line-height:1.5;text-align:center;opacity:0.92', nota) : null,
        h('div', 'flex-grow:1;min-height:20px'),
        botonProxima(ROJO)
      ]), ROJO);
    }
    function verdeListo(etiqueta, lineaA, lineaB, sub, pieTexto) {
      irOtra(cuerpoResultado([
        circulo('tilde'),
        h('p', 'margin:22px 0 0;font-size:16px;font-weight:700;letter-spacing:2px', etiqueta),
        titulo2(lineaA, lineaB),
        sub ? h('p', 'margin:14px 0 0;font-size:16px;font-weight:600;text-align:center;line-height:1.4', sub) : null,
        h('div', 'flex-grow:1;min-height:20px'),
        pieTexto ? h('p', 'margin:0 0 14px;font-size:13px;text-align:center;opacity:0.9', pieTexto) : null,
        botonProxima(VERDE)
      ]), VERDE);
    }
    /* Botones "¿Cuántos entran ahora?" de los bocetos 4, 6 y 10. */
    function botonesCuantos(disp, alto, fondoChico, estiloGrande, elegir, dos) {
      var chicos = [], i, tope = Math.min(5, disp - 1);
      function chico(n) { return h('button', 'height:' + alto + 'px;border:0;border-radius:' + (dos ? 14 : 12) + 'px;background:' + fondoChico + ';color:#ffffff;font-size:22px;font-weight:800', String(n), { type: 'button', on: { click: function () { elegir(n); } } }); }
      var grande = h('button', estiloGrande, disp === 1 ? 'Entra 1' : 'Entran los ' + disp, { type: 'button', on: { click: function () { elegir(disp); } } });
      if (dos && disp === 2) { return h('div', 'margin:12px 0 0;width:100%;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px', [chico(1), grande]); }
      for (i = 1; i <= tope; i++) { chicos.push(chico(i)); }
      return [
        chicos.length ? h('div', 'margin:12px 0 0;width:100%;display:grid;grid-template-columns:repeat(5, minmax(0, 1fr));gap:8px', chicos) : null,
        h('div', 'margin:10px 0 0;width:100%;display:flex', grande)
      ];
    }
    function linkCancelar() { return h('button', 'margin:14px 0 0;height:44px;border:0;background:transparent;color:#ffffff;font-size:14px;font-weight:700;text-decoration:underline', 'Cancelar · no entra nadie', { type: 'button', on: { click: irEspera } }); }

    function pantallaGrupo(hh, hid) {
      var t = L.ten[hid], disp = t.nums.length;
      PMF.vibrar(120);
      irOtra(cuerpoResultado([
        circulo('tilde'),
        h('p', 'margin:22px 0 0;font-size:16px;font-weight:700;letter-spacing:2px', 'ENTRADA VÁLIDA'),
        titulo2('¡Bienvenidos,', PMF.familia(t.fam) + '!'),
        h('p', 'margin:14px 0 0;font-size:16px;font-weight:600;text-align:center', 'QR de grupo · ' + (disp === 1 ? '1 entrada disponible' : disp + ' entradas disponibles')),
        h('p', 'margin:28px 0 0;font-size:15px;font-weight:700', '¿Cuántos entran ahora?'),
        botonesCuantos(disp, 56, 'rgba(255,255,255,0.18)', 'width:100%;height:64px;border:0;border-radius:14px;background:#ffffff;color:' + VERDE + ';font-size:22px;font-weight:800', function (c) {
          var nums = registrar({ k: 'G', h: hh, c: c }, 'el QR de grupo de la ' + PMF.familia(t.fam));
          PMF.vibrar(120);
          var t2 = (L && L.ten[hid]) || t, resto = t2.nums ? t2.nums.length : 0;
          verdeListo('INGRESO REGISTRADO', c === 1 ? 'Entró 1' : 'Entraron ' + c, PMF.familia(t.fam), PMF.nums(nums) + (resto ? ' · ' + (resto === 1 ? 'queda 1' : 'quedan ' + resto) + ' sin ingresar' : ' · ya ingresaron todas'));
        }),
        linkCancelar(),
        h('div', 'flex-grow:1;min-height:10px'),
        h('p', 'margin:0;font-size:13px;text-align:center;opacity:0.9', 'Si escanean una entrada individual, ingresa directo sin preguntar.')
      ]), VERDE);
    }
    function pieInvitados() {
      return h('div', 'width:100%;padding:12px 14px;box-sizing:border-box;border-radius:12px;background:rgba(0,0,0,0.18)',
        h('p', 'margin:0;font-size:13px;line-height:1.45;text-align:center', ['Invitados que ingresaron: ' + PMF.pct(L.tot.invIng, L.tot.inv), h('br'), 'Las invitaciones no participan del sorteo.']));
    }
    function pantallaInvitacion(ev, hid) {
      var t = L.ten[hid], disp = (t.cant || 0) - (t.ing || 0);
      PMF.vibrar(120);
      irOtra(cuerpoResultado([
        circulo('tilde'),
        h('div', 'margin:22px 0 0;padding:8px 16px;border-radius:999px;background:#4a3f8c;font-size:14px;font-weight:800;letter-spacing:2px', 'INVITACIÓN ESPECIAL'),
        h('h1', 'margin:14px 0 0;text-align:center;font-size:32px;line-height:1.15;font-weight:800', ['¡Te damos la bienvenida,', h('br'), (t.nom || '') + '!']),
        h('p', 'margin:14px 0 0;font-size:16px;font-weight:600;text-align:center', (t.inv || '') + ' · para ' + PMF.personas(t.cant || 1) + (t.ing ? ' · ya ingresaron ' + t.ing : '')),
        h('p', 'margin:28px 0 0;font-size:15px;font-weight:700', '¿Cuántos entran ahora?'),
        botonesCuantos(disp, 64, 'rgba(255,255,255,0.18)', 'width:100%;height:64px;border:0;border-radius:14px;background:#ffffff;color:' + VERDE + ';font-size:22px;font-weight:800', function (c) {
          ev.c = c;
          registrar(ev, 'la invitación de ' + (t.nom || ''));
          PMF.vibrar(120);
          var t2 = (L && L.ten[hid]) || t, queda = (t2.cant || 0) - (t2.ing || 0);
          verdeListo('INGRESO REGISTRADO', c === 1 ? 'Entró 1' : 'Entraron ' + c, t.nom || '', (t.inv || '') + (queda > 0 ? ' · ' + (queda === 1 ? 'queda 1 persona' : 'quedan ' + queda + ' personas') + ' sin ingresar' : ' · invitación completa'), 'Las invitaciones no participan del sorteo.');
        }, true),
        linkCancelar(),
        h('div', 'flex-grow:1;min-height:10px'),
        pieInvitados()
      ]), VERDE);
    }

    // ----- Qué hacer con un código leído -----
    function procesar(texto) {
      texto = String(texto || '').replace(/^\s+|\s+$/g, '');
      if (!L) { rojo('Falta bajar', 'la lista', null, 'Volvé y tocá «Actualizar lista» con señal. Mientras tanto no se puede validar.'); return; }
      var hh = PMF.huella(texto), u = L.usadas[hh], q = idx[hh], t;
      if (u) { rojo('Esta entrada', 'ya ingresó', [['Entrada', 'N° ' + PMF.n3(u.n)], ['Familia', u.fam || ''], ['Ingresó', (u.hora || '') + (u.ctl ? ' · Control ' + u.ctl : '')]]); return; }
      if (viejos[hh]) { rojo('Entrada pasada', 'a otro familiar', null, 'Ese QR ya no vale. Pedí que abran de nuevo el link de sus entradas: ahí están los QR nuevos.'); return; }
      if (!q) { rojo('QR no', 'reconocido', null, 'No es una entrada del Pilart Music Fest 2026, o la lista de este celular está vieja. Si hay señal, volvé y tocá «Actualizar lista».'); return; }
      t = L.ten[q[2]];
      if (!t) { rojo('QR no', 'reconocido'); return; }
      if (q[1] === 'E') {
        if (!t.nums || t.nums.indexOf(q[3]) < 0) { rojo('Esta entrada', 'ya ingresó', [['Entrada', 'N° ' + PMF.n3(q[3])], ['Familia', t.fam || ''], ['Ingresó', 'Con el QR de grupo o a mano']]); return; }
        registrar({ k: 'E', h: hh, c: 1 }, 'la entrada N° ' + PMF.n3(q[3]) + ' de la ' + PMF.familia(t.fam));
        PMF.vibrar(120);
        verdeListo('ENTRADA VÁLIDA', '¡Bienvenidos,', PMF.familia(t.fam) + '!', 'Entrada N° ' + PMF.n3(q[3]));
        return;
      }
      if (q[1] === 'G') {
        if (!t.nums || !t.nums.length) { rojo('Ya ingresaron', 'todas las entradas', [['Familia', t.fam || '']], 'Ya ingresaron todas las entradas de este QR.'); return; }
        pantallaGrupo(hh, q[2]); return;
      }
      if (q[1] === 'I') {
        if ((t.cant || 0) - (t.ing || 0) <= 0) { rojo('Esta invitación', 'ya ingresó', [['Invitación', t.inv || ''], ['A nombre de', t.nom || ''], ['Personas', String(t.cant || 0)]]); return; }
        pantallaInvitacion({ k: 'I', h: hh, c: 1 }, q[2]); return;
      }
      rojo('QR no', 'reconocido');
    }

    // ----- 6 · Ingreso manual por familia -----
    function manual() {
      var elegido = null;
      var buscar = h('input', 'margin:8px 0 0;height:52px;box-sizing:border-box;padding:0 16px;border:2px solid #4a3f8c;border-radius:12px;background:#ffffff;color:#150d33;font-size:18px;font-weight:600;width:100%', null, { id: 'buscar', type: 'search', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', placeholder: 'Apellido o nombre' });
      var resultados = h('div', null);
      function nombreDe(t) {
        if (t.k === 'I') { return t.nom || 'Invitación'; }
        return PMF.familia(t.fam, true) + (t.k === 'R' && t.para ? ' · ' + t.para : '');
      }
      function dispDe(t) { return t.k === 'I' ? Math.max(0, (t.cant || 0) - (t.ing || 0)) : (t.nums ? t.nums.length : 0); }
      function detalleDe(t) {
        var d = dispDe(t);
        if (t.k === 'I') { return 'Invitación ' + (t.inv || '') + ' · ' + (d === 0 ? 'ya ingresó' : (d === 1 ? '1 persona sin ingresar' : d + ' personas sin ingresar')); }
        var s = d === 0 ? 'Ya ingresaron todas' : (d === 1 ? '1 entrada disponible' : d + ' entradas disponibles');
        if (t.k === 'F' && t.pas) { s += ' · ' + t.pas + (t.pas === 1 ? ' pasada' : ' pasadas') + ' a otro familiar'; }
        if (t.k === 'R') { s += ' · recibidas de la ' + PMF.familia(t.fam); }
        return s;
      }
      function pintarRes() {
        PMF.vaciar(resultados);
        var txt = PMF.sinTildes(buscar.value), hallados = [], k, t;
        if (txt.length < 2) { resultados.appendChild(h('p', 'margin:16px 0 0;font-size:13px;color:#d9d2f2', 'Escribí al menos 2 letras del apellido de la familia, de quien recibió las entradas o del invitado.')); return; }
        for (k in L.ten) {
          if (!Object.prototype.hasOwnProperty.call(L.ten, k)) { continue; }
          t = L.ten[k];
          if (PMF.sinTildes([t.fam, t.para, t.nom, t.inv].join(' ')).indexOf(txt) >= 0) { hallados.push({ hid: k, t: t }); }
        }
        hallados.sort(function (a, b) { var x = PMF.sinTildes(nombreDe(a.t)), y = PMF.sinTildes(nombreDe(b.t)); return x < y ? -1 : (x > y ? 1 : 0); });
        if (!hallados.length) { resultados.appendChild(h('p', 'margin:16px 0 0;font-size:14px;font-weight:700', 'No hay ninguna familia con ese nombre.')); return; }
        if (!elegido || !hallados.some(function (x) { return x.hid === elegido; })) { elegido = hallados[0].hid; }
        hallados.slice(0, 12).forEach(function (x) {
          var d = dispDe(x.t), rango = x.t.k === 'I' ? '' : PMF.rango(x.t.nums || []);
          if (x.hid === elegido && d > 0) {
            resultados.appendChild(h('div', 'margin:16px 0 0;padding:16px;border-radius:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16)', [
              h('div', 'display:flex;align-items:baseline;justify-content:space-between;gap:10px', [h('strong', 'font-size:20px', nombreDe(x.t)), h('span', 'font-size:13px;color:#d9d2f2;white-space:nowrap', rango)]),
              h('p', 'margin:4px 0 0;font-size:14px;color:#d9d2f2', detalleDe(x.t)),
              h('p', 'margin:14px 0 0;font-size:14px;font-weight:700', '¿Cuántos entran ahora?'),
              botonesCuantos(d, 50, 'rgba(255,255,255,0.14)', 'width:100%;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:18px;font-weight:800', function (c) {
                var nums = registrar({ k: 'M', hid: x.hid, c: c }, 'el ingreso manual de ' + (x.t.k === 'I' ? 'la invitación de ' + (x.t.nom || '') : 'la ' + PMF.familia(x.t.fam)));
                PMF.vibrar(120);
                var queda = dispDe((L && L.ten[x.hid]) || x.t);
                verdeListo('INGRESO MANUAL REGISTRADO', c === 1 ? 'Entró 1' : 'Entraron ' + c, nombreDe(x.t), (nums.length ? PMF.nums(nums) + ' · ' : '') + (queda ? (queda === 1 ? 'queda 1' : 'quedan ' + queda) + ' sin ingresar' : 'ya ingresaron todos'));
              })
            ]));
          } else {
            resultados.appendChild(h('button', 'margin:10px 0 0;padding:14px 16px;border:0;border-radius:14px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;text-align:left;color:#ffffff' + (d === 0 ? ';opacity:0.55' : ''), [
              h('div', null, [h('strong', 'font-size:17px', nombreDe(x.t)), h('p', 'margin:2px 0 0;font-size:13px;color:#d9d2f2', detalleDe(x.t) + (rango && d ? ' · ' + rango : ''))]),
              d > 0 ? h('span', 'font-size:13px;font-weight:700;color:#d9d2f2', 'Elegir') : null
            ], { type: 'button', disabled: d === 0, on: { click: function () { elegido = x.hid; pintarRes(); } } }));
          }
        });
        if (hallados.length > 12) { resultados.appendChild(h('p', 'margin:12px 0 0;font-size:12px;color:#d9d2f2', 'Hay más resultados: escribí más letras.')); }
      }
      buscar.addEventListener('input', function () { elegido = null; pintarRes(); });
      irOtra(h('div', 'padding:20px 20px 24px;display:flex;flex-direction:column;flex-grow:1', [
        h('h1', 'margin:0;font-size:22px;font-weight:800', 'Ingreso por familia'),
        h('p', 'margin:6px 0 0;font-size:13px;line-height:1.45;color:#d9d2f2', 'Para cuando la familia no puede mostrar el QR (sin batería, sin señal) o el QR no se lee.'),
        h('label', 'margin:18px 0 0;font-size:13px;font-weight:700;color:#d9d2f2', 'Buscar familia', { 'for': 'buscar' }),
        buscar,
        resultados,
        h('div', 'flex-grow:1;min-height:20px'),
        h('p', 'margin:0;font-size:12px;line-height:1.45;text-align:center;color:#d9d2f2', 'El ingreso manual queda registrado como «manual», con la hora y el control.'),
        h('button', 'margin:12px 0 0;width:100%;height:54px;border-radius:12px;border:2px solid #ffffff;background:transparent;color:#ffffff;font-size:16px;font-weight:800', 'Volver al escáner', { type: 'button', on: { click: irEspera } })
      ]), OSCURO);
      pintarRes();
      try { buscar.focus(); } catch (e) { /* nada */ }
    }

    // ----- Pantalla de espera con la cámara -----
    var video = h('video', 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover', null, { playsinline: true, muted: true, autoplay: true });
    video.muted = true;
    var avisoCam = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;background:#0e0824');
    var avisoCamT = h('p', 'margin:0;font-size:14px;font-weight:700;line-height:1.45', 'Abriendo la cámara…');
    var avisoCamB = h('button', 'height:44px;padding:0 18px;border:0;border-radius:10px;background:rgba(255,255,255,0.14);color:#ffffff;font-size:14px;font-weight:800', 'Probar la cámara de nuevo', { type: 'button', on: { click: function () { abrirCamara(); } } });
    avisoCamB.className = 'oculto';
    PMF.agrega(avisoCam, [avisoCamT, avisoCamB]);
    function esquina(pos) { return h('div', 'position:absolute;width:34px;height:34px;border:4px solid #ffffff;' + pos, null, { 'aria-hidden': 'true' }); }
    var visor = h('div', 'position:relative;width:100%;height:300px;border-radius:18px;overflow:hidden;background:#000000;border:2px solid #4a3f8c;box-sizing:border-box', [
      video,
      esquina('left:22%;top:16%;border-right:0;border-bottom:0;border-radius:10px 0 0 0'), esquina('right:22%;top:16%;border-left:0;border-bottom:0;border-radius:0 10px 0 0'),
      esquina('left:22%;bottom:16%;border-right:0;border-top:0;border-radius:0 0 0 10px'), esquina('right:22%;bottom:16%;border-left:0;border-top:0;border-radius:0 0 10px 0'),
      avisoCam
    ]);
    var campoCodigo = h('input', 'flex-grow:1;min-width:0;height:46px;box-sizing:border-box;padding:0 12px;border:2px solid #4a3f8c;border-radius:10px;background:#ffffff;color:#150d33;font-size:15px;font-weight:600', null, { type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Código de la entrada' });
    var cajaCodigo = h('div', 'margin:8px 0 0;display:flex;gap:8px', [campoCodigo, h('button', 'flex-shrink:0;height:46px;padding:0 16px;border:0;border-radius:10px;background:#4a3f8c;color:#ffffff;font-size:14px;font-weight:800', 'Validar', { type: 'button', on: { click: function () { var v = campoCodigo.value; if (String(v).replace(/\s/g, '')) { campoCodigo.value = ''; procesar(v); } } } })]);
    cajaCodigo.className = 'oculto';
    var pieLista = h('p', 'margin:14px 0 0;font-size:12px;line-height:1.5;text-align:center;color:#d9d2f2', '');
    var bActualizar = h('button', 'height:50px;border:0;border-radius:12px;background:rgba(255,255,255,0.14);color:#ffffff;font-size:15px;font-weight:700', 'Actualizar lista', { type: 'button' });
    function pintarPie() {
      PMF.vaciar(pieLista);
      if (!L) { pieLista.appendChild(document.createTextNode('Todavía no se bajó la lista en este celular. Con señal, tocá «Actualizar lista».')); return; }
      PMF.agrega(pieLista, ['Lista actualizada a las ' + (L.hora || '—') + ' · ' + PMF.entradas(L.tot.ent || 0), h('br'), 'Invitados que ingresaron: ' + PMF.pct(L.tot.invIng, L.tot.inv)]);
    }
    bActualizar.addEventListener('click', function () {
      bActualizar.disabled = true; bActualizar.textContent = 'Actualizando…';
      sincronizar(function (bien) {
        bActualizar.disabled = false;
        bActualizar.textContent = bien ? 'Lista actualizada' : 'Sin señal: no se pudo';
        window.setTimeout(function () { bActualizar.textContent = 'Actualizar lista'; }, 2500);
      });
    });
    function borrarLista() {
      function borrar() { L = null; cola = []; G.saca(K_LISTA); G.saca(K_COLA); G.saca(K_ALERTAS); indexar(); pintarBarra(); pintarPie(); }
      function preguntar() {
        if (cola.length) {
          confirmar('Hay ingresos sin subir', (cola.length === 1 ? 'Hay 1 ingreso guardado' : 'Hay ' + cola.length + ' ingresos guardados') + ' en este celular que todavía no se subieron. Si borrás ahora, se pierden. Lo mejor es esperar a tener señal.', 'Borrar igual', function () {
            confirmar('¿Seguro?', 'Se van a perder ' + (cola.length === 1 ? 'el ingreso' : 'los ' + cola.length + ' ingresos') + ' sin subir. No se puede deshacer.', 'Sí, borrar todo', borrar);
          });
        } else {
          confirmar('¿Borrar la lista de este celular?', 'Se borra la lista guardada. Para volver a controlar hay que tocar «Actualizar lista» con señal.', 'Sí, borrar', borrar);
        }
      }
      if (cola.length && navigator.onLine !== false) { sincronizar(function () { preguntar(); }); } else { preguntar(); }
    }
    PMF.agrega(espera, [
      visor,
      h('p', 'margin:12px 0 0;font-size:15px;font-weight:700;text-align:center', 'Apuntá la cámara al QR de la entrada'),
      h('button', 'margin:2px 0 0;align-self:center;height:36px;border:0;background:transparent;color:#d9d2f2;font-size:12px;font-weight:600;text-decoration:underline', 'Pegar o escribir el código', { type: 'button', on: { click: function () { cajaCodigo.className = cajaCodigo.className ? '' : 'oculto'; if (!cajaCodigo.className) { campoCodigo.focus(); } } } }),
      cajaCodigo,
      h('button', 'margin:10px 0 0;width:100%;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:18px;font-weight:800', 'Ingreso por familia', { type: 'button', on: { click: function () { if (L) { manual(); } else { rojo('Falta bajar', 'la lista', null, 'Volvé y tocá «Actualizar lista» con señal.'); } } } }),
      h('div', 'margin:10px 0 0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px', [
        bActualizar,
        h('button', 'height:50px;border-radius:12px;background:transparent;border:1px solid rgba(255,255,255,0.3);color:#ffffff;font-size:15px;font-weight:700', 'Salir', { type: 'button', on: { click: function () { salir(cola.length > 0); } } })
      ]),
      pieLista,
      h('div', 'flex-grow:1;min-height:16px'),
      h('button', 'align-self:center;height:40px;border:0;background:transparent;color:#d9d2f2;font-size:13px;font-weight:600;text-decoration:underline', 'Borrar la lista de este celular', { type: 'button', on: { click: borrarLista } })
    ]);

    // ----- Cámara y lectura -----
    function decirCam(t, conBoton) { avisoCamT.textContent = t; avisoCam.className = t ? '' : 'oculto'; avisoCamB.className = conBoton ? '' : 'oculto'; }
    function prepararLector(alListo) {
      function conJs() {
        if (typeof window.jsQR === 'function') { lector = { tipo: 'js' }; } else { lector = null; }
        alListo();
      }
      if ('BarcodeDetector' in window && window.BarcodeDetector.getSupportedFormats) {
        try {
          window.BarcodeDetector.getSupportedFormats().then(function (f) {
            if (f && f.indexOf('qr_code') >= 0) { lector = { tipo: 'bd', d: new window.BarcodeDetector({ formats: ['qr_code'] }) }; alListo(); } else { conJs(); }
          }, conJs);
        } catch (e) { conJs(); }
      } else { conJs(); }
    }
    function abrirCamara() {
      if (!vivo) { return; }
      if (!lector) { decirCam('Este celular no puede leer el QR desde la página. Usá «Ingreso por familia».', false); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { decirCam('Este navegador no deja usar la cámara. Usá «Ingreso por familia».', false); return; }
      decirCam('Abriendo la cámara…', false);
      navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } }).then(function (s) {
        if (!vivo) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        flujo = s; video.srcObject = s;
        var pr = video.play();
        if (pr && pr.then) { pr.then(function () { /* ok */ }, function () { /* nada */ }); }
        decirCam('', false);
      }, function () {
        decirCam('No se pudo abrir la cámara. Revisá que el navegador tenga permiso para usarla, o usá «Ingreso por familia».', true);
      });
    }
    function tic() {
      if (!vivo || pausado || leyendo || !lector || !flujo || video.readyState < 2 || capaAlerta) { return; }
      if (lector.tipo === 'bd') {
        leyendo = true;
        lector.d.detect(video).then(function (c) { leyendo = false; if (c && c.length && c[0].rawValue && !pausado) { leido(c[0].rawValue); } }, function () { leyendo = false; });
        return;
      }
      var vw = video.videoWidth, vh = video.videoHeight;
      if (!vw || !vh) { return; }
      var esc = Math.min(1, 640 / Math.max(vw, vh)), w = Math.round(vw * esc), hh = Math.round(vh * esc);
      lienzo.width = w; lienzo.height = hh;
      var ctx = lienzo.getContext('2d');
      try {
        ctx.drawImage(video, 0, 0, w, hh);
        var im = ctx.getImageData(0, 0, w, hh), r = window.jsQR(im.data, w, hh, { inversionAttempts: 'dontInvert' });
        if (r && r.data) { leido(r.data); }
      } catch (e) { /* cuadro que no se pudo leer */ }
    }
    /* El mismo QR que se acaba de leer se ignora 3 segundos al volver al escáner: si no, la cámara lo vuelve a tomar y sale "ya ingresó". */
    function leido(texto) {
      if (pausado) { return; }
      if (texto === ultimoTexto && new Date().getTime() - ultimoTs < 3000) { return; }
      pausado = true; ultimoTexto = texto; procesar(texto);
    }

    // ----- En marcha -----
    function alVolverSenal() { fallo = false; pintarBarra(); sincronizar(); }
    function alPerderSenal() { pintarBarra(); }
    function alVer() { if (document.visibilityState === 'visible' && vivo) { sincronizar(); if (flujo && !pausado) { try { video.play(); } catch (e) { /* nada */ } } } }
    alSalir = function () {
      vivo = false;
      window.clearInterval(relojLector); window.clearInterval(relojSync); window.clearInterval(relojBarra);
      window.removeEventListener('online', alVolverSenal); window.removeEventListener('offline', alPerderSenal);
      document.removeEventListener('visibilitychange', alVer);
      if (flujo) { flujo.getTracks().forEach(function (t) { t.stop(); }); flujo = null; }
      if (capaAlerta && capaAlerta.parentNode) { capaAlerta.parentNode.removeChild(capaAlerta); }
    };
    indexar();
    otra.className = 'oculto';
    mostrar(raiz); color(OSCURO);
    pintarBarra(); pintarPie(); mostrarAlertas();
    prepararLector(abrirCamara);
    relojLector = window.setInterval(tic, 180);
    relojSync = window.setInterval(function () { sincronizar(); }, Math.max(15, Number(PMF.REFRESCO_SEG) || 60) * 1000);
    relojBarra = window.setInterval(pintarBarra, 3000);
    window.addEventListener('online', alVolverSenal); window.addEventListener('offline', alPerderSenal);
    document.addEventListener('visibilitychange', alVer);
    sincronizar();
  }

  // =====================================================================
  //  Piezas de las pantallas claras (invitaciones y venta)
  // =====================================================================
  var ETIQ = 'margin:18px 0 0;font-size:13px;font-weight:700;letter-spacing:1px;color:#4a3f8c';
  var CAMPO_CLARO = 'margin:8px 0 0;height:52px;box-sizing:border-box;padding:0 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8;font-size:16px;font-weight:600;color:#150d33;width:100%';
  function pantallaClara(izq, der, hijos) {
    var derecha = h('span', 'font-size:13px;font-weight:600;text-align:right', der);
    var cuerpo = h('div', 'flex-grow:1;padding:22px 20px 24px;display:flex;flex-direction:column', hijos);
    var raiz = h('div', 'box-sizing:border-box;min-height:100vh;color:#150d33;background:#f1eef9;display:flex;flex-direction:column', [
      h('div', 'padding:16px 20px;background:#4a3f8c;color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:10px', [h('span', 'font-size:13px;font-weight:700', izq), derecha]),
      cuerpo
    ]);
    document.body.style.background = '#f1eef9';
    return { raiz: raiz, cuerpo: cuerpo, derecha: derecha };
  }
  function avisoClaro() {
    var a = h('p', 'margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#fdf2f7;border-left:4px solid #cf1965;font-size:13px;font-weight:700;line-height:1.45;color:#3d3654', '');
    a.className = 'oculto';
    return { nodo: a, decir: function (t) { a.textContent = t || ''; a.className = t ? '' : 'oculto'; } };
  }
  function botonSalirClaro() { return h('button', 'margin:18px 0 0;align-self:center;height:40px;border:0;background:transparent;color:#5b5470;font-size:13px;font-weight:700;text-decoration:underline', 'Salir', { type: 'button', on: { click: function () { salir(false); } } }); }

  // =====================================================================
  //  Invitaciones
  // =====================================================================
  function mensajeInvitacion(nombre, cant, link) {
    var primer = limpio(nombre, 60).split(' ')[0] || '';
    return PMF.pon(EV.textoInvitacion, { nombre: primer, personas: PMF.personas(cant), link: link || EV.marcaLink, firma: ses ? ses.nombre : '' });
  }
  var logoListo = null;
  function cargarLogo() {
    if (!logoListo) {
      logoListo = new Promise(function (ok) {
        var im = new window.Image();
        im.onload = function () { ok(im); }; im.onerror = function () { ok(null); };
        im.src = PMF.RAIZ + 'img/logo-fest.png';
      });
    }
    return logoListo;
  }
  function fuentesListas() {
    if (!document.fonts || !document.fonts.load) { return Promise.resolve(); }
    var f = ['800 76px Montserrat', '600 30px Montserrat', '700 32px Montserrat', 'italic 800 40px Montserrat'];
    var espera = new Promise(function (ok) { window.setTimeout(ok, 3000); });
    return Promise.race([Promise.all(f.map(function (x) { return document.fonts.load(x); })).then(function () { /* ok */ }, function () { /* nada */ }), espera]);
  }
  /* 8 · Tarjeta de invitación, dibujada en un lienzo de 1080 × 1350. */
  function tarjeta(inv) {
    return Promise.all([cargarLogo(), fuentesListas()]).then(function (r) {
      var logo = r[0], c = document.createElement('canvas'), x = c.getContext('2d'), F = 'Montserrat, Arial, sans-serif', g;
      c.width = 1080; c.height = 1350;
      g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, '#4a3f8c'); g.addColorStop(0.6, '#150d33'); g.addColorStop(1, '#150d33');
      x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
      x.save(); x.translate(540, 0); x.scale(1, 500 / 800);
      g = x.createRadialGradient(0, 0, 0, 0, 0, 800); g.addColorStop(0, 'rgba(207,25,101,0.4)'); g.addColorStop(0.7, 'rgba(207,25,101,0)'); g.addColorStop(1, 'rgba(207,25,101,0)');
      x.fillStyle = g; x.fillRect(-540, 0, 1080, 1350 * 800 / 500); x.restore();
      function redondo(px, py, w, hh, rad) {
        x.beginPath(); x.moveTo(px + rad, py); x.lineTo(px + w - rad, py); x.arcTo(px + w, py, px + w, py + rad, rad); x.lineTo(px + w, py + hh - rad); x.arcTo(px + w, py + hh, px + w - rad, py + hh, rad);
        x.lineTo(px + rad, py + hh); x.arcTo(px, py + hh, px, py + hh - rad, rad); x.lineTo(px, py + rad); x.arcTo(px, py, px + rad, py, rad); x.closePath();
      }
      function espaciado(texto, cx, cy, sep) { /* texto centrado con separación entre letras */
        var w = 0, i, anchos = [];
        for (i = 0; i < texto.length; i++) { anchos[i] = x.measureText(texto[i]).width; w += anchos[i] + (i < texto.length - 1 ? sep : 0); }
        var px = cx - w / 2; x.textAlign = 'left';
        for (i = 0; i < texto.length; i++) { x.fillText(texto[i], px, cy); px += anchos[i] + sep; }
        x.textAlign = 'center';
        return w;
      }
      x.textAlign = 'center'; x.textBaseline = 'middle';
      /* Logo sobre placa blanca (el logo es de colores) */
      x.fillStyle = '#ffffff'; redondo(366, 46, 348, 324, 30); x.fill();
      if (logo) { x.drawImage(logo, 390, 70, 300, 300 * logo.height / logo.width); }
      /* Pastilla */
      x.font = '800 26px ' + F;
      var wp = 0, i; for (i = 0; i < 19; i++) { wp += x.measureText('INVITACIÓN ESPECIAL'[i]).width + (i < 18 ? 8 : 0); }
      x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 2; redondo(540 - wp / 2 - 30, 410, wp + 60, 58, 29); x.stroke();
      x.fillStyle = '#ffffff'; espaciado('INVITACIÓN ESPECIAL', 540, 440, 8);
      x.fillStyle = '#d9d2f2'; x.font = '600 30px ' + F; x.fillText('Tenemos el gusto de invitarte', 540, 522);
      var nombre = String(inv.nombre || ''), tam = 76;
      x.fillStyle = '#ffffff'; x.font = '800 ' + tam + 'px ' + F;
      while (tam > 36 && x.measureText(nombre).width > 980) { tam -= 4; x.font = '800 ' + tam + 'px ' + F; }
      x.fillText(nombre, 540, 588);
      x.font = '700 32px ' + F; x.fillText('Invitación para ' + PMF.personas(inv.cant || 1), 540, 662);
      g = x.createLinearGradient(130, 0, 950, 0); g.addColorStop(0, '#cf1965'); g.addColorStop(0.5, '#9b2a86'); g.addColorStop(0.85, '#4a3f8c'); g.addColorStop(1, '#205999');
      x.fillStyle = g; redondo(130, 790, 820, 84, 14); x.fill();
      x.fillStyle = '#ffffff'; x.font = 'italic 800 40px ' + F; x.fillText(EV.diaTarjeta, 540, 834);
      x.font = '700 26px ' + F; espaciado(EV.lugarMayus, 540, 914, 3);
      x.fillStyle = '#ffffff'; redondo(390, 970, 300, 312, 22); x.fill();
      if (inv.q) { window.PMFQR.dibujar(x, inv.q, 420, 990, 240); }
      x.fillStyle = '#150d33'; x.font = '800 20px ' + F; x.fillText(String(inv.inv || ''), 540, 1252);
      x.fillStyle = '#d9d2f2'; x.font = '600 20px ' + F; x.fillText('Mostrá este QR en la entrada · ' + EV.redes, 540, 1314);
      return c;
    });
  }
  function lienzoABlob(c) {
    var url = c.toDataURL('image/png'), b = window.atob(url.split(',')[1]), a = new Uint8Array(b.length), i;
    for (i = 0; i < b.length; i++) { a[i] = b.charCodeAt(i); }
    return new window.Blob([a], { type: 'image/png' });
  }

  function invitaciones() {
    var cant = 2, idem = PMF.azar(18), tocado = false, ocupado = false, vivo = true;
    alSalir = function () { vivo = false; };
    var nombre = h('input', CAMPO_CLARO, null, { id: 'invitado', type: 'text', maxlength: 60, autocomplete: 'off', autocapitalize: 'words', placeholder: 'Nombre y apellido' });
    var mensaje = h('textarea', 'margin:8px 0 0;box-sizing:border-box;width:100%;min-height:190px;padding:12px 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8;font-size:14px;line-height:1.5;color:#150d33;resize:vertical', null, { id: 'mensaje', maxlength: 900 });
    function rearmar() { if (!tocado) { mensaje.value = mensajeInvitacion(nombre.value || '…', cant, ''); } }
    var cont = PMF.contadorClaro(cant, 1, 10, function (v) { cant = v; idem = PMF.azar(18); rearmar(); });
    nombre.addEventListener('input', function () { idem = PMF.azar(18); rearmar(); });
    mensaje.addEventListener('input', function () { tocado = true; });
    var av = avisoClaro();
    var crear = h('button', 'margin:16px 0 0;width:100%;height:60px;border:0;border-radius:14px;background:#cf1965;color:#ffffff;font-size:17px;font-weight:800', 'Crear y compartir por WhatsApp', { type: 'button' });
    var tituloLista = h('p', 'margin:22px 0 0;font-size:13px;font-weight:700;letter-spacing:1px;color:#4a3f8c', 'YA CREADAS');
    var cajaLista = h('div', 'margin:8px 0 0;padding:4px 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8');
    var totales = h('p', 'margin:10px 0 0;font-size:12px;color:#5b5470', '');
    var pc = pantallaClara('Invitaciones · ' + EV.corto, ses.nombre || '', [
      h('h1', 'margin:0;font-size:24px;font-weight:800', 'Nueva invitación'),
      h('label', 'display:block;' + ETIQ, 'NOMBRE DE LA PERSONA INVITADA', { 'for': 'invitado' }), nombre,
      h('p', ETIQ, '¿PARA CUÁNTAS PERSONAS?'), cont.caja,
      h('label', 'display:block;' + ETIQ, 'MENSAJE (SE PUEDE CAMBIAR)', { 'for': 'mensaje' }), mensaje,
      av.nodo,
      crear,
      h('p', 'margin:8px 0 0;font-size:12px;line-height:1.45;color:#5b5470;text-align:center', 'Se abre WhatsApp con la tarjeta de la invitación, el mensaje y el link. Vos elegís el contacto.'),
      tituloLista, cajaLista, totales,
      botonSalirClaro()
    ]);
    function pintarLista(r) {
      var lista = r.inv || [], i;
      PMF.vaciar(cajaLista);
      tituloLista.textContent = 'YA CREADAS · ' + lista.length;
      if (!lista.length) { cajaLista.appendChild(h('p', 'margin:0;padding:10px 0;font-size:14px;color:#5b5470', 'Todavía no hay invitaciones.')); }
      function fila(x, ultima) {
        var completa = (x.ing || 0) >= (x.cant || 0);
        return h('div', 'display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;font-size:14px' + (ultima ? '' : ';border-bottom:1px solid #eeebf6'), [
          h('span', 'font-weight:700', (x.nombre || '') + ' · ' + (x.cant || 0)),
          h('span', 'display:flex;align-items:center;gap:12px;flex-shrink:0', [
            x.ing ? h('span', 'font-weight:700;color:#0f7a45', completa ? 'Ingresó' : 'Ingresó ' + x.ing + ' de ' + x.cant) : null,
            completa ? null : h('button', 'border:0;background:transparent;padding:4px 0;font-size:14px;font-weight:700;color:#4a3f8c', 'Reenviar', { type: 'button', on: { click: function () { compartir(x, mensajeInvitacion(x.nombre, x.cant, x.link)); } } })
          ])
        ]);
      }
      for (i = 0; i < lista.length; i++) { cajaLista.appendChild(fila(lista[i], i === lista.length - 1)); }
      totales.textContent = r.tot ? 'Personas invitadas: ' + (r.tot.pers || 0) + ' · ingresaron ' + PMF.pct(r.tot.ing, r.tot.pers) : '';
    }
    function traerLista() {
      PMF.api({ a: 'invLista', s: ses.s }).then(function (r) {
        if (!vivo) { return; }
        if (r && r.ok) { pintarLista(r); return; }
        if (corte(r)) { return; }
        totales.textContent = 'No se pudo traer la lista de invitaciones.';
      }, function () { if (vivo) { totales.textContent = 'Sin señal: no se pudo traer la lista de invitaciones.'; } });
    }
    crear.addEventListener('click', function () {
      if (ocupado) { return; }
      var nom = limpio(nombre.value, 60);
      if (!nom) { av.decir('Escribí el nombre de la persona invitada.'); nombre.focus(); return; }
      ocupado = true; crear.disabled = true; crear.textContent = 'Creando la invitación…'; av.decir('');
      function soltar() { ocupado = false; crear.disabled = false; crear.textContent = 'Crear y compartir por WhatsApp'; }
      PMF.api({ a: 'invCrear', s: ses.s, nombre: nom, cant: cant, idem: idem }).then(function (r) {
        soltar();
        if (!vivo) { return; }
        if (r && r.ok) {
          var texto = String(mensaje.value || '');
          if (texto.indexOf(EV.marcaLink) >= 0) { texto = texto.split(EV.marcaLink).join(r.link); } else { texto = texto + '\n' + r.link; }
          nombre.value = ''; tocado = false; idem = PMF.azar(18); rearmar();
          compartir(r, texto);
          return;
        }
        if (corte(r)) { return; }
        av.decir(r && r.e === 'dato' ? 'Revisá el nombre y la cantidad de personas.' : 'No se pudo crear la invitación. Probá de nuevo.');
      }, function () { soltar(); av.decir('Sin señal: la invitación no se creó. Probá de nuevo cuando vuelva.'); });
    });
    /* Invitación creada: la tarjeta, el mensaje y los botones para compartir (cada uno se toca: así el celular deja abrir WhatsApp). */
    function compartir(inv, texto) {
      var archivo = null, url = '';
      var marco = h('div', 'margin:14px 0 0;align-self:center;width:216px;height:270px;border-radius:14px;overflow:hidden;background:#150d33;display:flex;align-items:center;justify-content:center', h('span', 'font-size:12px;font-weight:600;color:#d9d2f2', 'Armando la tarjeta…'));
      var msj = h('textarea', 'margin:8px 0 0;box-sizing:border-box;width:100%;min-height:170px;padding:12px 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8;font-size:14px;line-height:1.5;color:#150d33;resize:vertical', null, { maxlength: 1200, 'aria-label': 'Mensaje' });
      msj.value = texto;
      var av2 = avisoClaro();
      var bajar = h('a', 'display:flex;align-items:center;justify-content:center;height:50px;border-radius:12px;background:#ffffff;border:2px solid #4a3f8c;color:#4a3f8c;font-size:15px;font-weight:800;text-decoration:none;box-sizing:border-box', 'Descargar la tarjeta', { href: '#', download: 'Invitacion ' + (inv.inv || '') + ' Pilart Music Fest 2026.png' });
      bajar.addEventListener('click', function (ev) { if (!url) { ev.preventDefault(); } });
      var bComp = h('button', 'margin:16px 0 0;width:100%;height:60px;border:0;border-radius:14px;background:#cf1965;color:#ffffff;font-size:17px;font-weight:800', 'Compartir por WhatsApp', { type: 'button' });
      bComp.addEventListener('click', function () {
        var t = String(msj.value || '');
        if (archivo && navigator.canShare && navigator.share) {
          var puede = false;
          try { puede = navigator.canShare({ files: [archivo] }); } catch (e) { puede = false; }
          if (puede) {
            navigator.share({ files: [archivo], text: t }).then(function () { /* compartido */ }, function (e) {
              if (e && e.name === 'AbortError') { return; }
              av2.decir('No se pudo compartir la imagen desde acá. Tocá «Solo el mensaje» y mandá la tarjeta aparte con «Descargar la tarjeta».');
            });
            return;
          }
        }
        window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener');
        av2.decir('Este celular no deja mandar la imagen junto con el texto: se abrió WhatsApp con el mensaje y el link. Si querés, descargá la tarjeta y mandala aparte.');
      });
      var soloMsj = h('button', 'display:flex;align-items:center;justify-content:center;height:50px;border-radius:12px;background:#ffffff;border:2px solid #4a3f8c;color:#4a3f8c;font-size:15px;font-weight:800', 'Solo el mensaje', { type: 'button', on: { click: function () { window.open('https://wa.me/?text=' + encodeURIComponent(String(msj.value || '')), '_blank', 'noopener'); } } });
      var pc2 = pantallaClara('Invitaciones · ' + EV.corto, ses.nombre || '', [
        h('p', 'margin:0;font-size:13px;font-weight:800;letter-spacing:2px;color:#0f7a45;text-align:center', 'INVITACIÓN LISTA'),
        h('h1', 'margin:6px 0 0;font-size:24px;font-weight:800;text-align:center', (inv.nombre || '') + ' · ' + PMF.personas(inv.cant || 1)),
        h('p', 'margin:4px 0 0;font-size:16px;font-weight:700;color:#4a3f8c;text-align:center', String(inv.inv || '')),
        marco,
        h('p', ETIQ, 'MENSAJE'), msj,
        bComp,
        h('div', 'margin:10px 0 0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px', [bajar, soloMsj]),
        av2.nodo,
        h('p', 'margin:8px 0 0;font-size:12px;line-height:1.45;color:#5b5470;text-align:center', 'Se abre WhatsApp con la tarjeta, el mensaje y el link. Vos elegís el contacto.'),
        h('div', 'flex-grow:1;min-height:16px'),
        h('button', 'width:100%;height:54px;border:0;border-radius:14px;background:#4a3f8c;color:#ffffff;font-size:16px;font-weight:800', 'Volver a las invitaciones', { type: 'button', on: { click: function () { if (url) { try { window.URL.revokeObjectURL(url); } catch (e) { /* nada */ } } mostrar(pc.raiz); document.body.style.background = '#f1eef9'; traerLista(); } } })
      ]);
      mostrar(pc2.raiz);
      tarjeta(inv).then(function (c) {
        c.setAttribute('style', 'display:block;width:216px;height:270px');
        PMF.vaciar(marco); marco.appendChild(c);
        try {
          var blob = lienzoABlob(c);
          url = window.URL.createObjectURL(blob); bajar.setAttribute('href', url);
          if (typeof window.File === 'function') { archivo = new window.File([blob], 'Invitacion ' + (inv.inv || '') + '.png', { type: 'image/png' }); }
        } catch (e) { archivo = null; }
      }, function () { PMF.vaciar(marco); marco.appendChild(h('span', 'font-size:12px;font-weight:600;color:#d9d2f2;padding:12px;text-align:center', 'No se pudo armar la tarjeta. Mandá el mensaje con el link.')); });
    }
    mostrar(pc.raiz);
    rearmar();
    traerLista();
  }

  // =====================================================================
  //  Venta en puerta
  // =====================================================================
  function venta() {
    var vivo = true, info = { precio: 0, vendidas: 0, sigue: 0, fams: [] }, cant = 1, medio = 'Efectivo', idem = PMF.azar(18), ocupado = false;
    alSalir = function () { vivo = false; };
    function vendidasTxt() { return 'Vendidas hoy: ' + (info.vendidas || 0); }

    function nueva() {
      var nombre = h('input', CAMPO_CLARO, null, { id: 'comprador', type: 'text', maxlength: 60, autocomplete: 'off', autocapitalize: 'words', placeholder: 'Familia o nombre' });
      var sugeridas = h('div', 'display:flex;flex-direction:column');
      var bEf = h('button', '', 'Efectivo', { type: 'button' }), bMp = h('button', '', 'QR Mercado Pago', { type: 'button' });
      var SI = 'height:52px;border:0;border-radius:12px;background:#4a3f8c;color:#ffffff;font-size:15px;font-weight:700';
      var NO = 'height:52px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8;color:#150d33;font-size:15px;font-weight:700';
      var resumen = h('p', 'margin:0;font-size:13px;line-height:1.5', '');
      var total = h('p', 'margin:6px 0 0;font-size:15px;font-weight:800;color:#4a3f8c', '');
      var av = avisoClaro();
      var cobrar = h('button', 'margin:12px 0 0;width:100%;height:60px;border:0;border-radius:14px;background:#cf1965;color:#ffffff;font-size:18px;font-weight:800', 'Cobrado · registrar e ingresar', { type: 'button' });
      function pintar() {
        bEf.setAttribute('style', medio === 'Efectivo' ? SI : NO); bMp.setAttribute('style', medio === 'QR Mercado Pago' ? SI : NO);
        bEf.setAttribute('aria-pressed', medio === 'Efectivo' ? 'true' : 'false'); bMp.setAttribute('aria-pressed', medio === 'QR Mercado Pago' ? 'true' : 'false');
        PMF.vaciar(resumen);
        var nums = [], i;
        for (i = 0; info.sigue && i < cant; i++) { nums.push(info.sigue + i); }
        if (nums.length) { PMF.agrega(resumen, [cant === 1 ? 'Se crea la entrada ' : 'Se crean las entradas ', h('strong', null, PMF.lista(nums)), cant === 1 ? ', ya marcada como ingresada: no hace falta escanearla. Participa del sorteo.' : ', ya marcadas como ingresadas: no hace falta escanearlas. Participan del sorteo.']); }
        else { resumen.textContent = 'Las entradas quedan ya marcadas como ingresadas: no hace falta escanearlas. Participan del sorteo.'; }
        total.textContent = info.precio > 0 ? 'Total a cobrar: ' + PMF.pesos(info.precio * cant) + (cant > 1 ? ' (' + cant + ' × ' + PMF.pesos(info.precio) + ')' : '') : '';
        total.className = info.precio > 0 ? '' : 'oculto';
        pc.derecha.textContent = vendidasTxt();
      }
      function sugerir() {
        PMF.vaciar(sugeridas);
        var txt = PMF.sinTildes(nombre.value).replace(/^familia /, ''), n = 0, i;
        if (txt.length < 2) { return; }
        function opcion(f) {
          var rotulo = PMF.familia(f, true);
          return h('button', 'margin:6px 0 0;padding:10px 14px;border-radius:10px;background:#ffffff;border:1px solid #d9d6e8;color:#4a3f8c;font-size:14px;font-weight:700;text-align:left', rotulo, { type: 'button', on: { click: function () { nombre.value = rotulo; PMF.vaciar(sugeridas); idem = PMF.azar(18); } } });
        }
        for (i = 0; i < info.fams.length && n < 5; i++) {
          if (PMF.sinTildes(info.fams[i]).indexOf(txt) >= 0 && PMF.sinTildes(PMF.familia(info.fams[i], true)) !== PMF.sinTildes(nombre.value)) { sugeridas.appendChild(opcion(info.fams[i])); n++; }
        }
      }
      var cont = PMF.contadorClaro(cant, 1, 30, function (v) { cant = v; idem = PMF.azar(18); pintar(); });
      nombre.addEventListener('input', function () { idem = PMF.azar(18); sugerir(); });
      bEf.addEventListener('click', function () { medio = 'Efectivo'; idem = PMF.azar(18); pintar(); });
      bMp.addEventListener('click', function () { medio = 'QR Mercado Pago'; idem = PMF.azar(18); pintar(); });
      cobrar.addEventListener('click', function () {
        if (ocupado) { return; }
        var nom = limpio(nombre.value, 60);
        if (!nom) { av.decir('Escribí la familia o el nombre de quien compra.'); nombre.focus(); return; }
        ocupado = true; cobrar.disabled = true; cobrar.textContent = 'Registrando…'; av.decir('');
        function soltar() { ocupado = false; cobrar.disabled = false; cobrar.textContent = 'Cobrado · registrar e ingresar'; }
        PMF.api({ a: 'venta', s: ses.s, cant: cant, nombre: nom, medio: medio, idem: idem }).then(function (r) {
          soltar();
          if (!vivo) { return; }
          if (r && r.ok) {
            info.vendidas = r.vendidas || info.vendidas; if (r.nums && r.nums.length) { info.sigue = r.nums[r.nums.length - 1] + 1; }
            var c = cant, m = medio; cant = 1; idem = PMF.azar(18);
            registrada(r, c, m); return;
          }
          if (corte(r)) { return; }
          if (r && r.e === 'precio') { av.decir('Falta cargar el precio de la entrada. Avisale a Hernán.'); return; }
          av.decir(r && r.e === 'dato' ? 'Revisá la cantidad y el nombre.' : 'No se pudo registrar la venta. Probá de nuevo: no se va a cargar dos veces.');
        }, function () { soltar(); av.decir('Sin señal: la venta todavía no se registró. Tocá de nuevo el botón: no se va a cargar dos veces.'); });
      });
      var pc = pantallaClara('Venta en puerta', vendidasTxt(), [
        h('h1', 'margin:0;font-size:24px;font-weight:800', 'Nueva venta'),
        h('p', ETIQ, 'CANTIDAD DE ENTRADAS'), cont.caja,
        h('label', 'display:block;' + ETIQ, '¿DE QUÉ FAMILIA O A NOMBRE DE QUIÉN?', { 'for': 'comprador' }), nombre, sugeridas,
        h('p', 'margin:6px 0 0;font-size:12px;color:#5b5470', 'Si es de una familia de alumno, aparece al escribir. Si no, se anota el nombre.'),
        h('p', ETIQ, 'MEDIO DE PAGO'),
        h('div', 'margin:8px 0 0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px', [bEf, bMp]),
        h('div', 'flex-grow:1;min-height:18px'),
        h('div', 'padding:12px 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8', [resumen, total]),
        av.nodo,
        cobrar,
        h('div', 'margin:14px 0 0;display:flex;justify-content:space-between;align-items:center', [
          h('button', 'height:40px;border:0;background:transparent;color:#4a3f8c;font-size:14px;font-weight:800;text-decoration:underline', 'Cierre de caja', { type: 'button', on: { click: caja } }),
          h('button', 'height:40px;border:0;background:transparent;color:#5b5470;font-size:13px;font-weight:700;text-decoration:underline', 'Salir', { type: 'button', on: { click: function () { salir(false); } } })
        ])
      ]);
      pintar();
      mostrar(pc.raiz);
      PMF.api({ a: 'ventaInfo', s: ses.s }).then(function (r) {
        if (!vivo) { return; }
        if (r && r.ok) { info = { precio: Number(r.precio) || 0, vendidas: r.vendidas || 0, sigue: r.sigue || 0, fams: r.fams || [] }; pintar(); return; }
        if (corte(r)) { return; }
      }, function () { if (vivo) { av.decir('Sin señal: para vender en la puerta hace falta internet.'); } });
    }

    /* 12 · Venta registrada */
    function registrada(r, c, m) {
      var nums = r.nums || [], qr = null;
      try { qr = window.PMFQR.canvas(r.link, 220); qr.className = 'qr'; } catch (e) { qr = null; }
      var texto = PMF.pon(EV.textoVenta, { nums: PMF.nums(nums), link: r.link });
      var pc = pantallaClara('Venta en puerta', vendidasTxt(), null);
      pc.cuerpo.setAttribute('style', 'flex-grow:1;padding:22px 20px 24px;display:flex;flex-direction:column;align-items:center');
      PMF.agrega(pc.cuerpo, [
        h('p', 'margin:0;font-size:13px;font-weight:800;letter-spacing:2px;color:#0f7a45;text-align:center', 'VENTA REGISTRADA · YA INGRESARON'),
        h('h1', 'margin:6px 0 0;font-size:24px;font-weight:800;text-align:center', (r.titulo || '') + ' · ' + PMF.entradas(nums.length || c)),
        h('p', 'margin:4px 0 0;font-size:16px;font-weight:700;color:#4a3f8c;text-align:center', PMF.nums(nums)),
        r.total > 0 ? h('p', 'margin:4px 0 0;font-size:14px;font-weight:700;color:#5b5470;text-align:center', 'Cobrado: ' + PMF.pesos(r.total) + ' · ' + m) : null,
        h('div', 'margin:18px 0 0;padding:18px;border-radius:18px;background:#ffffff;border:1px solid #d9d6e8;display:flex;flex-direction:column;align-items:center', [
          qr,
          h('p', 'margin:10px 0 0;font-size:16px;font-weight:800;text-align:center', 'Escaneá con la cámara de tu celular'),
          h('p', 'margin:4px 0 0;font-size:13px;line-height:1.45;color:#5b5470;text-align:center', 'Te llevás tus entradas con los números para el sorteo.')
        ]),
        h('a', 'box-sizing:border-box;display:flex;align-items:center;justify-content:center;margin:14px 0 0;width:100%;height:50px;border-radius:12px;background:#ffffff;border:2px solid #4a3f8c;color:#4a3f8c;font-size:15px;font-weight:800;text-decoration:none', 'Enviar por WhatsApp', { href: 'https://wa.me/?text=' + encodeURIComponent(texto), target: '_blank', rel: 'noopener noreferrer' }),
        h('p', 'margin:8px 0 0;font-size:12px;line-height:1.45;color:#5b5470;text-align:center', 'Sin celular a mano: se anotan los números en un papelito.'),
        h('div', 'flex-grow:1;min-height:18px'),
        h('button', 'width:100%;height:60px;border:0;border-radius:14px;background:#cf1965;color:#ffffff;font-size:18px;font-weight:800', 'Nueva venta', { type: 'button', on: { click: nueva } })
      ]);
      mostrar(pc.raiz);
    }

    /* Cierre de caja */
    function caja() {
      var cuerpo = h('div', 'display:flex;flex-direction:column');
      var pc = pantallaClara('Venta en puerta', 'Cierre de caja', [
        h('h1', 'margin:0;font-size:24px;font-weight:800', 'Cierre de caja'),
        cuerpo,
        h('div', 'flex-grow:1;min-height:18px'),
        h('button', 'width:100%;height:54px;border-radius:14px;background:#ffffff;border:2px solid #4a3f8c;color:#4a3f8c;font-size:16px;font-weight:800', 'Volver a la venta', { type: 'button', on: { click: nueva } })
      ]);
      function pintar(r) {
        PMF.vaciar(cuerpo);
        var filas = [], i, efectivo = 0, cierres = [], ocupadoC = false;
        function fila(m, ultima) {
          if (m.medio === 'Efectivo') { efectivo = Number(m.pesos) || 0; }
          return h('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:12px 0' + (ultima ? '' : ';border-bottom:1px solid #eeebf6'), [
            h('div', null, [h('strong', 'font-size:15px', m.medio || ''), h('p', 'margin:2px 0 0;font-size:12px;color:#5b5470', (m.ventas === 1 ? '1 venta' : (m.ventas || 0) + ' ventas') + ' · entradas: ' + PMF.pct(m.ent, r.ent))]),
            h('strong', 'font-size:15px;white-space:nowrap', PMF.pesos(m.pesos))
          ]);
        }
        for (i = 0; r.medios && i < r.medios.length; i++) { filas.push(fila(r.medios[i], false)); }
        filas.push(h('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:12px 0', [
          h('div', null, [h('strong', 'font-size:16px;color:#4a3f8c', 'Total'), h('p', 'margin:2px 0 0;font-size:12px;color:#5b5470', (r.ventas === 1 ? '1 venta' : (r.ventas || 0) + ' ventas') + ' · ' + PMF.entradas(r.ent || 0))]),
          h('strong', 'font-size:18px;color:#4a3f8c;white-space:nowrap', PMF.pesos(r.total))
        ]));
        var contado = h('input', CAMPO_CLARO, null, { id: 'contado', type: 'text', inputmode: 'numeric', maxlength: 12, autocomplete: 'off', placeholder: '0' });
        var nota = h('input', CAMPO_CLARO, null, { id: 'nota', type: 'text', maxlength: 120, autocomplete: 'off', placeholder: 'Opcional' });
        var dif = h('p', 'margin:8px 0 0;font-size:14px;font-weight:800;color:#4a3f8c', '');
        var av = avisoClaro();
        function numero() { return Number(String(contado.value || '').replace(/[^\d]/g, '')) || 0; }
        function pintarDif() {
          if (!String(contado.value || '').replace(/[^\d]/g, '')) { dif.textContent = 'Efectivo que tendría que haber: ' + PMF.pesos(efectivo); return; }
          var d = numero() - efectivo;
          dif.textContent = d === 0 ? 'Coincide: no hay diferencia.' : (d > 0 ? 'Sobran ' + PMF.pesos(d) + '.' : 'Faltan ' + PMF.pesos(-d) + '.');
        }
        contado.addEventListener('input', function () { var n = String(contado.value || '').replace(/[^\d]/g, ''); contado.value = n ? PMF.miles(Number(n)) : ''; pintarDif(); });
        var cerrar = h('button', 'margin:14px 0 0;width:100%;height:60px;border:0;border-radius:14px;background:#cf1965;color:#ffffff;font-size:18px;font-weight:800', 'Cerrar la caja', { type: 'button' });
        cerrar.addEventListener('click', function () {
          if (ocupadoC) { return; }
          if (!String(contado.value || '').replace(/[^\d]/g, '')) { av.decir('Escribí cuánto efectivo contaste (si no hubo, poné 0).'); contado.focus(); return; }
          ocupadoC = true; cerrar.disabled = true; cerrar.textContent = 'Guardando…'; av.decir('');
          PMF.api({ a: 'cajaCerrar', s: ses.s, efectivo: numero(), nota: limpio(nota.value, 120) }).then(function (r2) {
            ocupadoC = false; cerrar.disabled = false; cerrar.textContent = 'Cerrar la caja';
            if (!vivo) { return; }
            if (r2 && r2.ok) { pintar(r2); return; }
            if (corte(r2)) { return; }
            av.decir('No se pudo guardar el cierre. Probá de nuevo.');
          }, function () { ocupadoC = false; cerrar.disabled = false; cerrar.textContent = 'Cerrar la caja'; av.decir('Sin señal: el cierre no se guardó. Probá de nuevo.'); });
        });
        for (i = 0; r.cierres && i < r.cierres.length; i++) {
          var c = r.cierres[i], d = Number(c.dif) || 0;
          cierres.push(h('div', 'padding:10px 0;font-size:13px;line-height:1.45' + (i === r.cierres.length - 1 ? '' : ';border-bottom:1px solid #eeebf6'), [
            h('strong', null, (c.hora || '') + ' · ' + (c.por || '')), h('br'),
            'Efectivo contado: ' + PMF.pesos(c.efectivo) + ' · ' + (d === 0 ? 'sin diferencia' : (d > 0 ? 'sobraron ' + PMF.pesos(d) : 'faltaron ' + PMF.pesos(-d)))
          ]));
        }
        PMF.agrega(cuerpo, [
          r.precio > 0 ? h('p', 'margin:6px 0 0;font-size:13px;color:#5b5470', 'Precio de la entrada: ' + PMF.pesos(r.precio)) : h('p', 'margin:6px 0 0;font-size:13px;font-weight:700;color:#cf1965', 'Falta cargar el precio de la entrada. Avisale a Hernán.'),
          h('p', ETIQ, 'VENDIDO EN LA PUERTA'),
          h('div', 'margin:8px 0 0;padding:4px 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8', filas),
          h('label', 'display:block;' + ETIQ, 'EFECTIVO CONTADO (EN PESOS)', { 'for': 'contado' }), contado, dif,
          h('label', 'display:block;' + ETIQ, 'NOTA', { 'for': 'nota' }), nota,
          av.nodo,
          cerrar,
          cierres.length ? [h('p', ETIQ, 'CIERRES GUARDADOS · ' + cierres.length), h('div', 'margin:8px 0 0;padding:4px 14px;border-radius:12px;background:#ffffff;border:1px solid #d9d6e8', cierres)] : null
        ]);
        pintarDif();
      }
      cuerpo.appendChild(h('p', 'margin:14px 0 0;font-size:14px;color:#5b5470', 'Cargando…'));
      mostrar(pc.raiz);
      PMF.api({ a: 'caja', s: ses.s }).then(function (r) {
        if (!vivo) { return; }
        if (r && r.ok) { pintar(r); return; }
        if (corte(r)) { return; }
        PMF.vaciar(cuerpo); cuerpo.appendChild(h('p', 'margin:14px 0 0;font-size:14px;font-weight:700;color:#cf1965', 'No se pudo traer la caja. Volvé y probá de nuevo.'));
      }, function () { if (vivo) { PMF.vaciar(cuerpo); cuerpo.appendChild(h('p', 'margin:14px 0 0;font-size:14px;font-weight:700;color:#cf1965', 'Sin señal: no se pudo traer la caja.')); } });
    }
    nueva();
  }

  // =====================================================================
  //  Arranque
  // =====================================================================
  PMF.registrarSW();
  if (!PMF.hayServidor()) { PMF.noDisponible(app); return; }
  ses = G.lee(K_SES);
  if (pasoLaFecha()) { borrarSesionYLista(); G.saca(K_ALERTAS); }
  if (ses && (!ses.s || sesionVencida(ses))) { borrarSesionYLista(); }
  if (ses) { abrirRol(); } else { G.saca(K_LISTA); pantallaClave(); }
})();
