import Link from 'next/link';
import { Logo } from '@/components/ui';

export function AppFooter() {
  return (
    <footer className="flex flex-col items-center gap-4 border-t border-line pt-8 text-center text-sm text-content-muted sm:flex-row sm:justify-between sm:text-left">
      <div className="flex items-center gap-2 text-content-secondary">
        <Logo size="sm" />
        <span className="font-medium">DocuBot</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <a href="mailto:hola@docubot.dev" className="hover:underline">
          hola@docubot.dev
        </a>
        <Link href="/legal/terminos" className="hover:underline">
          Terms
        </Link>
        <Link href="/legal/privacidad" className="hover:underline">
          Privacy
        </Link>
        <Link href="/legal/cookies" className="hover:underline">
          Cookies
        </Link>
        <span>© {new Date().getFullYear()} DocuBot</span>
      </div>
    </footer>
  );
}
