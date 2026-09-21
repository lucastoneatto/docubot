'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { deleteDocumentAction } from '@/app/actions';
import type { DocumentItem } from '@/lib/api';
import { formatBytes } from '@/lib/format';

type Status = 'idle' | 'loading' | 'error';
type DeleteStatus = 'idle' | 'deleting' | 'error';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Table row + detail modal. The <dialog> is portaled to document.body: HTML
 * doesn't allow a <dialog> inside <tr>/<tbody>, so it can't be nested in the
 * row's tree even though React mounts it "from" here.
 */
export function DocumentRow({
  document: doc,
  collectionId,
}: {
  document: DocumentItem;
  collectionId: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>('idle');

  async function openModal() {
    // The <dialog> only exists in the DOM after the first render with
    // mounted=true; showModal() fires on the next tick via an effect-like
    // callback ref, so we do it with a microtask after the setState.
    setMounted(true);
    queueMicrotask(() => dialogRef.current?.showModal());

    if (extractedText !== null || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/collections/${collectionId}/documents/${doc.id}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { extractedText: string };
      setExtractedText(data.extractedText);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${doc.filename}"? This also removes its indexed content and cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleteStatus('deleting');
    try {
      const formData = new FormData();
      formData.set('id', collectionId);
      formData.set('documentId', doc.id);
      await deleteDocumentAction(formData);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setDeleteStatus('error');
    }
  }

  const modal = mounted
    ? createPortal(
        <dialog
          ref={dialogRef}
          onClose={() => setMounted(false)}
          onClick={(e) => {
            if (e.target === dialogRef.current) dialogRef.current?.close();
          }}
          className="m-auto max-h-[85vh] w-full max-w-2xl rounded-card border border-line bg-surface p-0 text-content shadow-xl backdrop:bg-inverse/60"
        >
          <div className="flex items-start justify-between gap-4 border-b border-line p-4">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-content">{doc.filename}</h3>
              <p className="mt-0.5 truncate text-xs text-content-muted">{doc.path}</p>
              <p className="mt-0.5 text-xs text-content-subtle">
                Uploaded on {formatDate(doc.uploadedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteStatus === 'deleting'}
                className="rounded-control px-2 py-1 text-xs font-medium text-danger-text hover:bg-danger-bg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {deleteStatus === 'deleting' ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="rounded-control p-1 text-content-muted hover:bg-elevated hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] overflow-auto p-4">
            {deleteStatus === 'error' && (
              <p className="mb-3 text-sm text-danger-solid">
                Could not delete this document. Try again.
              </p>
            )}
            {status === 'loading' && (
              <p className="text-sm text-content-muted">Loading content…</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-danger-solid">
                Could not load this document's content.
              </p>
            )}
            {status === 'idle' && extractedText !== null && (
              <pre className="whitespace-pre-wrap rounded-control bg-canvas p-3 text-xs text-content-secondary">
                {extractedText}
              </pre>
            )}
          </div>
        </dialog>,
        document.body,
      )
    : null;

  return (
    <>
      <tr className="border-b border-line-subtle last:border-0">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={openModal}
            className="line-clamp-1 text-left font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {doc.filename}
          </button>
        </td>
        <td className="max-w-xs truncate px-4 py-3 text-content-muted">{doc.path}</td>
        <td className="px-4 py-3 text-content-muted">{formatBytes(doc.fileSizeBytes)}</td>
        <td className="px-4 py-3 text-content-muted">{formatDate(doc.uploadedAt)}</td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteStatus === 'deleting'}
            className="rounded-control px-2 py-1 text-xs font-medium text-danger-text hover:bg-danger-bg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {deleteStatus === 'deleting' ? 'Deleting…' : 'Delete'}
          </button>
        </td>
      </tr>
      {modal}
    </>
  );
}
