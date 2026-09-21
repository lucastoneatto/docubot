import { api } from '@/lib/api';
import { Alert, Badge, Card, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';

function formatTime(value: string) {
  return new Date(value).toLocaleString('en', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  let data: Awaited<ReturnType<typeof api.getConversation>> | null = null;
  let error: string | null = null;

  try {
    data = await api.getConversation(id, sessionId);
  } catch (e) {
    error = (e as Error).message;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Conversation"
          back={{ href: `/dashboard/collections/${id}/conversations`, label: 'Back to conversations' }}
        />
        <Alert tone="danger">Could not load the conversation: {error}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversation"
        description={formatTime(data.session.createdAt)}
        back={{ href: `/dashboard/collections/${id}/conversations`, label: 'Back' }}
      />

      <div className="space-y-3">
        {data.messages.map((message) => (
          <Card
            key={message.id}
            className={cn(message.role === 'assistant' && 'bg-canvas')}
          >
            <div className="flex items-center justify-between text-xs text-content-subtle">
              <span className="font-medium uppercase tracking-wide">
                {message.role === 'user' ? 'Visitor' : 'Bot'}
              </span>
              <span className="flex items-center gap-2">
                {message.noInfo && <Badge tone="warning">no answer</Badge>}
                {message.feedback === 'up' && <span>👍</span>}
                {message.feedback === 'down' && <span>👎</span>}
                {formatTime(message.createdAt)}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm text-content">
              {message.content}
            </p>

            {message.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2">
                {message.sources.map((source) => (
                  <span
                    key={source.path}
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-control bg-canvas px-2 py-0.5 text-xs text-content-muted"
                    title={source.path}
                  >
                    📄 {source.filename || source.path}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
