import Link from 'next/link';
import type { ReactNode } from 'react';

export type PageHeaderProps = {
  /** Omitted when the header is just a back-link + actions (see landing preview). */
  title?: string;
  description?: string;
  eyebrow?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
};

export function PageHeader({ title, description, eyebrow, back, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      {/* min-w-0 lets the child shrink below its content's width: without
          it, a long URL forces the width and overflows on mobile. */}
      <div className="min-w-0 flex-1">
        {back && (
          <Link href={back.href} className="text-xs text-content-muted hover:underline">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <p className="t-eyebrow mt-1">{eyebrow}</p>}
        {title && <h1 className={back || eyebrow ? 'mt-1 t-h1 break-words' : 't-h1 break-words'}>{title}</h1>}
        {description && (
          <p className="mt-1 break-words text-sm text-content-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
  );
}
