import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-action text-content-inverse hover:bg-action-hover disabled:opacity-50',
  secondary:
    'border border-line-strong bg-surface text-content-secondary hover:bg-elevated disabled:opacity-50',
  danger:
    'border border-danger-border text-danger-text hover:bg-danger-bg disabled:opacity-50',
  ghost: 'text-content-secondary hover:bg-elevated disabled:opacity-50',
  // For dark backgrounds (hero, final CTA): white over inverse.
  inverse:
    'bg-white text-inverse hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-inverse disabled:opacity-50',
};

/**
 * Composes a button's classes without rendering it: used by Button and
 * LinkButton so they don't duplicate the variant/size map between the two.
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors',
    FOCUS_RING,
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Server component: no dashboard form passes it an event handler (they use
 * `<form action={serverAction}>`), so 'use client' isn't needed here. See
 * SubmitButton for the case that does need pending state.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props} />
  );
}
