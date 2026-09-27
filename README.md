# ⚡ Invitación Pikachu

Invitación de cumpleaños dinámica con temática de Pikachu, pensada para celulares. Tiene confirmación de asistencia, guardado en el calendario, mapa y un panel para ver quién asiste.

## Estructura

```
index.html          Invitación
admin.html          Panel de invitados (quién asiste / quién no / total de personas)
js/config.js        ← Aquí se edita TODO: nombre, edad, fecha, lugar, etc.
evento.ics          Evento de calendario (se genera con scripts/generar-ics.mjs)
scripts/            Utilidades
js/app.js           Lógica de la invitación
js/calendar.js      Google Calendar + archivo .ics (Apple / Outlook)
js/api.js           Envío de respuestas
apps-script/Code.gs Backend gratis con Google Sheets
```

## 1. Personalizar

Edita `js/config.js`. Lo mínimo es cambiar `festejado`, `edad`, `inicio`, `fin`, `fechaLimite` y `lugar`.
Para que el mapa sea exacto, pon `lat` y `lng`: en Google Maps, clic derecho sobre el lugar → copia las coordenadas.

**Importante:** cada vez que cambies la fecha, la hora o el lugar, vuelve a generar el archivo del calendario:

```bash
node scripts/generar-ics.mjs
```

Cuando ya tengas el enlace final, ponlo en `urlPublica` y vuelve a ejecutar el comando. Así el evento guardado en el calendario incluye el enlace a la invitación.

## 2. Conectar Google Sheets (guardar las respuestas)

Si `apiUrl` está vacío, la invitación funciona en **modo demo** y guarda las respuestas solo en ese navegador. Para guardar las respuestas de todos los invitados:

1. Crea una hoja nueva en [sheets.new](https://sheets.new).
2. Ve a **Extensiones → Apps Script**, borra lo que haya y pega `apps-script/Code.gs`.
3. Cambia `ADMIN_KEY` por una clave propia.
4. Ve a **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Autoriza los permisos y copia la URL que termina en `/exec`.
6. Pégala en `js/config.js` → `apiUrl: 'https://script.google.com/macros/s/.../exec'`.

Las respuestas llegan a la pestaña **Respuestas** de la hoja. Si un invitado cambia su respuesta, se actualiza la misma fila; no se crea una fila duplicada.

> Si después editas `Code.gs`, ve a **Implementar → Administrar implementaciones → Editar → Nueva versión**. Si no lo haces, los cambios no se aplican.

## 3. Publicar (gratis)

Es un sitio estático, sin paso de compilación. Puedes publicarlo de cualquiera de estas formas:
- **Netlify Drop**: arrastra la carpeta a [app.netlify.com/drop](https://app.netlify.com/drop).
- **Vercel**: `npx vercel` dentro de la carpeta.
- **GitHub Pages**: sube el repositorio y activa Pages.

Para probarlo en tu computador: `python3 -m http.server 8080` y abre `http://localhost:8080`.

## 4. Enlaces personalizados

Puedes enviarle a cada familia su propio enlace:

```
https://tu-sitio.com/?invitado=Familia%20Pérez&cupos=4
```

- `invitado`: saluda por nombre y llena el formulario automáticamente.
- `cupos`: máximo de personas que puede confirmar esa invitación.

## 5. Ver quién asiste

Abre `https://tu-sitio.com/admin.html` e ingresa tu `ADMIN_KEY`. El panel muestra:
- el total de personas que asistirán,
- la lista de quienes asisten y de quienes no,
- un buscador,
- un botón para descargar la lista en CSV.

También puedes ver todo directamente en la hoja de Google Sheets.

## Sobre el calendario

Por seguridad, ningún sitio web puede escribir en el calendario de un teléfono sin que la persona lo acepte. La invitación reduce el proceso a un solo toque:

1. El invitado confirma que asiste.
2. Aparece el recuadro **"Último paso: guárdalo en tu calendario"**:
   - **iPhone / Mac**: se abre **automáticamente** la ventana nativa del Calendario (usa `evento.ics`, sin descargas). Solo hay que tocar **«Añadir»**.
   - **Android**: un toque en **"Guardar en mi calendario"** abre Google Calendar con todo lleno. Solo hay que tocar **«Guardar»**.
3. En **"¿Usas otro calendario?"** hay otras opciones (Google, Apple u Outlook).

El evento incluye recordatorios 1 día y 2 horas antes.

`_headers` (Netlify) y `vercel.json` (Vercel) hacen que `evento.ics` se abra directamente en el calendario. GitHub Pages ya lo sirve así sin configuración.

> Si el invitado abre el enlace desde Instagram o Facebook, esos navegadores internos no abren el calendario del iPhone. En ese caso la invitación usa Google Calendar y le sugiere abrirla en Safari.
