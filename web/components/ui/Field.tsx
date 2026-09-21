import type { ReactNode } from 'react';

export type FieldRenderProps = {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
};

export type FieldProps = {
  /**
   * Field id. Passed explicitly (usually the input's `name`, which is
   * already unique per form) instead of generating it with `useId()`,
   * because `useId` requires 'use client' and many dashboard forms render
   * on the server.
   */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldRenderProps) => ReactNode;
};

/**
 * Associates label + input + hint + error with the correct accessibility
 * attributes (htmlFor/id, aria-describedby, aria-invalid, role="alert").
 * Before this component, the project's 19 labels wrapped the input without
 * any id, which made this wiring impossible.
 */
export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-content">
        {label}
        {required && <span className="text-danger-solid"> *</span>}
      </label>
      <div className="mt-1">
        {children({
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
        })}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-content-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-danger-solid">
          {error}
        </p>
      )}
    </div>
  );
}
