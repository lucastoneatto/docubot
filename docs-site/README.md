# DocuBot Docs Site

This is a [Docusaurus](https://docusaurus.io/) site built from the Markdown
sources in [`/docs`](../docs) at the repo root. It's the browsable version of
the same technical documentation — architecture, data model, RAG pipeline,
API reference, security, frontend structure, and setup guide — with
Mermaid diagrams rendered as interactive SVGs.

## Development

```bash
pnpm install
pnpm start        # http://localhost:3000, hot reload
```

## Production build

```bash
pnpm build        # outputs static site to ./build
pnpm serve        # serve the built site locally
```

## Keeping content in sync

The Markdown files in `docs/` are copies of `../docs/*.md` with Docusaurus
frontmatter (`id`, `title`, `sidebar_position`) added and internal links
adjusted to Docusaurus's clean-URL routing. If you edit the canonical docs at
the repo root, re-sync the copies here (frontmatter + link rewrites) rather
than editing both independently.
