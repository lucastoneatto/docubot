import type { CollectionStatus } from '@/lib/api';
import { Badge, type BadgeTone } from './Badge';

/**
 * Used to live duplicated: dashboard/page.tsx had STATUS_LABELS/STATUS_STYLES,
 * collections/[id]/page.tsx repeated STATUS_LABELS, and admin/users/page.tsx
 * had its own inline map for the user's plan. This component is the single
 * source of truth for a collection's status.
 */
const LABELS: Record<CollectionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready',
  error: 'Error',
};

const TONES: Record<CollectionStatus, BadgeTone> = {
  pending: 'neutral',
  processing: 'warning',
  ready: 'success',
  error: 'danger',
};

export function StatusPill({ status }: { status: CollectionStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
