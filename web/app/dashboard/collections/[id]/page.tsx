import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, embedSnippet, PUBLIC_API_URL } from '@/lib/api';
import {
  deleteCollectionAction,
  updateSettingsAction,
} from '@/app/actions';
import { ChatPlayground } from '@/components/ChatPlayground';
import { CopyButton } from '@/components/CopyButton';
import { IngestProgress } from '@/components/IngestProgress';
import { DocumentRow } from '@/components/DocumentDetailModal';
import { UploadForm } from '@/components/UploadForm';
import { formatBytes } from '@/lib/format';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Stat,
  StatusPill,
  TBody,
  TH,
  THead,
  Table,
  Textarea,
} from '@/components/ui';

const DOCUMENTS_PER_PAGE = 15;

/**
 * Deliberately different from money() in lib/format.ts: here trailing zeros
 * are trimmed and exact zero shows as "$0.00", while money() always gives 4
 * fixed decimals. These are legitimately different formats: don't unify
 * them without deciding to, or the on-screen amounts would suddenly change.
 */
function formatUsd(value: number): string {
  if (!value || value === 0) return '$0.00';
  const trimmed = value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return `$${trimmed}`;
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const offset = (currentPage - 1) * DOCUMENTS_PER_PAGE;

  let detail: Awaited<ReturnType<typeof api.getCollection>>;
  let documentList: Awaited<ReturnType<typeof api.listDocuments>>;
  try {
    [detail, documentList] = await Promise.all([
      api.getCollection(id),
      api.listDocuments(id, offset, DOCUMENTS_PER_PAGE),
    ]);
  } catch {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(documentList.total / DOCUMENTS_PER_PAGE));

  const { collection, job, stats, usage } = detail;
  const snippet = embedSnippet(collection.id);

  return (
    <div className="space-y-10">
      <PageHeader
        back={{ href: '/dashboard', label: 'Collections' }}
        title={collection.name}
        actions={
          <>
            <StatusPill status={collection.status} />
            <LinkButton href={`/dashboard/collections/${collection.id}/preview`} variant="secondary">
              View preview
            </LinkButton>
            <form action={deleteCollectionAction}>
              <input type="hidden" name="id" value={collection.id} />
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </>
        }
      />

      <IngestProgress
        status={collection.status}
        filesProcessed={job?.filesProcessed ?? 0}
        filesFound={job?.filesFound ?? 0}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm">
          <Stat label="Documents" value={String(stats.documentCount)} />
        </Card>
        <Card padding="sm">
          <Stat label="Indexed chunks" value={String(stats.chunkCount)} />
        </Card>
        <Card padding="sm">
          <Stat label="Messages" value={String(stats.messageCount)} />
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>AI spend</CardTitle>
          <span className="text-sm font-semibold tabular-nums text-content">
            {formatUsd(usage.total)}
          </span>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-content-muted">Indexing (embeddings)</dt>
            <dd className="tabular-nums sm:text-right">
              {formatUsd(usage.indexing.cost)} · {usage.indexing.files} files ·{' '}
              <span className="text-content-muted">
                ~{formatUsd(usage.avgPerFile)}/file
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-content-muted">Chat</dt>
            <dd className="tabular-nums sm:text-right">
              {formatUsd(usage.chat.cost)} · {usage.chat.messages} messages ·{' '}
              <span className="text-content-muted">
                ~{formatUsd(usage.avgPerMessage)}/message
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-content-muted">Summaries</dt>
            <dd className="tabular-nums sm:text-right">
              {formatUsd(usage.summary.cost)} · {usage.summary.generations}{' '}
              generations
            </dd>
          </div>
        </dl>

        {(collection.monthlyMessageLimit !== null ||
          collection.monthlyBudgetUsd !== null) && (
          <p className="mt-3 border-t border-line pt-3 text-xs tabular-nums text-content-muted">
            Collection plan:{' '}
            {collection.monthlyMessageLimit !== null && (
              <>{collection.monthlyMessageLimit.toLocaleString('en')} messages/month</>
            )}
            {collection.monthlyMessageLimit !== null &&
              collection.monthlyBudgetUsd !== null &&
              ' · '}
            {collection.monthlyBudgetUsd !== null && (
              <>cap of ${collection.monthlyBudgetUsd}/month</>
            )}
            . To raise it, contact your administrator.
          </p>
        )}

        <a
          href={`/dashboard/collections/${collection.id}/conversations`}
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          View conversations and analytics →
        </a>
      </Card>

      {job && (
        <Card padding="sm" className="text-sm">
          <div className="font-medium text-content">Last upload</div>
          <div className="mt-1 text-content-secondary">
            Status: {job.status} · {job.filesProcessed}/{job.filesFound} files
          </div>
          {job.error && <Alert tone="danger" className="mt-2">{job.error}</Alert>}
        </Card>
      )}

      <Card>
        <CardTitle>1. Paste this script on your site</CardTitle>
        <p className="t-body mt-1">
          Add the snippet before <code>&lt;/body&gt;</code>. The widget will appear
          automatically.
        </p>
        <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row">
          {/* min-w-0 so the <pre> can shrink and trigger its own horizontal
              scroll instead of stretching the flex row. */}
          <pre className="w-full min-w-0 flex-1 overflow-x-auto rounded-control bg-inverse p-3 text-xs text-content-inverse">
            {snippet}
          </pre>
          <CopyButton value={snippet} />
        </div>
      </Card>

      <Card>
        <CardTitle>2. Test the chatbot</CardTitle>
        <div className="mt-3">
          <ChatPlayground
            collectionId={collection.id}
            apiUrl={PUBLIC_API_URL}
            greeting={collection.settings.greeting}
            color={collection.settings.color}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>3. Upload documents</CardTitle>
        <p className="t-body mt-1">
          Upload loose files or an entire folder. Files are processed and
          indexed in the background.
        </p>
        <div className="mt-4">
          <UploadForm collectionId={collection.id} />
        </div>
      </Card>

      <Card>
        <CardTitle>4. Settings</CardTitle>
        <form action={updateSettingsAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={collection.id} />

          <Field id="name" label="Name">
            {(a) => <Input {...a} name="name" defaultValue={collection.name} />}
          </Field>

          <Field id="color" label="Color">
            {(a) => (
              <input
                {...a}
                name="color"
                type="color"
                defaultValue={collection.settings.color}
                className="h-[38px] w-full rounded-control border border-line-strong px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              />
            )}
          </Field>

          <Field id="greeting" label="Greeting">
            {(a) => <Input {...a} name="greeting" defaultValue={collection.settings.greeting} />}
          </Field>

          <Field id="temperature" label="Temperature">
            {(a) => (
              <Input
                {...a}
                name="temperature"
                type="number"
                step="0.1"
                min="0"
                max="1"
                defaultValue={collection.settings.temperature}
              />
            )}
          </Field>

          <Field id="maxFiles" label="Maximum files">
            {(a) => (
              <Input
                {...a}
                name="maxFiles"
                type="number"
                min="1"
                max="5000"
                defaultValue={collection.settings.maxFiles ?? 200}
              />
            )}
          </Field>

          <Field id="maxFileSizeMb" label="Max file size (MB)">
            {(a) => (
              <Input
                {...a}
                name="maxFileSizeMb"
                type="number"
                min="1"
                max="200"
                defaultValue={collection.settings.maxFileSizeMb ?? 20}
              />
            )}
          </Field>

          <Field
            id="customPrompt"
            label="Bot personality (optional)"
            hint="Added to the base instructions. It cannot bypass the safety rules or make up information outside the indexed content."
            className="sm:col-span-2"
          >
            {(a) => (
              <Textarea
                {...a}
                name="customPrompt"
                rows={4}
                placeholder="E.g.: You are the onboarding assistant. Speak informally to the user, be brief, and end by offering the next step."
                defaultValue={collection.settings.customPrompt ?? ''}
              />
            )}
          </Field>

          <Field
            id="allowedOrigins"
            label="Allowed origins (one per line)"
            className="sm:col-span-2"
          >
            {(a) => (
              <Textarea
                {...a}
                name="allowedOrigins"
                rows={3}
                defaultValue={collection.allowedOrigins.join('\n')}
                className="font-mono text-xs"
              />
            )}
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="t-h2">Documents ({documentList.total})</h2>

        {documentList.items.length === 0 ? (
          <EmptyState
            title="No documents yet."
            description="Upload files or a folder above to start indexing content."
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>Filename</TH>
                  <TH>Path</TH>
                  <TH>Size</TH>
                  <TH>Uploaded</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </THead>
              <TBody>
                {documentList.items.map((doc) => (
                  <DocumentRow key={doc.id} document={doc} collectionId={collection.id} />
                ))}
              </TBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-content-muted">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/collections/${collection.id}?page=${currentPage - 1}`}
                    scroll={false}
                    aria-disabled={currentPage <= 1}
                    className={
                      currentPage <= 1
                        ? 'pointer-events-none rounded-control border border-line px-3 py-1.5 text-content-subtle'
                        : 'rounded-control border border-line-strong px-3 py-1.5 hover:bg-elevated'
                    }
                  >
                    ← Previous
                  </Link>
                  <Link
                    href={`/dashboard/collections/${collection.id}?page=${currentPage + 1}`}
                    scroll={false}
                    aria-disabled={currentPage >= totalPages}
                    className={
                      currentPage >= totalPages
                        ? 'pointer-events-none rounded-control border border-line px-3 py-1.5 text-content-subtle'
                        : 'rounded-control border border-line-strong px-3 py-1.5 hover:bg-elevated'
                    }
                  >
                    Next →
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
