import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-5 text-center', className)}>
      <p className="text-sm font-medium text-content">{title}</p>
      {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
