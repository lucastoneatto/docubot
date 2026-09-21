import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { logoutAction } from '@/app/actions';
import { sans, serif } from '@/app/fonts';
import { Button, LinkButton, Logo } from '@/components/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocuBot',
  description: 'Genera un chatbot a partir de tus documentos',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = (await cookies()).has('docubot_token');

  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Saltar al contenido
        </a>
        <div className="min-h-screen">
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <Link
                href={authed ? '/dashboard' : '/'}
                className="flex items-center gap-2 text-base font-semibold tracking-tight text-content"
              >
                <Logo size="sm" />
                DocuBot
              </Link>
              <div className="flex items-center gap-4">
                {authed ? (
                  <form action={logoutAction}>
                    <Button type="submit" variant="secondary" size="sm">
                      Salir
                    </Button>
                  </form>
                ) : (
                  <LinkButton href="/login" variant="secondary" size="sm">
                    Entrar
                  </LinkButton>
                )}
              </div>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-5xl px-6 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
