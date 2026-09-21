'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './Button';

export type SubmitButtonProps = Omit<ButtonProps, 'type'> & {
  pendingLabel?: string;
};

/**
 * The system's only 'use client' primitive: useFormStatus only reports the
 * pending state of the closest ancestor <form>, so this button must render
 * inside it. The 4 auth pages use useActionState() instead and do NOT
 * migrate to this component: mixing the two "pending" mechanisms would risk
 * a regression for no gain.
 */
export function SubmitButton({ pendingLabel, children, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
