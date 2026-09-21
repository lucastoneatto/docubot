'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions';
import { Button, Card, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {
    error: null as string | null,
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card padding="lg" className="w-full max-w-sm">
        <form action={formAction} className="space-y-4">
          <div>
            <h1 className="t-h1">Sign in</h1>
            <p className="t-body mt-1">Access your DocuBot dashboard</p>
          </div>

          <Field id="email" label="Email">
            {(a) => <Input {...a} name="email" type="email" required autoComplete="email" />}
          </Field>

          <Field id="password" label="Password">
            {(a) => (
              <Input {...a} name="password" type="password" required autoComplete="current-password" />
            )}
          </Field>

          {state.error && (
            <p role="alert" className="text-sm text-danger-solid">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="flex justify-between text-sm text-content-muted">
            <Link href="/forgot-password" className="text-accent hover:underline">
              Forgot my password
            </Link>
            <Link href="/register" className="text-accent hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
