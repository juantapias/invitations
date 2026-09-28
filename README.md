# ⚡ Invitaciones dinámicas — Next.js + Supabase

Plataforma multi-evento: cada fiesta tiene su propia dirección y su propio diseño.

| Dirección | Qué es |
|---|---|
| `dominio.com/benjamin` | Invitación (pública) |
| `dominio.com/benjamin?c=código` | Invitación personalizada para una familia |
| `dominio.com/benjamin/admin` | Invitados en vivo: lo usa tu **cliente** (y tú) |
| `dominio.com/benjamin/evento.ics` | Archivo de calendario |
| `dominio.com/panel` | **Tu** administración: todos los eventos, crear, editar, temas y clientes |
| `dominio.com/panel/eventos/benjamin` | Editar un evento y el acceso de su cliente |
| `dominio.com/mis-eventos` | Inicio del cliente (si tiene un solo evento va directo a sus invitados) |

## Modelo: tú vendes, el cliente gestiona sus invitados

| | Tú (administrador) | Cliente |
|---|---|---|
| Crear, editar y eliminar eventos | ✅ | ❌ |
| Elegir tema, fecha, lugar y enlace | ✅ | ❌ |
| Crear la cuenta del cliente y darle acceso | ✅ | ❌ |
| Ver invitados, crear enlaces por familia, borrar respuestas y descargar el CSV | ✅ (todos) | ✅ (solo los suyos) |

Esto lo aplica la base de datos (RLS), no solo la interfaz: aunque un cliente intente llamar a la API directamente, no puede crear ni editar eventos.

**Entregar una invitación a un cliente:**
1. En `/panel` → **Nuevo evento**: elige el tema, llena los datos y en **Cliente** escribe su nombre y correo.
2. Al guardar se crea su cuenta y ves su contraseña **una sola vez**. Toca **Enviar por WhatsApp**: le llega un mensaje con el enlace de la invitación, su panel, su usuario y su contraseña.
3. Si el cliente ya tenía cuenta (por ejemplo, de otro evento), el evento se agrega a esa misma cuenta y no se genera una contraseña nueva.
4. Si el cliente olvida su contraseña: `/panel/eventos/<enlace>` → **Nueva contraseña**.

## Qué incluye

**Invitación (para los invitados)**
- Un **tema visual por evento** (hoy: *Pikachu* y *Misión espacial*), todos mobile-first: intro animada, cuenta regresiva, detalles, mapa, Waze y Google Maps.
- Confirmación de asistencia con número de personas y mensaje. El invitado puede cambiar su respuesta después.
- Guardado en el calendario con un toque (Apple Calendar en iPhone/Mac, Google Calendar en Android).
- Enlaces por familia (`?c=código`): la invitación los saluda por su nombre y limita los cupos.

**Administración (tú)** — `/panel`
- Crear, editar y eliminar eventos; elegir el tema; crear la cuenta del cliente y generarle contraseña.

**Panel del cliente** — `/<evento>/admin`
- Entrada con correo y contraseña (Supabase Auth).
- Tablero en vivo con:
  - personas que asistirán,
  - quién confirmó, quién no, y quién no ha respondido,
  - buscador,
  - descarga en CSV.
- Crear enlaces por familia, copiarlos y enviarlos por WhatsApp con un mensaje ya escrito.

**Seguridad**
- Cada organizador solo ve sus propios eventos (Row Level Security de Postgres).
- Los invitados no tocan la base de datos: las confirmaciones pasan por el servidor, que valida los cupos y la fecha límite.

## Estructura

```
supabase/migrations/0001_init.sql   Tablas, seguridad (RLS) y tiempo real
supabase/migrations/0002_…sql       Enlaces reservados (/panel, /login…)
src/proxy.ts                        Protege /panel y /<evento>/admin y refresca la sesión
src/app/[slug]/                     Invitación, /admin (invitados del cliente) y evento.ics
src/app/api/rsvp/route.ts           Recibe confirmaciones (valida cupos y fecha límite)
src/app/login/                      Inicio de sesión
src/app/panel/                      Administración (solo admin): eventos, temas y clientes
src/app/mis-eventos/                Inicio del cliente
src/lib/auth.ts                     Quién está conectado y si es administrador
src/themes/                         Temas visuales (uno por carpeta) + lógica compartida
src/lib/                            Supabase, fechas por zona horaria, calendario
```

## Puesta en marcha

### 1. Crear el proyecto en Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com) (el plan gratis alcanza).
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/migrations/0001_init.sql` y toca **Run**. Luego repite, en orden, con `0002_rutas_y_temas.sql` y `0003_roles.sql`.
3. Ve a **Authentication → Sign In / Providers** y **desactiva "Allow new users to sign up"**.
   - La app no tiene página de registro, pero la API de Supabase sí permitiría crear cuentas si esta opción queda activa.
4. Ve a **Authentication → Users → Add user → Create new user**. Usa tu correo y una contraseña, y marca **Auto Confirm User**.
   - Solo creas **tu** cuenta aquí: las de los clientes se crean desde el panel.
5. **Regístrate como administrador** en el SQL Editor (con tu correo):
   ```sql
   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'tu-correo@ejemplo.com';
   ```

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y completa los valores. Los encuentras en **Project Settings → API Keys**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave *publishable* (o la antigua *anon*) |
| `SUPABASE_SECRET_KEY` | Clave *secret* (o la antigua *service_role*). **Nunca** la expongas ni le pongas `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local; tu dominio en producción |

### 3. Correr en local
```bash
npm install
npm run dev
```
Abre http://localhost:3000/panel, entra con tu usuario y crea tu primer evento. Si no escribes un enlace, se usa el nombre (`/benjamin`); si ya existe, `/benjamin-6`. Si al entrar te lleva a "Mis eventos" en lugar de la administración, te falta el paso 5 (registrarte como administrador).

### 4. Publicar en Vercel
1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. Deja **Root Directory** vacío (la app está en la raíz del repositorio). Si antes lo habías cambiado a `plataforma`, vuélvelo a dejar vacío en *Settings → Build and Deployment*.
3. Agrega las 4 variables de entorno. `NEXT_PUBLIC_SITE_URL` debe ser tu dominio final, por ejemplo `https://invitaciones.juantapias.dev`.
4. Toca **Deploy**.

## Uso diario

1. **Crear el evento** en `/panel`: elige el tema, asigna el cliente y llena los datos. En *Búsqueda en Google Maps* incluye la ciudad, o pon latitud y longitud para que el pin sea exacto.
2. **Crear enlaces por familia** en *Enlaces por familia*, con el nombre y los cupos. Luego:
   - toca **WhatsApp** para enviarlo con un mensaje ya escrito, o
   - toca **Copiar** para enviarlo como prefieras.
3. **Seguir las respuestas en vivo** en `/<evento>/admin`. El cliente también crea allí sus enlaces por familia. El indicador **"En vivo"** muestra que se actualiza solo.
4. **Borrar respuestas de prueba** con el botón *Borrar* de cada invitado. En el teléfono de prueba, abre la invitación con `?reset=1` para olvidar la respuesta guardada allí.

**Parámetros útiles de la invitación:**
- `?c=código`: enlace de una familia (lo genera el panel).
- `?intro=0`: salta la Pokébola (útil para revisar el diseño).
- `?reset=1`: borra la respuesta guardada en ese teléfono.

## Crear un tema nuevo

Cada tema es una carpeta en `src/themes/<id>/` y solo se encarga del diseño. La lógica (confirmar, cupos, cuenta regresiva, calendario, respuesta guardada) viene del hook `useInvitation()` en `src/themes/shared/`.

1. **Copia** `src/themes/galaxia/` como punto de partida, por ejemplo a `src/themes/dinosaurios/`.
2. **`meta.ts`:**
   - `id`, `name` y `description`;
   - colores (`themeColor`, `swatch`);
   - textos por defecto (`defaults.phrase`, `defaults.message`).
3. **`Invitation.tsx`:**
   - Llama a `useInvitation(props)`. Te da `form`, `calendar`, `countdown`, `view`, etc.
   - Dibuja lo que quieras. Pon `data-field="name"` y `data-field="attending"` en esos campos para que, si hay un error, la página baje hasta ellos.
   - La raíz del componente debe llevar la clase `theme-<id>`.
4. **`styles.css`:**
   - Escribe todo bajo `.theme-<id>`, con variables en `html:has(.theme-<id>)` y animaciones con prefijo propio, así nunca choca con otros temas.
   - Si partes de un CSS sin aislar, `scripts/scope-theme-css.cjs` lo convierte.
5. **Registra el tema** en `src/themes/registry.ts` (metadatos) y en `src/themes/render.tsx` (carga).
   - Aparece solo en el selector del panel.
   - Cada invitación descarga únicamente el código y el CSS de su tema.

## Notas

- **Zona horaria:** las horas se guardan en UTC y siempre se muestran en la zona horaria del evento, sin importar dónde esté el invitado.
- **Calendario:** `/<enlace>/evento.ics` se genera en cada petición, así que siempre refleja los datos actuales del evento.
- **Enlaces reservados:** ningún evento puede llamarse `panel`, `login`, `api`, etc. La lista está en `src/lib/slug.ts` y en la migración `0002`; si agregas rutas nuevas, actualiza ambas.
- **Derechos de marca:** Pokémon y Pikachu son marcas de Nintendo / The Pokémon Company. El tema Pikachu es solo para uso personal (el panel lo marca así). *Misión espacial* es original y se puede vender.
- **Pendiente para producción con mucho tráfico:** limitar la cantidad de envíos por IP en `/api/rsvp`, por ejemplo con Vercel Firewall o Upstash Ratelimit.
