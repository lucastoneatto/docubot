# DocuBot

Generates a RAG chatbot from your own documents: upload files or a whole
folder, it extracts and indexes their content in PostgreSQL + pgvector, and
gives you a snippet to embed the chat on your site.

## Stack

- **API** (`api/`): NestJS + Drizzle ORM + OpenAI-compatible chat
- **Local embeddings** (`Xenova/multilingual-e5-small`, 384 dims, CPU) via transformers.js
- **Web** (`web/`): Next.js 15 (dashboard with login)
- **DB**: PostgreSQL 16 + pgvector (Docker)
- **Queue**: BullMQ + Dragonfly (Redis-compatible) for background file ingestion
- **Node 24** (`.nvmrc`)

`api` and `web` are independent projects, each with its own `node_modules` and lockfile.

📚 **Full technical documentation**: see [`/docs`](./docs) (Markdown, with
diagrams) or run the Docusaurus site in [`/docs-site`](./docs-site)
(`cd docs-site && pnpm install && pnpm start`).

## 🚀 Quick start (Docker, single command)

The simplest way to get the whole project running locally. All you need is
Docker and an OpenAI API key (or any compatible provider).

```bash
git clone <repo-url> docubot && cd docubot
cp .env.example .env
```

Edit `.env` and set your real key:

```bash
OPENAI_API_KEY=sk-your-key-here
```

(the rest of the variables already have default values that work locally
without touching anything else). Then:

```bash
docker compose --profile full up --build
```

Wait until the 4 services (`db`, `dragonfly`, `api`, `web`) are "healthy" and
go to **http://localhost:3000**. Register from there, or if you want an
admin user already created, run once:

```bash
docker compose exec api pnpm seed:admin
```

and log in with `admin@docubot.local` / `password1234`.

To stop everything: `docker compose down` (add `-v` if you also want to
delete the database data).

> This mode also runs `api` and `web` inside Docker (`full` profile).
> It's the easiest path, but it rebuilds the images on every code change —
> to develop with hot reload, use the section below.

## Requirements (local development without full Docker)

- Node 24 (`nvm use`)
- pnpm 10
- Docker

## Getting started

```bash
# 0. Node 24
nvm use

# 1. Environment variables
cp .env.example .env            # edit OPENAI_API_KEY and JWT_SECRET
cp web/.env.example web/.env.local

# 2. Database + queue backend
docker compose up -d db dragonfly

# 3. API (terminal 1)
nvm use
cd api
pnpm install
pnpm db:migrate
pnpm seed:admin                        # creates the admin with SEED_ADMIN_*
pnpm dev                               # http://localhost:3001

# 4. Web (terminal 2)
nvm use
cd web
pnpm install
pnpm dev                               # http://localhost:3000
```

## Usage

1. Log in at http://localhost:3000 (by default `admin@docubot.local` /
   `password1234` if you ran `pnpm seed:admin`), or sign up.
2. Create a collection, giving it a name.
3. Click **Upload files** to pick one or more documents, or **Upload a
   folder** to submit an entire directory tree at once (PDF, DOCX, TXT, MD,
   XLSX, XLS, CSV). Content is extracted and indexed with local embeddings
   (no cost).
4. Open **Preview** to try the chat against the uploaded documents before
   embedding it anywhere.
5. Copy the snippet and paste it into your site:

```html
<script src="http://localhost:3001/widget.js" data-collection-id="YOUR_COLLECTION_ID" defer></script>
```

Widget options: `data-color`, `data-title`, `data-greeting`, `data-position`
(`left`/`right`) and `data-api` (defaults to the script's origin).

## How it works

1. **Upload**: the browser sends one or many files (or an entire folder via
   the directory picker) in a single multipart request, each carrying its
   relative path.
2. **Extract**: each file's text is pulled out with a format-specific reader
   — `pdf-parse` for PDFs, `mammoth` for DOCX, `xlsx` for spreadsheets/CSV,
   plain read for TXT/MD.
3. **Index**: the extracted text is split into chunks (~1500 chars) and
   `multilingual-e5-small` embeddings (384 dims, CPU) are generated into
   `chunks.embedding`. Each file is its own BullMQ job; re-uploading a file
   whose content hasn't changed (by hash) skips re-embedding.
4. **Respond**: `POST /chat` searches for the closest chunks by similarity,
   builds the prompt and streams the response via SSE, citing which
   document(s) the answer came from.

## Security (minimal, single-instance)

- **Auth**: `users` + JWT. Owner routes (`/collections*`, `/auth/me`) require
  `Authorization: Bearer <token>`. Public: `/chat` (widget) and `/widget.js`.
- **Origin**: `/chat` validates `Origin` against `allowedOrigins` + `DASHBOARD_ORIGINS`
  (`CORS_RELAXED=false` in prod).
- **Rate limiting**: `/chat` 15 req/min per IP, `/auth` 10/min, rest 120/min.
- **Upload limits**: per-collection `maxFiles` / `maxFileSizeMb` settings, plus a
  hard server-side ceiling, reject oversized or excessive batches before processing.

## Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | no | Create user |
| POST | `/auth/login` | no | Login → JWT |
| GET | `/auth/me` | yes | Current user |
| POST | `/collections` | yes | Create collection |
| GET | `/collections` | yes | List collections (with counts) |
| GET | `/collections/:id` | yes | Detail: collection, last job, stats |
| PATCH | `/collections/:id` | yes | Name, origins, settings |
| DELETE | `/collections/:id` | yes | Delete collection |
| POST | `/collections/:id/upload` | yes | Upload files/folder + index |
| GET | `/collections/:id/status` | yes | Collection status and last job |
| GET | `/collections/:id/documents` | yes | Indexed documents (paginated `?offset&limit`) |
| GET | `/collections/:id/documents/:documentId` | yes | Document with extracted text |
| DELETE | `/collections/:id/documents/:documentId` | yes | Remove one document |
| POST | `/collections/:id/summary` | yes | Regenerate summary |
| POST | `/chat` | no | RAG with SSE streaming (public) |
| GET | `/widget.js` | no | Embeddable script |

## Main entity: `Collection`

`users` → `collections` → `documents` → `chunks` (vectors) · `ingest_jobs` · `chat_sessions` → `messages`.
Deleting a user or collection cascades and removes all its content.

## Scripts

**api**: `dev`, `build`, `start`, `typecheck`, `db:generate`, `db:migrate`, `db:push`, `seed:admin`
**web**: `dev`, `build`, `start`, `typecheck`
