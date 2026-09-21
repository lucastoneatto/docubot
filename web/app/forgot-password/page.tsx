'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { forgotPasswordAction } from '@/app/actions';
import { Alert, Button, Card, Field, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, {
    sent: false,
    error: null as string | null,
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card padding="lg" className="w-full max-w-sm">
        <form action={formAction} className="space-y-4">
          <div>
            <h1 className="t-h1">Reset your password</h1>
            <p className="t-body mt-1">We'll send you a link to choose a new one.</p>
          </div>

          {state.sent ? (
            <Alert tone="success">
              If that email has an account, you'll receive a link within a few minutes. It expires in 1 hour.
            </Alert>
          ) : (
            <>
              <Field id="email" label="Email">
                {(a) => <Input {...a} name="email" type="email" required autoComplete="email" />}
              </Field>

              {state.error && (
                <p role="alert" className="text-sm text-danger-solid">
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? 'Sending...' : 'Send link'}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-content-muted">
            <Link href="/login" className="text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
