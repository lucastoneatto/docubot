import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-card border border-line bg-surface', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('border-b border-line-subtle last:border-0', className)}>{children}</tr>;
}

export type THProps = ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };

export function TH({ numeric, className, ...props }: THProps) {
  return (
    <th
      className={cn('px-4 py-3', numeric && 'text-right tabular-nums', className)}
      {...props}
    />
  );
}

export type TDProps = TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };

export function TD({ numeric, className, ...props }: TDProps) {
  return (
    <td className={cn('px-4 py-3', numeric && 'text-right tabular-nums', className)} {...props} />
  );
}
