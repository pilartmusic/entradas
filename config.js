/* Pilart Music Fest 2026 · entradas digitales · configuración.
   API: la dirección /exec del servidor. Si queda vacía, las páginas muestran "No disponible".
   Acá no va ninguna clave ni dato de personas: este archivo es público. */
window.PMF = {
  API: '',
  EVENTO: {
    nombre: 'Pilart Music Fest 2026',
    corto: 'Pilart Music Fest',
    dia: 'SÁBADO 12 DE DICIEMBRE',
    diaTarjeta: 'SÁBADO 12 DE DICIEMBRE · 16 HS',
    lugar: 'Club Atlético Pilar',
    lugarMayus: 'CLUB ATLÉTICO PILAR',
    linea: 'Club Atlético Pilar · Apertura de puertas 16 hs',
    textoPasar: '¡Hola! Te paso {n} para el Pilart Music Fest 2026 (sábado 12 de diciembre, Club Atlético Pilar, apertura de puertas 16 hs). Abrí este link para verlas: {link}',
    asuntoPasar: 'Tus entradas para el Pilart Music Fest 2026',
    textoInvitacion: '¡Hola, {nombre}! Te invitamos al Pilart Music Fest 2026, el sábado 12 de diciembre en el Club Atlético Pilar. Apertura de puertas: 16 hs.\nTu invitación es para {personas}. En la entrada mostrá el QR de la imagen o el del link:\n{link}\n¡Te esperamos! {firma} · Pilart Music',
    marcaLink: '[link a tu invitación]',
    textoVenta: 'Tus entradas del Pilart Music Fest 2026: {nums}. Guardá este link: tiene tus números para el sorteo. {link}',
    redes: '@pilartmusic',
    /* Los celulares del control borran solos la lista guardada después de este día (año, mes, día). */
    borrarDespuesDe: [2026, 12, 13]
  },
  REFRESCO_SEG: 60
};
