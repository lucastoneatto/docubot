import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const PADDING = { sm: 'p-4', md: 'p-5', lg: 'p-6' } as const;

export type CardProps = {
  padding?: keyof typeof PADDING;
  className?: string;
  children: ReactNode;
};

export function Card({ padding = 'md', className, children }: CardProps) {
  return (
    <div className={cn('rounded-card border border-line bg-surface', PADDING[padding], className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex items-center justify-between gap-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cn('t-h3', className)}>{children}</h2>;
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('t-body mt-1', className)}>{children}</p>;
}
