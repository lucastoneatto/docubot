---
id: setup
title: Setup Guide
sidebar_position: 9
---

# Setup Guide

## Quickstart — one command, Docker only

The fastest way to run the whole stack locally. Requires only Docker and an
OpenAI-compatible API key.

```bash
git clone <repo-url> docubot && cd docubot
cp .env.example .env
```

Edit `.env` and set your key:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Every other variable already has a working local default. Then:

```bash
docker compose --profile full up --build
```

Once all four services (`db`, `dragonfly`, `api`, `web`) report healthy,
open **http://localhost:3000**. Register an account from there, or create
the seeded admin user once with:

```bash
docker compose exec api pnpm seed:admin
```

then log in with `admin@docubot.local` / `password1234`.

Stop everything with `docker compose down` (add `-v` to also wipe the
database volume).

This mode builds and runs `api` and `web` as containers too (the `full`
Compose profile) — simplest to get started, but it rebuilds images on every
code change. For active development with hot reload, use the manual setup
below instead.

## Manual setup (hot reload, for active development)

### Requirements

- Node 24 (`.nvmrc` provided — `nvm use`)
- pnpm 10
- Docker (for PostgreSQL + pgvector and Dragonfly/Redis)

`api/` and `web/` are independent projects: each needs its own
`pnpm install`.

### Steps

```bash
# 0. Use the pinned Node version
nvm use

# 1. Environment variables
cp .env.example .env                       # set OPENAI_API_KEY and JWT_SECRET
cp web/.env.example web/.env.local

# 2. Database + queue backend
docker compose up -d db dragonfly

# 3. API (terminal 1)
cd api
pnpm install
pnpm db:migrate
pnpm seed:admin                            # creates an admin user from SEED_ADMIN_* env vars
pnpm dev                                   # http://localhost:3001

# 4. Web (terminal 2)
cd web
pnpm install
pnpm dev                                   # http://localhost:3000
```

## Key environment variables

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://docubot:docubot@localhost:5432/docubot` | |
| `JWT_SECRET` | *(dev placeholder — must be overridden in prod)* | Boot fails in production if left as a placeholder |
| `OPENAI_API_KEY` | – | Required for chat completions (and OpenAI embeddings, if used) |
| `CHAT_BASE_URL` | `https://api.openai.com/v1` | Point at any OpenAI-compatible provider |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | |
| `EMBEDDING_PROVIDER` | `local` | `local` (free, CPU) or `openai` |
| `INGEST_MAX_FILES` | 200 | Per-collection default, overridable per collection in settings |
| `INGEST_MAX_FILE_SIZE_MB` | 100 | Per-collection default, overridable per collection in settings |
| `INGEST_FILE_CONCURRENCY` | 4 | Global BullMQ worker concurrency (files processed in parallel) |
| `CORS_RELAXED` | `false` | Must stay `false` in production |
| `DASHBOARD_ORIGINS` | `http://localhost:3000` | Comma-separated allowlist for the dashboard's own chat preview |
| `ADMIN_USER` / `ADMIN_PASSWORD` | – | Required in production (12+ char password) |
| `BULL_BOARD_USER` / `BULL_BOARD_PASSWORD` | falls back to admin creds | Required in production |
| `REDIS_URL` | `redis://localhost:6379` | BullMQ backend (Dragonfly in Compose) |
| `CONVERSATION_RETENTION_DAYS` | 180 | `0` = keep indefinitely |

See `api/src/config.ts` for the full list, including per-token pricing
overrides used for usage/cost accounting.

## First run

1. Log in at `http://localhost:3000` — `admin@docubot.local` / `password1234`
   if you ran `pnpm seed:admin`, or register a new account.
2. Create a collection, giving it a name.
3. Click **Upload files** (pick one or more documents) or **Upload a
   folder** (submit an entire directory tree via the browser's folder
   picker) — supported formats: PDF, DOCX, TXT, MD, XLSX, XLS, CSV. Content
   is extracted and indexed with local embeddings (no API cost).
4. Open **Preview** to try the chat against what's indexed so far.
5. Copy the embed snippet onto the target site:

```html
<script src="http://localhost:3001/widget.js" data-collection-id="YOUR_COLLECTION_ID" defer></script>
```

Widget options: `data-color`, `data-title`, `data-greeting`,
`data-position` (`left`/`right`), `data-api` (defaults to the script's own
origin).

## Scripts

**`api/`**: `dev`, `build`, `start`, `typecheck`, `db:generate`,
`db:migrate`, `db:push`, `seed:admin`

**`web/`**: `dev`, `build`, `start`, `typecheck`
