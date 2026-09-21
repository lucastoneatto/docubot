import { api, type ConversationItem } from '@/lib/api';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Stat,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from '@/components/ui';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let items: ConversationItem[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const data = await api.listConversations(id);
    items = data.items;
    total = data.total;
  } catch (e) {
    error = (e as Error).message;
  }

  // Basic analytics over the loaded page.
  const noInfo = items.reduce((sum, item) => sum + item.noInfoCount, 0);
  const up = items.reduce((sum, item) => sum + item.thumbsUp, 0);
  const down = items.reduce((sum, item) => sum + item.thumbsDown, 0);
  const answered = items.reduce((sum, item) => sum + item.messageCount, 0);
  const coverage =
    answered > 0 ? Math.round(((answered - noInfo) / answered) * 100) : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="What people ask your bot and what it couldn't answer."
        back={{ href: `/dashboard/collections/${id}`, label: 'Back to collection' }}
      />

      {error ? (
        <Alert tone="danger">Could not load conversations: {error}</Alert>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="sm">
              <Stat label="Conversations" value={String(total)} />
            </Card>
            <Card padding="sm">
              <Stat label="Coverage" value={`${coverage}%`} hint="Answers with information" />
            </Card>
            <Card padding="sm">
              <Stat label="No answer" value={String(noInfo)} hint="Content opportunities" />
            </Card>
            <Card padding="sm">
              <Stat label="Ratings" value={`${up} 👍 · ${down} 👎`} />
            </Card>
          </section>

          {items.length === 0 ? (
            <EmptyState
              title="No conversations yet."
              description="Once someone uses the widget, they'll show up here."
            />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>First question</TH>
                  <TH numeric>Messages</TH>
                  <TH>No answer</TH>
                  <TH>Last activity</TH>
                </tr>
              </THead>
              <TBody>
                {items.map((item) => (
                  <TR key={item.id}>
                    <TD className="max-w-md">
                      <a
                        href={`/dashboard/collections/${id}/conversations/${item.id}`}
                        className="line-clamp-2 text-accent hover:underline"
                      >
                        {item.preview ?? '(no content)'}
                      </a>
                    </TD>
                    <TD numeric>{item.messageCount}</TD>
                    <TD>
                      {item.noInfoCount > 0 ? (
                        <Badge tone="warning">{item.noInfoCount}</Badge>
                      ) : (
                        <span className="text-content-subtle">—</span>
                      )}
                    </TD>
                    <TD className="text-content-muted">
                      {formatDate(item.lastMessageAt ?? item.createdAt)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
