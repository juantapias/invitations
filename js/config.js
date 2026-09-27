/*
 * ⚡ CONFIGURACIÓN DE LA INVITACIÓN ⚡
 * Edita solo este archivo para personalizar todo el evento.
 * Las fechas usan formato ISO con zona horaria (ej. -05:00 = Colombia/Perú/Ecuador).
 */
window.INVITACION = {
  festejado: 'Benjamín',
  edad: 6,
  frase: '¡Te elijo a ti!',
  mensaje:
    'Prepárate para una aventura eléctrica llena de juegos, pastel y muchos Pokémon. ¡Tu presencia hará este día súper efectivo!',

  inicio: '2026-10-25T14:00:00-05:00',
  fin: '2026-10-25T19:00:00-05:00',
  zonaHoraria: 'America/Bogota',
  // Después de esta fecha el formulario se cierra (déjalo en '' para no cerrarlo nunca)
  fechaLimite: '2026-10-20T23:59:00-05:00',

  lugar: {
    nombre: 'Alto Jardín · Salón social',
    direccion: 'Calle 50B #98-65',
    // Texto que se busca en Google Maps (agrega la ciudad para que el pin sea exacto)
    busquedaMapa: 'Alto Jardín, Calle 50B #98-65, Colombia',
    // Opcional pero recomendado: coordenadas exactas (clic derecho en Google Maps → copiar coordenadas)
    lat: null,
    lng: null,
  },

  // Déjalo en '' para ocultar la sección de vestimenta
  vestimenta: '',

  // Máximo de personas por invitación (se puede cambiar por enlace con ?cupos=3)
  maxPersonas: 5,

  // Opcional: WhatsApp de contacto con código de país, sin + ni espacios. Déjalo en '' para ocultarlo.
  contacto: { nombre: 'los papás de Benjamín', whatsapp: '' },

  // URL del Web App de Google Apps Script (ver README). Vacío = modo demo (se guarda solo en este navegador).
  apiUrl:
    'https://script.google.com/macros/s/AKfycbzggUPMMQt2X1tC2se26v__JUbFcrOK6UaBYrcQ7T-Fdm2jGUtikUl8BlzQFyb1tb3c/exec',
}
