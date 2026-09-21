import { notFound } from 'next/navigation';
import { api, PUBLIC_API_URL } from '@/lib/api';
import { regenerateSummaryAction } from '@/app/actions';
import { WidgetEmbed } from '@/components/WidgetEmbed';
import { Badge, Button, PageHeader } from '@/components/ui';

export default async function CollectionPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof api.getCollection>>;
  try {
    detail = await api.getCollection(id);
  } catch {
    notFound();
  }

  const { collection } = detail;
  // Same as the widget's default value (api/src/public/widget.js): it's
  // the CLIENT'S brand color, not the DocuBot app's accent.
  const color = collection.settings.color || '#4f46e5';
  const hasContent = detail.stats.documentCount > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        back={{ href: `/dashboard/collections/${collection.id}`, label: collection.name }}
        actions={
          <>
            <Badge>Chat preview</Badge>
            <form action={regenerateSummaryAction}>
              <input type="hidden" name="id" value={collection.id} />
              <Button type="submit" variant="secondary" size="sm" disabled={!hasContent}>
                Regenerate summary
              </Button>
            </form>
          </>
        }
      />

      <article className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div
          className="px-8 py-14 text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              Collection
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">{collection.name}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-8 py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-content-subtle">
            Summary
          </h2>

          {collection.summary ? (
            <p className="mt-3 text-lg leading-relaxed text-content-secondary">{collection.summary}</p>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-content-muted">
                {hasContent
                  ? 'No summary yet. Generate it with the "Regenerate summary" button.'
                  : 'This collection has no documents yet. Upload files first.'}
              </p>
              {hasContent && (
                <form action={regenerateSummaryAction}>
                  <input type="hidden" name="id" value={collection.id} />
                  <button
                    type="submit"
                    className="rounded-control px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    Generate summary
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="mt-8 text-xs text-content-subtle">
            {detail.stats.documentCount} documents · {detail.stats.chunkCount} chunks indexed.
            The chatbot is shown in the bottom right.
          </p>
        </div>
      </article>

      <WidgetEmbed
        collectionId={collection.id}
        apiUrl={PUBLIC_API_URL}
        color={color}
        greeting={collection.settings.greeting}
        title={collection.name}
      />
    </div>
  );
}
