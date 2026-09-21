# API Reference

Base URL: `API_URL` (default `http://localhost:3001`). All bodies are JSON
unless noted (uploads are `multipart/form-data`). Source:
`api/src/*/*.controller.ts`.

## Auth model

Three independent auth mechanisms coexist:

| Mechanism | Used by | Guard |
|---|---|---|
| JWT Bearer token | Dashboard → owner-scoped endpoints | `AuthGuard` (`auth/auth.guard.ts`) |
| HTTP Basic Auth | `/admin*`, `/admin/queues` (Bull Board) | `AdminBasicGuard` (`admin/admin.guard.ts`) |
| Origin allowlist | `/chat` (public, no token) | `assertOriginAllowed()` in `ChatController` |

A JWT is obtained via `/auth/login` or `/auth/register` and sent as
`Authorization: Bearer <token>`. It encodes `{ sub: userId, email }` and
expires per `JWT_EXPIRES_IN` (default `7d`).

The admin panel and Bull Board queue dashboard use HTTP Basic Auth against
`ADMIN_USER`/`ADMIN_PASSWORD` (and `BULL_BOARD_USER`/`BULL_BOARD_PASSWORD`,
falling back to the admin credentials) — deliberately separate from user
accounts, since these expose platform-wide operator views, not a single
owner's data. **If unset, the guard refuses all requests rather than opening
the panel** (`admin.guard.ts`).

## Endpoints

### Auth (`/auth`) — public except `/me`

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/auth/register` | – | `{ email, password }` → JWT |
| POST | `/auth/login` | – | `{ email, password }` → JWT |
| GET | `/auth/me` | JWT | Current user (id, email, plan) |
| POST | `/auth/forgot-password` | – | Sends a reset email if the address exists (no user enumeration) |
| POST | `/auth/reset-password` | – | `{ token, password }` — one-hour TTL, hashed token, single use |

### Collections (`/collections`) — all JWT-protected, scoped to the caller's own collections

| Method | Path | Notes |
|---|---|---|
| POST | `/collections` | Create a collection (`{ name }`) |
| GET | `/collections` | List the caller's collections with document/chunk counts |
| GET | `/collections/:id` | Detail: collection, latest ingest job, stats |
| PATCH | `/collections/:id` | Update name, allowed origins, or settings |
| DELETE | `/collections/:id` | Cascades to documents, chunks, jobs, sessions |
| POST | `/collections/:id/upload` | Upload files or a folder (multipart, see below) |
| GET | `/collections/:id/status` | Collection status + latest ingest job |
| GET | `/collections/:id/documents` | Indexed documents (paginated `?offset&limit`) |
| GET | `/collections/:id/documents/:documentId` | Document, including extracted text |
| DELETE | `/collections/:id/documents/:documentId` | Remove one document (cascades its chunks) |
| POST | `/collections/:id/summary` | Regenerate the LLM summary on demand |

Every collection-scoped route resolves ownership via
`CollectionsService.findOwned()` — a JWT for user A can never read or mutate
user B's collection, even by guessing a UUID.

**Upload request shape:** `POST /collections/:id/upload` expects
`multipart/form-data` with one `files` part per file (the binary) and a
matching `paths` part per file (its relative path — `file.name` for a loose
file, `file.webkitRelativePath` for a file picked via a folder input).
Responds `{ jobId }` immediately; ingestion happens asynchronously (see
[Ingestion Pipeline](./ingestion-pipeline.md)). Rejected with 400 if the
batch exceeds the collection's `maxFiles`/`maxFileSizeMb` settings or
includes an unsupported file type.

### Chat (`/chat`) — public, origin-restricted

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/chat` | Origin check | `{ collectionId, message, sessionId? }` → Server-Sent Events stream of answer tokens, ending with a `sources` event |
| POST | `/chat/feedback` | Origin check | `{ collectionId, sessionId, messageId, rating: 'up'\|'down' }` |
| GET | `/widget.js` | – | The embeddable widget script (static, served from `api/src/public/`) |

`/chat`'s `Origin` header is validated against the target collection's own
`allowedOrigins` plus `DASHBOARD_ORIGINS` (so the dashboard's built-in chat
preview also works). In production (`CORS_RELAXED=false`), a missing or
disallowed Origin is rejected outright.

### Admin (`/admin*`) — HTTP Basic Auth, platform-operator only

Covers cross-tenant views: ingestion activity, plan overrides, and Bull
Board (`/admin/queues`) for inspecting the BullMQ file-ingestion queue
directly. Not exposed to regular dashboard users regardless of JWT.

### Misc

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness check, no auth |

## Rate limits

| Scope | Limit | Where |
|---|---|---|
| `/chat` per session | `CHAT_SESSION_LIMIT` (default 20/min) | In-memory sliding window, `SessionRateLimiter` |
| `/chat` per IP | `CHAT_IP_LIMIT` (default 60/min) | Broader net against multi-session abuse |
| `/auth/*` | 10/min | Global Nest rate limiter |
| Everything else | 120/min | Global Nest rate limiter |

## Validation

All request bodies pass through a global `ValidationPipe`
(`whitelist: true`, `transform: true`) — unknown fields are silently
stripped rather than rejected (`forbidNonWhitelisted: false`), and DTO
class-validator decorators (`collections.dto.ts`, `auth.dto.ts`,
`admin.dto.ts`) enforce shape and constraints before a controller method
runs.
