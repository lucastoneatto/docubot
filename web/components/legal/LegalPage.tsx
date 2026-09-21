import Link from 'next/link';
import { AppFooter } from '@/components/AppFooter';

const LEGAL_LINKS = [
  { href: '/legal/terminos', label: 'Terms of Service' },
  { href: '/legal/privacidad', label: 'Privacy Policy' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/procesamiento-datos', label: 'Data Processing (DPA)' },
];

export type LegalSection = {
  id: string;
  title: string;
};

export function LegalPage({
  title,
  updatedAt,
  sections,
  children,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="border-b border-line pb-6">
        <p className="t-eyebrow">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-content text-balance sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Last updated: {updatedAt}
        </p>
      </div>

      <div className="mt-8 grid gap-10 sm:grid-cols-[220px_1fr]">
        <nav aria-label="Legal documents" className="hidden sm:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
            Documents
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-content-secondary hover:text-accent hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {sections.length > 0 && (
            <>
              <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-content-muted">
                On this page
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-content-secondary hover:text-accent hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        <article className="legal-prose min-w-0">{children}</article>
      </div>

      <div className="mt-16">
        <AppFooter />
      </div>
    </div>
  );
}
