'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** How often status is polled while ingestion is running. */
const POLL_MS = 3000;

/**
 * Silent refresh, no UI: for views where the status is already visible (the
 * collection list shows its own badge) and the data just needs to update
 * itself while any ingest job is in progress.
 */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  const wasActive = useRef(active);

  useEffect(() => {
    if (!active) {
      // When the last job finishes, one final refresh brings the view up to date.
      if (wasActive.current) router.refresh();
      wasActive.current = false;
      return;
    }
    wasActive.current = true;
    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [active, router]);

  return null;
}

export type IngestProgressProps = {
  /** Collection status at server render time. */
  status: string;
  /** Files already processed, to detect progress without reloading the whole view. */
  filesProcessed: number;
  filesFound: number;
};

/**
 * While the collection is "processing", refreshes the server components
 * every few seconds so uploaded documents and counters update on their own,
 * without the user having to reload.
 *
 * Uses router.refresh() instead of calling the API from the browser because
 * the session token is an httpOnly cookie: the client can't read it, but
 * Next does forward it when re-rendering on the server.
 */
export function IngestProgress({ status, filesProcessed, filesFound }: IngestProgressProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());

  const active = status === 'processing';

  useEffect(() => {
    if (!active) return;

    const poll = setInterval(() => {
      router.refresh();
    }, POLL_MS);

    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [active, router]);

  // On completion, one last refresh leaves the view consistent (summary,
  // "Ready" status, indexed documents) without waiting for the next interval.
  const wasActive = useRef(active);
  useEffect(() => {
    if (wasActive.current && !active) router.refresh();
    wasActive.current = active;
  }, [active, router]);

  if (!active) return null;

  const pct = filesFound > 0 ? Math.min(100, Math.round((filesProcessed / filesFound) * 100)) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-card border border-warning-border bg-warning-bg p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-warning-text">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-text opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning-text" />
          </span>
          Processing uploaded files…
        </span>
        <span className="text-xs tabular-nums text-warning-text">
          {filesProcessed}
          {filesFound > 0 ? ` / ${filesFound}` : ''} files · {elapsed}s
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-warning-text/15">
        <div
          className="h-full rounded-full bg-warning-text transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-warning-text/80">
        This page updates itself. You can keep navigating.
      </p>
    </div>
  );
}
