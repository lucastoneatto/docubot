'use client';

import { useState } from 'react';
import { renderMessage } from '@/lib/markdown';

type Source = { filename: string; path: string; score: number };
type Message = { role: 'user' | 'assistant'; content: string; sources?: Source[] };

export function ChatPlayground({
  collectionId,
  apiUrl,
  greeting,
  color,
}: {
  collectionId: string;
  apiUrl: string;
  greeting: string;
  color: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  async function send() {
    const question = input.trim();
    if (!question || busy) return;

    setBusy(true);
    setInput('');
    const history = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '' },
    ]);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, message: question, sessionId, history }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      let sources: Source[] = [];

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const payload = JSON.parse(line.slice(5).trim());

          if (payload.type === 'session') setSessionId(payload.sessionId);
          if (payload.type === 'sources') {
            sources = payload.sources ?? [];
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = { ...last, sources };
              }
              return next;
            });
          }
          if (payload.type === 'token') {
            answer += payload.value;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: answer, sources };
              return next;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Error al conectar con la API.',
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-card border border-line bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-xl px-3 py-2 text-sm text-white'
                : 'mr-auto max-w-[85%] rounded-xl border border-line bg-canvas px-3 py-2 text-sm'
            }
            style={message.role === 'user' ? { backgroundColor: color } : undefined}
          >
            <div className="whitespace-pre-wrap break-words">
              {busy && index === messages.length - 1 ? (
                message.content || '…'
              ) : (
                <span
                  dangerouslySetInnerHTML={{
                    __html: renderMessage(message.content || ''),
                  }}
                />
              )}
            </div>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2">
                {message.sources.slice(0, 4).map((source) => (
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
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-line p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
          placeholder="Escribe tu pregunta..."
          className="min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="shrink-0 rounded-control px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          style={{ backgroundColor: color }}
        >
          {busy ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
