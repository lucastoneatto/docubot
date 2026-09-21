import Link from 'next/link';
import { api } from '@/lib/api';
import { createCollectionAction } from '@/app/actions';
import { Button, Card, EmptyState, Field, Input, StatusPill } from '@/components/ui';
import { AutoRefresh } from '@/components/IngestProgress';

export default async function HomePage() {
  let collections: Awaited<ReturnType<typeof api.listCollections>> = [];
  let error: string | null = null;

  try {
    collections = await api.listCollections();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="space-y-10">
      <Card padding="lg">
        <h1 className="t-h1">New collection</h1>
        <p className="t-body mt-1">
          Give it a name. Then upload the files or folder you want the chatbot to
          learn from.
        </p>
        <form action={createCollectionAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field id="name" label="Name" className="min-w-0 flex-1">
            {(a) => <Input {...a} name="name" required placeholder="My collection" />}
          </Field>
          <Button type="submit" className="w-full sm:w-auto">Create</Button>
        </form>
      </Card>

      {/* If any collection is processing, the list refreshes itself. */}
      <AutoRefresh active={collections.some((collection) => collection.status === 'processing')} />

      <section className="space-y-3">
        <h2 className="t-h2">Collections</h2>

        {error && (
          <p role="alert" className="rounded-control border border-danger-border bg-danger-bg p-3 text-sm text-danger-text">
            Could not connect to the API: {error}
          </p>
        )}

        {!error && collections.length === 0 && (
          <EmptyState title="No collections yet" description="Create the first one with the form above." />
        )}

        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/dashboard/collections/${collection.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-content">{collection.name}</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs tabular-nums text-content-muted">
                {collection.documentCount} documents · {collection.chunkCount} chunks
              </span>
              <StatusPill status={collection.status} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
