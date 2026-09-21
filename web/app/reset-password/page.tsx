'use client';

import Link from 'next/link';
import { use, useActionState } from 'react';
import { resetPasswordAction } from '@/app/actions';
import { Button, Card, Field, Input, LinkButton } from '@/components/ui';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const [state, formAction, pending] = useActionState(resetPasswordAction, {
    error: null as string | null,
  });

  if (!token) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card padding="lg" className="w-full max-w-sm space-y-3">
          <h1 className="t-h1">Invalid link</h1>
          <p className="t-body">The recovery token is missing. Request a new link.</p>
          <LinkButton href="/forgot-password">Request link</LinkButton>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card padding="lg" className="w-full max-w-sm">
        <form action={formAction} className="space-y-4">
          <div>
            <h1 className="t-h1">New password</h1>
            <p className="t-body mt-1">Choose a new password.</p>
          </div>

          <input type="hidden" name="token" value={token} />

          <Field id="password" label="Password">
            {(a) => (
              <Input {...a} name="password" type="password" required minLength={8} autoComplete="new-password" />
            )}
          </Field>

          <Field id="confirm" label="Confirm password">
            {(a) => (
              <Input {...a} name="confirm" type="password" required minLength={8} autoComplete="new-password" />
            )}
          </Field>

          {state.error && (
            <p role="alert" className="text-sm text-danger-solid">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving...' : 'Save password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
