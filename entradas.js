/* Pilart Music Fest 2026 · entradas digitales
   entradas.js: la página pública (Mis entradas, Entradas recibidas, Invitación, comprador en puerta y la guía).
   El token del link vive solo en el fragmento (#) y solo se manda a la API. JavaScript hasta ES2017. */
(function () {
  'use strict';
  var PMF = window.PMF, h = PMF.h, P = PMF.pieza, EV = PMF.EVENTO, G = PMF.guarda;
  var app = document.getElementById('app');
  var tok = null, dato = null, sinSenal = false, vista = 'inicio', pintado = '', pidiendo = false, turnos = 0, reloj = null;

  var GUIA = [
    ['¿Cómo entro?', 'Mostrá en la puerta el QR de grupo o el QR de cada entrada. Subí el brillo del celular para que se lea rápido.'],
    ['¿Y si no tengo señal en el club?', 'Abrí tus entradas antes de salir de casa: quedan guardadas en el celular. Por las dudas, sacale una captura al QR.'],
    ['Llegamos en distintos momentos', 'Con el QR de grupo pueden entrar de a poco: en la puerta marcan cuántos entran cada vez. Si alguien va por su cuenta, pasale sus entradas antes, así tiene su propio QR.'],
    ['¿Cómo le paso entradas a un familiar?', 'Tocá «Pasar entradas a un familiar», elegí cuántas y mandáselas por WhatsApp. Le llega un link con sus propios QR. Las que pasaste dejan de valer en tu celular.'],
    ['Me equivoqué al pasarlas', 'Si todavía no se usaron, tocá «Recuperar» y vuelven a tu página con QR nuevos.'],
    ['Me pasaron entradas y no puedo ir', 'Tocá «Devolver entradas» y vuelven a la familia que te las pasó, que se las puede pasar a otro familiar o amigo. Quien recibe entradas no puede pasarlas a otra persona: solo devolverlas.'],
    ['¿Para quién son las entradas?', 'Para tu familia y tus invitados. Cada familia de alumno tiene su propio pack.'],
    ['¿Cómo participo del sorteo?', 'Cada entrada tiene un número. Participan las entradas que ingresaron al Pilart Music Fest, y para ganar tenés que estar presente.'],
    ['No encuentro el mail con mis entradas', 'Pedilo en la recepción de Pilart Music o respondé el mail de tus entradas y te lo reenviamos.']
  ];

  function mostrar(nodo) { PMF.vaciar(app); app.appendChild(nodo); }
  function clave() { return 'pmf_v_' + PMF.huella(tok); }
  function qr(texto, lado) { var c = window.PMFQR.canvas(texto, lado); c.className = 'qr'; return c; }
  function textoError(e) {
    if (e === 'cerrado') { return 'Ya cerró el plazo para pasar, recuperar o devolver entradas.'; }
    if (e === 'dato') { return 'Revisá la cantidad y el nombre, y probá de nuevo.'; }
    if (e === 'red') { return 'No hay señal. Probá de nuevo en un momento.'; }
    return 'No se pudo hacer. Probá de nuevo en un momento.';
  }
  function parrafoError() { return h('p', 'margin:12px 0 0;font-size:13px;font-weight:700;line-height:1.45;color:#cf1965;min-height:0', ''); }

  // ---------- Arranque y lectura del fragmento ----------
  function leerFragmento() {
    var f = String(location.hash || '').replace(/^#/, '');
    cerrarHojas();
    if (f === 'guia') { tok = null; dato = null; pidiendo = false; turnos++; guia(false); return; }
    if (/^L[A-Za-z0-9_-]{27}$/.test(f) && PMF.hayServidor()) { tok = f; dato = null; pintado = ''; vista = 'inicio'; cargar(true); return; }
    tok = null; dato = null; pidiendo = false; turnos++;
    PMF.noDisponible(app);
  }
  var hojas = [];
  function cerrarHojas() { var c = hojas.slice(0), i; hojas = []; for (i = 0; i < c.length; i++) { c[i].cerrar(); } }
  function abrirHoja() {
    var o = PMF.hoja(function () { var i = hojas.indexOf(o); if (i >= 0) { hojas.splice(i, 1); } });
    hojas.push(o);
    return o;
  }

  function cargar(primera) {
    if (!tok || (pidiendo && pidiendo === tok)) { return; }
    var pedidoPara = tok, turno = ++turnos;
    if (primera) {
      var g = G.lee(clave());
      if (g && g.ok) { dato = g; pintar(); } else { cargando(); }
    }
    pidiendo = tok;
    PMF.api({ a: 'ver', t: tok }).then(function (r) {
      if (turno !== turnos) { return; }
      pidiendo = false;
      if (tok !== pedidoPara) { return; }
      if (r && r.ok) { sinSenal = false; dato = r; G.pon(clave(), r); pintar(); return; }
      if (r && r.e === 'no') { G.saca(clave()); dato = null; cerrarHojas(); PMF.noDisponible(app); return; }
      if (r && r.e === 'apagado') { dato = null; cerrarHojas(); PMF.noDisponible(app); return; }
      if (dato) { sinSenal = true; pintar(); } else { reintentar(); }
    }, function () {
      if (turno !== turnos) { return; }
      pidiendo = false;
      if (tok !== pedidoPara) { return; }
      if (dato) { sinSenal = true; pintar(); } else { reintentar(); }
    });
  }
  function cargando() {
    var p = P.pantalla();
    PMF.agrega(p, [P.logo(), h('div', 'flex-grow:1;display:flex;align-items:center;justify-content:center', h('p', 'margin:0;font-size:15px;font-weight:600;color:#d9d2f2', 'Cargando…')), P.pie()]);
    mostrar(p);
  }
  function reintentar() {
    var p = P.pantalla();
    PMF.agrega(p, [
      P.logo(),
      h('div', 'flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0', [
        h('h1', 'margin:0;text-align:center;font-size:26px;line-height:1.15;font-weight:800', 'No pudimos cargar la página'),
        h('p', 'margin:10px 0 0;text-align:center;font-size:14px;line-height:1.5;color:#d9d2f2', 'Revisá la señal del celular y probá de nuevo.'),
        h('button', 'margin:22px 0 0;width:100%;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', 'Probar de nuevo', { type: 'button', on: { click: function () { cargar(true); } } })
      ]),
      P.pie()
    ]);
    mostrar(p);
  }
  function pintar() {
    if (vista !== 'inicio' || !dato) { return; }
    var firma = JSON.stringify(dato) + (sinSenal ? '|s' : '');
    if (firma === pintado && app.firstChild) { return; }
    pintado = firma;
    if (dato.tipo === 'F') { mostrar(pantallaFamilia()); }
    else if (dato.tipo === 'R') { mostrar(pantallaRecibidas()); }
    else if (dato.tipo === 'I') { mostrar(pantallaInvitacion()); }
    else if (dato.tipo === 'V') { mostrar(pantallaComprador()); }
    else { PMF.noDisponible(app); }
  }
  function avisoSenal() { return sinSenal ? P.aviso('Sin señal: se muestra lo último guardado') : null; }

  // ---------- Piezas de las pantallas 2 y 2b ----------
  function tarjetaGrupo(d, conTexto) {
    var hijos = [];
    if (d.grupo && d.grupo.q && d.grupo.nums && d.grupo.nums.length) {
      hijos = [
        h('p', 'margin:0;font-size:12px;letter-spacing:2px;font-weight:800;color:#4a3f8c', 'QR DE GRUPO'),
        h('div', 'margin:8px 0 0', qr(d.grupo.q, 230)),
        h('p', 'margin:10px 0 0;font-size:22px;font-weight:800', PMF.entradas(d.grupo.nums.length)),
        h('p', 'margin:2px 0 0;font-size:14px;font-weight:600;color:#4a3f8c;text-align:center;line-height:1.4', PMF.nums(d.grupo.nums)),
        conTexto ? h('p', 'margin:10px 0 0;font-size:13px;line-height:1.45;text-align:center;color:#3d3654', 'Mostrá este QR en la entrada. Pueden ingresar todos juntos o de a poco: en la puerta marcan cuántos entran cada vez.') : null
      ];
    } else {
      var hay = d.ent && d.ent.length;
      hijos = [
        h('p', 'margin:0;font-size:12px;letter-spacing:2px;font-weight:800;color:#4a3f8c', 'QR DE GRUPO'),
        h('p', 'margin:10px 0 0;font-size:18px;font-weight:800;text-align:center', hay ? 'Ya ingresaron todas las entradas' : 'No quedan entradas en esta página'),
        h('p', 'margin:6px 0 0;font-size:13px;line-height:1.45;text-align:center;color:#3d3654', hay ? '¡Que disfruten el Pilart Music Fest!' : 'Las entradas se pasaron a otro familiar.')
      ];
    }
    return h('div', 'margin:18px 0 0;padding:20px 18px;border-radius:18px;background:#ffffff;color:#150d33;display:flex;flex-direction:column;align-items:center', hijos);
  }
  function grilla(d, columnas, titular) {
    if (!d.ent || !d.ent.length) { return null; }
    var celdas = [], i;
    function celda(e) {
      var base = 'padding:10px 0;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);text-align:center;color:#ffffff;display:block;width:100%';
      if (e.ing) {
        return h('div', base + ';opacity:0.5', [
          h('p', 'margin:0;font-size:16px;font-weight:800', 'N° ' + PMF.n3(e.n)),
          h('p', 'margin:2px 0 0;font-size:11px;color:#d9d2f2', 'Ingresó' + (e.hora ? ' ' + e.hora : ''))
        ]);
      }
      return h('button', base, [
        h('p', 'margin:0;font-size:16px;font-weight:800', 'N° ' + PMF.n3(e.n)),
        h('p', 'margin:2px 0 0;font-size:11px;color:#d9d2f2', 'Ver QR')
      ], { type: 'button', on: { click: function () { verQR(e, titular); } } });
    }
    for (i = 0; i < d.ent.length; i++) { celdas.push(celda(d.ent[i])); }
    return [
      h('p', 'margin:22px 0 0;font-size:13px;letter-spacing:2px;font-weight:700;color:#d9d2f2', 'ENTRADAS UNA POR UNA'),
      h('div', 'margin:10px 0 0;display:grid;grid-template-columns:repeat(' + columnas + ', minmax(0, 1fr));gap:8px', celdas)
    ];
  }
  function accesoGuia(sub, margen) {
    return h('button', 'margin:' + margen + ' 0 0;padding:16px 18px;border-radius:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);display:flex;align-items:center;gap:14px;text-align:left;width:100%', [
      PMF.icono('ayuda'),
      h('span', 'flex-grow:1', [
        h('span', 'display:block;font-size:15px;font-weight:800;color:#ffffff', '¿Cómo funcionan tus entradas?'),
        h('span', 'display:block;margin-top:2px;font-size:12px;color:#d9d2f2', sub)
      ]),
      h('span', 'font-size:20px;font-weight:800;color:#ffffff', '›')
    ], { type: 'button', on: { click: function () { guia(true); } } });
  }

  // ---------- 2 · Mis entradas ----------
  function pantallaFamilia() {
    var d = dato, p = P.pantalla(), i, pasadas = [];
    function filaPasada(x) {
      return h('div', 'margin:18px 0 0;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px', [
        PMF.icono('flecha'),
        h('span', 'flex-grow:1;font-size:13px;color:#d9d2f2', [
          PMF.entradas(x.nums.length) + (x.nums.length === 1 ? ' pasada a ' : ' pasadas a '),
          h('strong', 'color:#ffffff', x.para || 'un familiar'),
          ' (' + PMF.rango(x.nums) + ')' + (x.ing ? ' · ' + (x.ing >= x.nums.length ? 'ya ingresaron' : 'ingresaron ' + x.ing) : '')
        ]),
        h('span', 'flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:2px', [
          (x.rec && !d.cerrado) ? h('button', 'border:0;background:transparent;padding:6px 0;font-size:13px;font-weight:800;color:#ffffff;text-decoration:underline', 'Recuperar', { type: 'button', on: { click: function () { hojaRecuperar(x); } } }) : null,
          (x.link && x.rec) ? h('button', 'border:0;background:transparent;padding:6px 0;font-size:12px;font-weight:700;color:#d9d2f2;text-decoration:underline', 'Ver el link', { type: 'button', on: { click: function () { var o = abrirHoja(); listoParaEnviar(o, { link: x.link, nums: x.nums, para: x.para }, true); } } }) : null
        ])
      ]);
    }
    for (i = 0; d.pasadas && i < d.pasadas.length; i++) { pasadas.push(filaPasada(d.pasadas[i])); }
    PMF.agrega(p, [
      P.logo(),
      avisoSenal(),
      h('p', 'margin:18px 0 0;text-align:center;font-size:13px;letter-spacing:3px;font-weight:700;color:#d9d2f2', 'ENTRADAS DE LA'),
      h('h1', 'margin:4px 0 0;text-align:center;font-size:30px;line-height:1.1;font-weight:800', PMF.familia(d.fam, true)),
      P.fecha(),
      tarjetaGrupo(d, true),
      grilla(d, 3, PMF.familia(d.fam, true)),
      (d.ent && d.ent.length) ? h('p', 'margin:10px 0 0;font-size:12px;line-height:1.45;color:#d9d2f2', 'El número de cada entrada participa del sorteo del día, si la entrada ingresó al evento.') : null,
      pasadas,
      (!d.cerrado && d.disp > 0) ? h('button', 'display:block;width:100%;margin:18px 0 0;padding:16px 0;border:0;border-radius:12px;background:#cf1965;color:#ffffff;text-align:center;font-size:16px;font-weight:800', 'Pasar entradas a un familiar', { type: 'button', on: { click: hojaPasar } }) : null,
      h('p', 'margin:14px 0 0;font-size:12px;line-height:1.5;color:#d9d2f2;text-align:center', 'Las entradas son para la ' + PMF.familia(d.fam) + ' y sus invitados. Cada familia de alumno tiene su propio pack.'),
      accesoGuia('Cómo entrar, llegar en distintos momentos y compartirlas', '22px'),
      P.resorte(),
      P.pie()
    ]);
    return p;
  }

  // ---------- 2b · Entradas recibidas ----------
  function pantallaRecibidas() {
    var d = dato, p = P.pantalla(), quedan = 0, i;
    for (i = 0; d.ent && i < d.ent.length; i++) { if (!d.ent[i].ing) { quedan++; } }
    PMF.agrega(p, [
      P.logo(),
      avisoSenal(),
      h('p', 'margin:18px 0 0;text-align:center;font-size:13px;letter-spacing:3px;font-weight:700;color:#d9d2f2', 'ENTRADAS DE'),
      h('h1', 'margin:4px 0 0;text-align:center;font-size:30px;line-height:1.1;font-weight:800', d.para || 'un familiar'),
      h('p', 'margin:6px 0 0;text-align:center;font-size:14px;font-weight:600;color:#d9d2f2', 'Te las pasó la ' + PMF.familia(d.fam)),
      P.fecha(),
      tarjetaGrupo(d, false),
      grilla(d, 4, d.para || PMF.familia(d.fam, true)),
      (d.dev && !d.cerrado && quedan > 0) ? [
        h('button', 'display:block;width:100%;margin:18px 0 0;padding:15px 0;border-radius:12px;border:2px solid #ffffff;background:transparent;color:#ffffff;text-align:center;font-size:15px;font-weight:800', 'Devolver entradas a la ' + PMF.familia(d.fam), { type: 'button', on: { click: function () { hojaDevolver(quedan); } } }),
        h('p', 'margin:10px 0 0;font-size:12px;line-height:1.5;color:#d9d2f2;text-align:center', '¿No podés ir? Devolvelas y la ' + PMF.familia(d.fam) + ' se las pasa a otra persona. Estas entradas no se pueden pasar a otros.')
      ] : h('p', 'margin:18px 0 0;font-size:12px;line-height:1.5;color:#d9d2f2;text-align:center', 'Estas entradas no se pueden pasar a otros.'),
      accesoGuia('Cómo entrar y qué hacer si no tenés señal', '18px'),
      P.resorte(),
      P.pie()
    ]);
    return p;
  }

  // ---------- 9 · Invitación ----------
  function pantallaInvitacion() {
    var d = dato, p = P.pantalla(PMF.FONDO_INV), ya = (d.ing || 0) >= (d.cant || 0);
    PMF.agrega(p, [
      P.logo(),
      avisoSenal(),
      h('div', 'margin:20px auto 0;padding:7px 16px;border-radius:999px;border:1px solid rgba(255,255,255,0.55);font-size:12px;letter-spacing:3px;font-weight:800', 'INVITACIÓN ESPECIAL'),
      h('p', 'margin:16px 0 0;text-align:center;font-size:14px;font-weight:600;color:#d9d2f2', 'Tenemos el gusto de invitarte'),
      h('h1', 'margin:4px 0 0;text-align:center;font-size:30px;line-height:1.1;font-weight:800', d.nombre || ''),
      h('p', 'margin:6px 0 0;text-align:center;font-size:15px;font-weight:700', 'Invitación para ' + PMF.personas(d.cant || 1)),
      P.fecha('18px'),
      h('div', 'margin:18px 0 0;padding:20px 18px;border-radius:18px;background:#ffffff;color:#150d33;display:flex;flex-direction:column;align-items:center', [
        h('p', 'margin:0;font-size:12px;letter-spacing:2px;font-weight:800;color:#4a3f8c', 'TU QR DE INGRESO'),
        d.q ? h('div', 'margin:8px 0 0', qr(d.q, 230)) : null,
        h('p', 'margin:10px 0 0;font-size:20px;font-weight:800', 'Invitación ' + (d.inv || '')),
        h('p', 'margin:10px 0 0;font-size:13px;line-height:1.45;text-align:center;color:#3d3654',
          ya ? 'Esta invitación ya ingresó. ¡Que disfrutes el Pilart Music Fest!'
            : ((d.cant || 1) === 1 ? 'Mostrá este QR en la entrada. Es personal: vale para vos.' : ((d.cant || 1) === 2 ? 'Mostrá este QR en la entrada. Es personal: vale para vos y tu acompañante.' : 'Mostrá este QR en la entrada. Es personal: vale para vos y tus acompañantes.'))),
        (!ya && d.ing > 0) ? h('p', 'margin:6px 0 0;font-size:13px;font-weight:700;color:#4a3f8c', 'Ya ingresaron ' + PMF.pct(d.ing, d.cant)) : null
      ]),
      P.resorte(),
      P.pie('32px')
    ]);
    return p;
  }

  // ---------- Comprador en la puerta (sin QR: ya ingresaron) ----------
  function pantallaComprador() {
    var d = dato, p = P.pantalla(), nums = d.nums || [], chapas = [], i;
    for (i = 0; i < nums.length; i++) {
      chapas.push(h('div', 'padding:12px 0;border-radius:12px;background:#f1eef9;text-align:center;font-size:24px;font-weight:800;color:#150d33', PMF.n3(nums[i])));
    }
    PMF.agrega(p, [
      P.logo(),
      avisoSenal(),
      h('p', 'margin:18px 0 0;text-align:center;font-size:13px;letter-spacing:3px;font-weight:700;color:#d9d2f2', 'ENTRADAS DE'),
      h('h1', 'margin:4px 0 0;text-align:center;font-size:30px;line-height:1.1;font-weight:800', d.titulo || ''),
      P.fecha(),
      h('div', 'margin:18px 0 0;padding:20px 18px;border-radius:18px;background:#ffffff;color:#150d33;display:flex;flex-direction:column;align-items:stretch', [
        h('p', 'margin:0;font-size:12px;letter-spacing:2px;font-weight:800;color:#4a3f8c;text-align:center', 'TUS NÚMEROS PARA EL SORTEO'),
        h('p', 'margin:8px 0 0;font-size:22px;font-weight:800;text-align:center', PMF.entradas(nums.length)),
        h('div', 'margin:12px 0 0;display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:8px', chapas),
        h('p', 'margin:14px 0 0;font-size:13px;line-height:1.45;text-align:center;color:#3d3654', 'Tus entradas ya ingresaron: no hace falta mostrar nada en la puerta.')
      ]),
      h('p', 'margin:14px 0 0;font-size:12px;line-height:1.5;color:#d9d2f2;text-align:center', 'El número de cada entrada participa del sorteo del día. Para ganar tenés que estar presente.'),
      P.resorte(),
      P.pie()
    ]);
    return p;
  }

  // ---------- 2c · La guía ----------
  function guia(conVolver) {
    vista = 'guia';
    var p = P.pantalla(), tarjetas = [], i;
    for (i = 0; i < GUIA.length; i++) {
      tarjetas.push(h('div', 'padding:16px 16px;border-radius:14px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14)', [
        h('p', 'margin:0;font-size:15px;font-weight:800;line-height:1.3', GUIA[i][0]),
        h('p', 'margin:6px 0 0;font-size:13.5px;line-height:1.5;color:#e6e2f5', GUIA[i][1])
      ]));
    }
    function volver() { vista = 'inicio'; pintado = ''; pintar(); window.scrollTo(0, 0); cargar(false); }
    PMF.agrega(p, [
      P.logo(),
      h('h1', 'margin:16px 0 0;text-align:center;font-size:26px;line-height:1.15;font-weight:800', ['¿Cómo funcionan', h('br'), 'tus entradas?']),
      h('div', 'margin:18px 0 0;display:flex;flex-direction:column;gap:10px', tarjetas),
      conVolver ? h('button', 'display:block;width:100%;margin:18px 0 0;padding:15px 0;border-radius:12px;border:2px solid #ffffff;background:transparent;color:#ffffff;text-align:center;font-size:15px;font-weight:800', 'Volver a mis entradas', { type: 'button', on: { click: volver } }) : null,
      P.resorte(),
      P.pie()
    ]);
    mostrar(p);
    window.scrollTo(0, 0);
  }

  // ---------- Ver el QR de una entrada sola ----------
  function verQR(e, titular) {
    var o = abrirHoja();
    PMF.agrega(o.caja, [
      h('p', 'margin:18px 0 0;font-size:12px;letter-spacing:2px;font-weight:800;color:#4a3f8c;text-align:center', 'ENTRADA INDIVIDUAL'),
      h('h2', 'margin:4px 0 0;font-size:30px;font-weight:800;color:#150d33;text-align:center', 'N° ' + PMF.n3(e.n)),
      h('div', 'margin:12px 0 0;align-self:center', qr(e.q, 270)),
      h('p', 'margin:10px 0 0;font-size:15px;font-weight:700;color:#4a3f8c;text-align:center', titular || ''),
      h('p', 'margin:8px 0 0;font-size:13px;line-height:1.45;text-align:center;color:#3d3654', 'Mostrá este QR en la entrada. Vale para una persona. Subí el brillo del celular para que se lea rápido.'),
      h('button', 'margin:20px 0 0;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', 'Cerrar', { type: 'button', on: { click: function () { o.cerrar(); } } })
    ]);
  }

  // ---------- 3 · Pasar entradas ----------
  function hojaPasar() {
    var d = dato, o = abrirHoja(), max = Math.max(1, d.disp || 1), cant = 1, ocupado = false;
    var destacado = h('strong', null, PMF.entradas(cant));
    var err = parrafoError();
    var cont = PMF.contador(cant, 1, max, function (v) { cant = v; destacado.textContent = v === 1 ? 'esa entrada' : 'esas ' + v + ' entradas'; });
    destacado.textContent = 'esa entrada';
    var quien = h('input', 'margin:8px 0 0;height:50px;box-sizing:border-box;padding:0 14px;border:1px solid #d9d6e8;border-radius:12px;font-size:16px;color:#150d33;background:#ffffff', null, { id: 'quien', type: 'text', maxlength: 40, autocomplete: 'off', placeholder: 'Por ejemplo: Tía Ana' });
    var bWa = h('button', 'display:flex;align-items:center;justify-content:center;gap:10px;margin:22px 0 0;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', 'Enviar por WhatsApp', { type: 'button' });
    var bMail = h('button', 'display:flex;align-items:center;justify-content:center;height:50px;border:0;border-radius:12px;background:#4a3f8c;color:#ffffff;font-size:15px;font-weight:700', 'Enviar por mail', { type: 'button' });
    var bCopia = h('button', 'display:flex;align-items:center;justify-content:center;height:50px;border:0;border-radius:12px;background:#f1eef9;color:#4a3f8c;font-size:15px;font-weight:700', 'Copiar link', { type: 'button' });
    var bCancela = h('button', 'margin:14px 0 0;height:44px;border:0;background:transparent;color:#6b6585;font-size:14px;font-weight:600', 'Cancelar', { type: 'button', on: { click: function () { if (!ocupado) { o.cerrar(); } } } });
    function pedir(boton) {
      if (ocupado) { return; }
      var para = String(quien.value || '').replace(/\s+/g, ' ').replace(/^ | $/g, '');
      if (!para) { err.textContent = 'Escribí para quién son, así después lo recuerdan.'; quien.focus(); return; }
      ocupado = true; o.fijar(true); err.textContent = '';
      bWa.disabled = bMail.disabled = bCopia.disabled = true;
      var antes = boton.textContent; boton.textContent = 'Preparando el link…';
      function soltar() { ocupado = false; o.fijar(false); bWa.disabled = bMail.disabled = bCopia.disabled = false; boton.textContent = antes; }
      PMF.api({ a: 'pasar', t: tok, cant: cant, para: para }).then(function (r) {
        if (r && r.ok && r.link) { ocupado = false; listoParaEnviar(o, r); cargar(false); return; }
        soltar();
        if (r && (r.e === 'no' || r.e === 'apagado')) { o.cerrar(); cargar(false); return; }
        err.textContent = textoError(r && r.e);
        if (r && r.e === 'cerrado') { cargar(false); }
      }, function () { soltar(); err.textContent = 'No hay señal. Antes de probar de nuevo, cerrá esta ventana y fijate si ya figuran como pasadas en tu página.'; cargar(false); });
    }
    bWa.addEventListener('click', function () { pedir(bWa); });
    bMail.addEventListener('click', function () { pedir(bMail); });
    bCopia.addEventListener('click', function () { pedir(bCopia); });
    PMF.agrega(o.caja, [
      h('h2', 'margin:18px 0 0;font-size:22px;font-weight:800;color:#4a3f8c', 'Pasar entradas a un familiar'),
      h('p', 'margin:8px 0 0;font-size:14px;line-height:1.5;color:#3d3654', 'Ideal si un familiar no vive con ustedes. Le llega su propio link con sus entradas.'),
      h('label', 'margin:22px 0 0;font-size:13px;font-weight:700;color:#4a3f8c', '¿Cuántas entradas?'),
      cont.caja,
      h('p', 'margin:6px 0 0;font-size:12px;color:#6b6585', max === 1 ? 'Tienen 1 disponible.' : 'Tienen ' + max + ' disponibles.'),
      h('label', 'margin:18px 0 0;font-size:13px;font-weight:700;color:#4a3f8c', '¿Para quién son? (para que lo recuerden)', { 'for': 'quien' }),
      quien,
      h('div', 'margin:18px 0 0;padding:14px;border-radius:12px;background:#fdf2f7;border-left:4px solid #cf1965;font-size:13px;line-height:1.5;color:#3d3654', [
        'Al pasarlas se crean ', h('strong', null, 'QR nuevos'), ' para ', destacado, ', y los de tu página ', h('strong', null, 'dejan de valer'), '. Así nunca hay dos copias de la misma entrada.', h('br'),
        'Siguen siendo entradas de la ', h('strong', null, PMF.familia(d.fam)), '.'
      ]),
      err,
      bWa,
      h('div', 'margin:10px 0 0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px', [bMail, bCopia]),
      bCancela
    ]);
  }
  /* Después de Pasar: el link ya existe y los tres botones son enlaces directos (así el navegador no los bloquea). */
  function listoParaEnviar(o, r, otraVez) {
    var n = (r.nums || []).length, texto = PMF.pon(EV.textoPasar, { n: PMF.entradas(n), link: r.link });
    var aviso = h('p', 'margin:10px 0 0;font-size:13px;font-weight:700;color:#0f7a45;text-align:center;min-height:18px', '');
    o.fijar(!otraVez);
    o.limpiar();
    PMF.agrega(o.caja, [
      h('h2', 'margin:18px 0 0;font-size:22px;font-weight:800;color:#4a3f8c', otraVez ? 'El link de ' + (r.para || 'tu familiar') : '¡Listo! Ahora mandale el link'),
      h('p', 'margin:8px 0 0;font-size:14px;line-height:1.5;color:#3d3654', [h('strong', null, PMF.entradas(n)), ' para ', h('strong', null, r.para || ''), ' (' + PMF.rango(r.nums) + ').' + (otraVez ? ' Es el mismo link que ya le mandaste.' : ' Ya tienen sus QR nuevos.')]),
      h('p', 'margin:18px 0 0;font-size:13px;font-weight:700;color:#4a3f8c', 'Link de ' + (r.para || 'tu familiar')),
      h('div', 'margin:8px 0 0;padding:12px 14px;border:1px solid #d9d6e8;border-radius:12px;font-size:13px;line-height:1.4;color:#150d33;word-break:break-all;-webkit-user-select:all;user-select:all', r.link),
      h('div', 'margin:18px 0 0;padding:14px;border-radius:12px;background:#fdf2f7;border-left:4px solid #cf1965;font-size:13px;line-height:1.5;color:#3d3654', [
        'Mandáselo ', h('strong', null, 'solo a esa persona'), '. Si te equivocaste, cerrá esta ventana y tocá ', h('strong', null, '«Recuperar»'), ' en tu página.'
      ]),
      h('a', 'display:flex;align-items:center;justify-content:center;gap:10px;margin:22px 0 0;height:54px;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none', 'Enviar por WhatsApp', { href: 'https://wa.me/?text=' + encodeURIComponent(texto), target: '_blank', rel: 'noopener noreferrer' }),
      h('div', 'margin:10px 0 0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px', [
        h('a', 'display:flex;align-items:center;justify-content:center;height:50px;border-radius:12px;background:#4a3f8c;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none', 'Enviar por mail', { href: 'mailto:?subject=' + encodeURIComponent(EV.asuntoPasar) + '&body=' + encodeURIComponent(texto) }),
        h('button', 'display:flex;align-items:center;justify-content:center;height:50px;border:0;border-radius:12px;background:#f1eef9;color:#4a3f8c;font-size:15px;font-weight:700', 'Copiar link', { type: 'button', on: { click: function () {
          PMF.copiar(r.link).then(function (bien) { aviso.textContent = bien ? 'Link copiado. Pegalo en el mensaje.' : 'No se pudo copiar: mantené apretado el link de arriba y elegí Copiar.'; });
        } } })
      ]),
      aviso,
      h('button', 'margin:6px 0 0;height:44px;border:0;background:transparent;color:#6b6585;font-size:14px;font-weight:600', otraVez ? 'Cerrar' : 'Ya lo mandé · cerrar', { type: 'button', on: { click: function () { o.cerrar(); cargar(false); } } })
    ]);
    o.caja.scrollTop = 0;
  }

  // ---------- Recuperar ----------
  function hojaRecuperar(x) {
    var o = abrirHoja(), ocupado = false, err = parrafoError(), n = x.nums.length;
    var bSi = h('button', 'margin:22px 0 0;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', 'Sí, recuperar', { type: 'button' });
    bSi.addEventListener('click', function () {
      if (ocupado) { return; }
      ocupado = true; o.fijar(true); bSi.disabled = true; bSi.textContent = 'Recuperando…'; err.textContent = '';
      function soltar() { ocupado = false; o.fijar(false); bSi.disabled = false; bSi.textContent = 'Sí, recuperar'; }
      PMF.api({ a: 'recuperar', t: tok, id: x.id }).then(function (r) {
        ocupado = false;
        if (r && r.ok) { o.fijar(false); o.cerrar(); cargar(false); return; }
        soltar();
        if (r && (r.e === 'no' || r.e === 'apagado')) { o.cerrar(); cargar(false); return; }
        err.textContent = textoError(r && r.e);
        cargar(false);
      }, function () { soltar(); err.textContent = textoError('red'); });
    });
    PMF.agrega(o.caja, [
      h('h2', 'margin:18px 0 0;font-size:22px;font-weight:800;color:#4a3f8c', n === 1 ? '¿Recuperar la entrada?' : '¿Recuperar las ' + n + ' entradas?'),
      h('p', 'margin:8px 0 0;font-size:14px;line-height:1.5;color:#3d3654', [(n === 1 ? 'Es la entrada que le pasaste a ' : 'Son las que le pasaste a '), h('strong', null, x.para || 'un familiar'), ' (' + PMF.rango(x.nums) + ').']),
      h('div', 'margin:18px 0 0;padding:14px;border-radius:12px;background:#fdf2f7;border-left:4px solid #cf1965;font-size:13px;line-height:1.5;color:#3d3654', [
        'Vuelven a tu página con ', h('strong', null, 'QR nuevos'), '. El link que le mandaste ', h('strong', null, 'deja de valer'), '.'
      ]),
      err,
      bSi,
      h('button', 'margin:14px 0 0;height:44px;border:0;background:transparent;color:#6b6585;font-size:14px;font-weight:600', 'Cancelar', { type: 'button', on: { click: function () { if (!ocupado) { o.cerrar(); } } } })
    ]);
  }

  // ---------- Devolver ----------
  function hojaDevolver(quedan) {
    var d = dato, o = abrirHoja(), cant = quedan, ocupado = false;
    function paso1() {
      o.limpiar();
      var cont = PMF.contador(cant, 1, quedan, function (v) { cant = v; bSigue.textContent = 'Devolver ' + PMF.entradas(v); });
      var bSigue = h('button', 'margin:22px 0 0;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', 'Devolver ' + PMF.entradas(cant), { type: 'button', on: { click: paso2 } });
      PMF.agrega(o.caja, [
        h('h2', 'margin:18px 0 0;font-size:22px;font-weight:800;color:#4a3f8c', 'Devolver entradas'),
        h('p', 'margin:8px 0 0;font-size:14px;line-height:1.5;color:#3d3654', 'Vuelven a la ' + PMF.familia(d.fam) + ', que se las puede pasar a otra persona.'),
        h('label', 'margin:22px 0 0;font-size:13px;font-weight:700;color:#4a3f8c', '¿Cuántas devolvés?'),
        cont.caja,
        h('p', 'margin:6px 0 0;font-size:12px;color:#6b6585', quedan === 1 ? 'Tenés 1 entrada sin usar.' : 'Tenés ' + quedan + ' entradas sin usar.'),
        bSigue,
        h('button', 'margin:14px 0 0;height:44px;border:0;background:transparent;color:#6b6585;font-size:14px;font-weight:600', 'Cancelar', { type: 'button', on: { click: function () { o.cerrar(); } } })
      ]);
    }
    function paso2() {
      o.limpiar();
      var err = parrafoError();
      var bSi = h('button', 'margin:22px 0 0;height:54px;border:0;border-radius:12px;background:#cf1965;color:#ffffff;font-size:16px;font-weight:800', 'Sí, devolver', { type: 'button' });
      bSi.addEventListener('click', function () {
        if (ocupado) { return; }
        ocupado = true; o.fijar(true); bSi.disabled = true; bSi.textContent = 'Devolviendo…'; err.textContent = '';
        function soltar() { ocupado = false; o.fijar(false); bSi.disabled = false; bSi.textContent = 'Sí, devolver'; }
        PMF.api({ a: 'devolver', t: tok, cant: cant }).then(function (r) {
          ocupado = false;
          if (r && r.ok) {
            o.fijar(false); o.cerrar();
            if (r.fin) { G.saca(clave()); devueltas(d.fam, (r.nums || []).length || cant); tok = null; dato = null; return; }
            cargar(false); return;
          }
          soltar();
          if (r && (r.e === 'no' || r.e === 'apagado')) { o.cerrar(); cargar(false); return; }
          err.textContent = textoError(r && r.e);
          cargar(false);
        }, function () { soltar(); err.textContent = textoError('red'); });
      });
      PMF.agrega(o.caja, [
        h('h2', 'margin:18px 0 0;font-size:22px;font-weight:800;color:#4a3f8c', cant === 1 ? '¿Devolver 1 entrada?' : '¿Devolver ' + cant + ' entradas?'),
        h('p', 'margin:8px 0 0;font-size:14px;line-height:1.5;color:#3d3654', ['Vuelven a la ', h('strong', null, PMF.familia(d.fam)), '.']),
        h('div', 'margin:18px 0 0;padding:14px;border-radius:12px;background:#fdf2f7;border-left:4px solid #cf1965;font-size:13px;line-height:1.5;color:#3d3654', [
          'Las entradas que devolvés ', h('strong', null, 'dejan de valer en este celular'), '. No se puede deshacer desde acá: si las necesitás de nuevo, pedile a la ' + PMF.familia(d.fam) + ' que te las vuelva a pasar.'
        ]),
        err,
        bSi,
        h('button', 'margin:14px 0 0;height:44px;border:0;background:transparent;color:#6b6585;font-size:14px;font-weight:600', 'Volver', { type: 'button', on: { click: function () { if (!ocupado) { paso1(); } } } })
      ]);
    }
    paso1();
  }
  function devueltas(fam, n) {
    var p = P.pantalla();
    PMF.agrega(p, [
      P.logo(),
      h('div', 'flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0', [
        h('h1', 'margin:0;text-align:center;font-size:26px;line-height:1.15;font-weight:800', n === 1 ? 'Devolviste tu entrada' : 'Devolviste tus entradas'),
        h('p', 'margin:10px 0 0;text-align:center;font-size:14px;line-height:1.5;color:#d9d2f2', 'Ya volvieron a la ' + PMF.familia(fam) + '. ¡Gracias por avisar!')
      ]),
      P.pie()
    ]);
    mostrar(p);
    window.scrollTo(0, 0);
  }

  // ---------- En marcha ----------
  PMF.registrarSW();
  leerFragmento();
  window.addEventListener('hashchange', leerFragmento);
  window.addEventListener('online', function () { cargar(false); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { cargar(false); } });
  reloj = window.setInterval(function () {
    if (document.visibilityState === 'visible' && tok && vista === 'inicio' && hojas.length === 0) { cargar(false); }
  }, Math.max(15, Number(PMF.REFRESCO_SEG) || 60) * 1000);
})();
