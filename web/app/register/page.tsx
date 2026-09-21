'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerAction } from '@/app/actions';
import { Button, Card, Field, Input } from '@/components/ui';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {
    error: null as string | null,
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card padding="lg" className="w-full max-w-sm">
        <form action={formAction} className="space-y-4">
          <div>
            <h1 className="t-h1">Create account</h1>
            <p className="t-body mt-1">Your first bot up and running in 5 minutes. No card required.</p>
          </div>

          <Field id="email" label="Email">
            {(a) => <Input {...a} name="email" type="email" required autoComplete="email" />}
          </Field>

          <Field id="password" label="Password" hint="Minimum 8 characters.">
            {(a) => (
              <Input {...a} name="password" type="password" required minLength={8} autoComplete="new-password" />
            )}
          </Field>

          {state.error && (
            <p role="alert" className="text-sm text-danger-solid">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-center text-xs text-content-muted">
            By creating an account you accept the{' '}
            <Link href="/legal/terminos" className="text-accent hover:underline">
              Terms of Service
            </Link>{' '}
            and the{' '}
            <Link href="/legal/privacidad" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-center text-sm text-content-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
