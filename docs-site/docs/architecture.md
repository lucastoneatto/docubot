---
id: architecture
title: Architecture
sidebar_position: 2
---

# Architecture

## Two independent apps

`api/` and `web/` are separate Node projects, each with its own
`package.json`, lockfile, and `node_modules`. They only communicate over
HTTP — there is no shared TypeScript package or monorepo tooling (aside from
a `pnpm-workspace.yaml` used solely to allowlist native build scripts).

| App | Framework | Responsibility |
|---|---|---|
| `api/` | NestJS + Drizzle ORM | Auth, collection management, file ingestion, embeddings, chat/RAG, admin |
| `web/` | Next.js 15 (App Router) | Owner-facing dashboard: create collections, upload files/folders, view conversations |

The **chat widget** (`api/src/public/widget.js`) is a third, much smaller
runtime: a dependency-free vanilla JS script served directly by the API and
embedded on the *customer's* website, not on `web/`.

## Component map

```mermaid
flowchart TB
    subgraph Client-side
        Widget[widget.js<br/>embedded on customer sites]
        Dashboard[Next.js Dashboard]
    end

    subgraph API["NestJS API (api/)"]
        AuthM[Auth Module]
        CollectionsM[Collections Module]
        ChatM[Chat Module]
        FilesM[Files Module]
        IngestM[Ingest Module]
        EmbedM[Embeddings Module]
        SummaryM[Summary Module]
        AdminM[Admin Module]
        QueueM[Queue Module<br/>BullMQ]
    end

    DB[(PostgreSQL 16<br/>+ pgvector)]
    Redis[(Dragonfly<br/>Redis-compatible)]
    LLM[[OpenAI-compatible<br/>Chat API]]

    Dashboard -- JWT --> AuthM
    Dashboard -- JWT --> CollectionsM
    Dashboard -- JWT --> AdminM
    Widget -- public --> ChatM

    CollectionsM --> FilesM
    FilesM -- enqueue one job per file --> QueueM
    QueueM -- BullMQ Worker --> FilesM
    FilesM --> IngestM
    IngestM --> EmbedM
    FilesM --> SummaryM

    ChatM --> EmbedM
    ChatM --> LLM
    ChatM --> DB
    FilesM --> DB
    EmbedM --> DB
    AuthM --> DB
    CollectionsM --> DB
    AdminM --> DB
```

## Request flow: uploading files into a collection

```mermaid
sequenceDiagram
    actor Owner
    participant Dashboard
    participant CollectionsController
    participant FilesService
    participant Queue as BullMQ Queue
    participant Worker as BullMQ Worker
    participant Extract as extract.ts
    participant IngestService
    participant EmbeddingsService
    participant DB as PostgreSQL

    Owner->>Dashboard: Select files or a whole folder
    Dashboard->>CollectionsController: POST /collections/:id/upload (multipart, JWT)
    CollectionsController->>FilesService: ingestUpload(collectionId, files)
    FilesService->>FilesService: validate count/size against collection settings
    FilesService->>DB: insert ingest_jobs (status=running, filesFound=N)
    FilesService->>Queue: enqueue one job per file (buffer as base64)
    FilesService-->>Dashboard: 200 { jobId } (upload request returns immediately)

    loop per file job (parallel, bounded concurrency)
        Queue->>Worker: deliver file job
        Worker->>Extract: extractText(filename, buffer)
        Extract-->>Worker: plain text (PDF/DOCX/XLSX/CSV/TXT/MD all normalized)
        Worker->>Worker: hash extracted text
        Worker->>DB: upsert document (skip re-embedding if hash unchanged)
        alt content changed
            Worker->>IngestService: ingestDocument(text)
            IngestService->>IngestService: chunk text (~1500 chars)
            IngestService->>EmbeddingsService: embed each chunk
            EmbeddingsService->>DB: store chunks.embedding (vector)
        end
        Worker->>DB: increment ingest_jobs.filesProcessed
        Worker->>Worker: decrement pending counter (Redis)
    end

    Worker->>FilesService: pending counter reaches 0
    FilesService->>DB: update ingest_jobs (status=done)
    FilesService->>DB: update collections (status=ready)
    FilesService->>FilesService: regenerate collection summary (LLM)
```

## Why a per-file BullMQ job

Each uploaded file becomes its own BullMQ job, mirroring how the predecessor
project (a website crawler) gave each discovered page its own job:

- **Concurrency is a Worker setting** (`INGEST_FILE_CONCURRENCY`, default 4),
  applied *globally* across all collections uploading at once.
- **Crashes are recoverable**: BullMQ persists jobs in Redis; a restarted API
  process resumes any files still queued instead of losing an in-memory queue.
- **Slow extractions don't block the request**: `ingestUpload()` returns a
  `jobId` immediately after validating and enqueueing; the actual PDF/DOCX
  parsing and embedding happen asynchronously in the Worker.
- **Finalization is a race-free counter**: uploading a batch of N files sets
  a Redis `pending` counter to N; every completed job (success *or*
  exhausted retries) decrements it. Whichever worker takes it to zero
  finalizes the `ingest_jobs` row and flips the collection back to `ready`.

Unlike the crawler this replaced, there's no discovery loop — the browser
already knows exactly which files it's sending, so the job count is fixed
up front rather than growing as new URLs are found.

See [Ingestion Pipeline](./ingestion-pipeline) for the full mechanics.

## Deployment topology

```mermaid
flowchart LR
    subgraph Docker Compose
        db[(db<br/>pgvector/pgvector:pg16)]
        dragonfly[(dragonfly<br/>BullMQ backend)]
        api[api container<br/>NestJS, profile: full]
        web[web container<br/>Next.js, profile: full]
    end
    Internet((Internet)) --> web
    Internet --> api
    api --> db
    api --> dragonfly
    web --> api
```

`db` and `dragonfly` run by default (`docker compose up -d db dragonfly`);
`api` and `web` are gated behind the `full` Compose profile, since local
development typically runs them directly with `pnpm dev` for fast reload.
The API container mounts a `modelcache` volume so the local embedding model
(downloaded from Hugging Face on first run) survives container rebuilds.

## Module responsibilities (`api/src/`)

| Module | Key files | Responsibility |
|---|---|---|
| `auth/` | `auth.service.ts`, `auth.guard.ts` | Register/login, JWT issuance, password reset |
| `collections/` | `collections.service.ts`, `collections.controller.ts` | CRUD for collections, settings, origins, upload endpoint |
| `files/` | `files.service.ts`, `extract.ts` | BullMQ worker, per-file-type text extraction, document upsert |
| `ingest/` | `chunker.ts`, `ingest.service.ts` | Text chunking and chunk persistence |
| `embeddings/` | `embedding-provider.ts`, `local-embedding.provider.ts`, `openai-embedding.provider.ts` | Pluggable embedding backends |
| `chat/` | `chat.service.ts`, `chat.controller.ts` | Hybrid retrieval, prompt construction, SSE streaming |
| `summary/` | `summary.service.ts` | LLM-generated one-paragraph collection summary |
| `admin/` | `admin.service.ts`, `admin.guard.ts` | Platform-operator views (Basic Auth, separate from user JWT) |
| `queue/` | `queue.module.ts`, `bull-board.module.ts` | BullMQ queue wiring, Bull Board UI |
| `mail/` | `mail.service.ts` | SMTP password-reset emails |
| `usage/` | `usage.service.ts` | Token/cost accounting per collection |
