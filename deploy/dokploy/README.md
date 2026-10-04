# docubot en Dokploy

Mismo patrón que [`citybot/deploy/dokploy`](../../../citybot/deploy/dokploy/README.md): un VPS con **Dokploy**
(PaaS self-hosted tipo Coolify/CapRover, con Traefik de proxy) puede alojar varios proyectos — este kit asume
que se agrega docubot como un segundo proyecto "Compose" en el mismo Dokploy que ya corre citybot.

## Repo → Dokploy

- Crear un proyecto tipo **Compose** en Dokploy apuntando al repo `docubot` (Deploy Key si es privado).
- **Compose Path:** `deploy/dokploy/docker-compose.yml` — si se deja el default, Dokploy lee el
  `docker-compose.yml` de la raíz (el de desarrollo local, con `ports` expuestos al host en vez de `expose`) y
  en "Domains" no aparecen los servicios esperados.
- A diferencia de citybot (un solo servicio `app` con Dockerfile en la raíz), docubot define **dos servicios con
  build propio**: `api` ([`api/Dockerfile`](../../api/Dockerfile), NestJS) y `web`
  ([`web/Dockerfile`](../../web/Dockerfile), Next.js standalone). El compose de este kit los buildea con
  `context: ../../api` y `context: ../../web` respectivamente — no hace falta copiar ningún `.env` a mano porque
  ninguno de los dos lee archivos fuera de su propio directorio.

## Dominios

Agregar dos dominios desde la UI de Dokploy (Traefik + Let's Encrypt):

- Servicio `web`, puerto `3000` → dominio del dashboard (ej. `docubot.<tu-dominio>` o
  `<ip-con-guiones>.sslip.io` si todavía no hay dominio propio).
- Servicio `api`, puerto `3001` → dominio separado (ej. `api.docubot.<tu-dominio>`), **debe quedar público**:
  el endpoint `/chat` lo consume el widget embebido en sitios de terceros, no solo el dashboard.

## Variables de entorno

Se cargan en la pestaña **Environment** del proyecto en Dokploy, nunca en el repo. Mismas variables que
[`.env.example`](../../.env.example), con los nombres de host internos del compose (`db`, `dragonfly` en vez de
`localhost`) y los dominios públicos recién creados:

| Variable | Valor en Dokploy |
|---|---|
| `POSTGRES_PASSWORD` | Generada, solo en Environment |
| `JWT_SECRET` | Generada, solo en Environment |
| `OPENAI_API_KEY` | Key real del proveedor (u otro endpoint OpenAI-compatible vía `CHAT_BASE_URL`) |
| `API_URL` | `https://api.docubot.<tu-dominio>` (dominio público del servicio `api`) |
| `NEXT_PUBLIC_API_URL` | Igual a `API_URL` — se inlinea en el build del cliente, **cambiarla exige Rebuild**, no alcanza con reiniciar |
| `DASHBOARD_ORIGINS` | `https://docubot.<tu-dominio>` (dominio público del servicio `web`) |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Credenciales del panel `/admin`. **Obligatorias**: la API no bootea en producción sin esto (12+ caracteres) |
| `BULL_BOARD_USER` / `BULL_BOARD_PASSWORD` | Credenciales de `/admin/queues`. También obligatorias |
| `EMBEDDING_PROVIDER` | `local` (default, gratis, e5-small en CPU) u `openai` |

El resto de las variables de `.env.example` (`EMBEDDING_MODEL`, `CHUNK_MAX_CHARS`, precios, retención, etc.)
tienen default razonable en el compose y solo hace falta cargarlas si se quiere override.

## Build y mantenimiento

- **Rebuild:** botón en Dokploy, clona el último commit y buildea de nuevo las dos imágenes (`api` y `web`).
  Necesario siempre que cambie `NEXT_PUBLIC_API_URL` (ver arriba) aunque no haya cambios de código.
- **Cache de embeddings:** el volumen `modelcache` persiste el modelo de `Xenova/multilingual-e5-small` entre
  deploys — sin él, cada build/restart de `api` re-descarga el modelo (~100MB+) antes de poder ingestar o
  responder un chat.
- **Migraciones:** se corren solas — el `command` del servicio `api` en este compose hace
  `pnpm db:migrate && node dist/main.js`, así que cada arranque/rebuild aplica las migraciones pendientes antes
  de levantar el server (idempotente, drizzle lleva registro de las ya aplicadas). No hace falta correrlas a
  mano salvo que el contenedor `api` haya quedado crasheado de antes (en ese caso, migrar primero con un
  contenedor aparte en la misma red — ver "Trampas conocidas" — y después `docker restart`).
- **Logs de build:** `/etc/dokploy/logs/<proyecto>/` en el VPS, o desde la UI.

## Trampas conocidas

- **Compose Path mal puesto:** igual que en citybot — si Dokploy apunta al `docker-compose.yml` de la raíz,
  "Domains" muestra los nombres del compose de desarrollo (con `ports` ya expuestos) y no coincide con lo
  documentado acá.
- **`NEXT_PUBLIC_API_URL` sin Rebuild:** cambiar esta variable en Environment no tiene efecto hasta el próximo
  Rebuild — queda horneada en el bundle de JS del build anterior.
- **OOM durante el build de `web`:** el `next build` de la imagen de `web` puede necesitar más RAM que la
  disponible en una VPS chica, igual que le pasó a citybot — si el build se corta, sumar swap (`/swapfile`,
  persistente en `/etc/fstab`).
- **Panel admin sin credenciales:** si `ADMIN_USER`/`ADMIN_PASSWORD` o `BULL_BOARD_USER`/`BULL_BOARD_PASSWORD`
  faltan o tienen menos de 12 caracteres, la API no levanta en producción (falla el boot, no solo el login).
- **Migrar a mano si `api` ya quedó crasheando en loop** (por ejemplo, en un deploy viejo sin este `command`):
  no se puede `docker exec` en un contenedor que reinicia constantemente. Correr un contenedor aparte en la
  misma red en su lugar: `sudo docker run --rm --network <proyecto>_default -e DATABASE_URL=<la del contenedor
  api> <proyecto>-api sh -c 'pnpm db:migrate'`, y después `sudo docker restart <container-api>`.
