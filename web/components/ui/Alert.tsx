import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<AlertTone, string> = {
  info: 'border-info-border bg-info-bg text-info-text',
  success: 'border-success-border bg-success-bg text-success-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  danger: 'border-danger-border bg-danger-bg text-danger-text',
};

export type AlertProps = {
  tone?: AlertTone;
  title?: string;
  className?: string;
  children: ReactNode;
};

/**
 * role="alert" only on warning/danger: a static informational panel
 * announcing itself as an "alert!" on every page load is noise for
 * screen-reader users.
 */
export function Alert({ tone = 'info', title, className, children }: AlertProps) {
  const isUrgent = tone === 'warning' || tone === 'danger';
  return (
    <div
      role={isUrgent ? 'alert' : undefined}
      className={cn('rounded-card border p-4 text-sm', TONE_CLASSES[tone], className)}
    >
      {title && <p className="font-medium">{title}</p>}
      <div className={title ? 'mt-1' : undefined}>{children}</div>
    </div>
  );
}
