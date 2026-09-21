import { cn } from '@/lib/cn';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

const BASE =
  'w-full rounded-control border bg-surface px-3 py-2 text-sm text-content ' +
  'placeholder:text-content-subtle disabled:opacity-50';

function borderClasses(invalid?: boolean) {
  return invalid ? 'border-danger-solid' : 'border-line-strong';
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      className={cn(BASE, borderClasses(invalid), FOCUS_RING, className)}
      {...props}
    />
  );
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(BASE, borderClasses(invalid), FOCUS_RING, className)}
      {...props}
    />
  );
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function Select({ invalid, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(BASE, borderClasses(invalid), FOCUS_RING, className)}
      {...props}
    />
  );
}
