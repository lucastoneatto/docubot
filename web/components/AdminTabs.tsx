'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/collections', label: 'Collections and quotas' },
  { href: '/admin/users', label: 'Users' },
];

// Bull Board lives in the API, not in Next: it's an external link, not an internal route tab.
const QUEUES_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/admin/queues`;

/**
 * 'use client' isolated to just the <nav>: admin/layout.tsx remains a server
 * component. usePathname() is the only thing that requires this specific
 * piece to live on the client.
 */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        // /admin must be compared by exact equality or /admin/collections
        // would also light up "Overview" via startsWith.
        const active = tab.href === '/admin' ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-control px-3 py-1.5 text-sm transition-colors',
              active ? 'bg-white font-medium text-inverse' : 'bg-white/10 text-white/80 hover:bg-white/20',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      <a
        href={QUEUES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-control bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20"
      >
        Queues
      </a>
    </nav>
  );
}
