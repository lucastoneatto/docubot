import { cn } from '@/lib/cn';

export type StatProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger';
  className?: string;
};

/**
 * Replaces 3 local "Stat" definitions (admin/page.tsx, conversations
 * /page.tsx, and an inline version in sites/[id]/page.tsx), each with a
 * slightly different size.
 */
export function Stat({ label, value, hint, tone = 'default', className }: StatProps) {
  return (
    <div className={className}>
      <p className="text-sm text-content-muted">{label}</p>
      <p className={cn('t-figure mt-1', tone === 'danger' && 'text-danger-solid')}>{value}</p>
      {hint && <p className="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  );
}
