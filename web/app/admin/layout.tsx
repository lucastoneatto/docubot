import type { ReactNode } from 'react';
import { AdminTabs } from '@/components/AdminTabs';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="rounded-card bg-inverse p-6 text-white ring-1 ring-white/10">
        <p className="text-xs uppercase tracking-widest text-white/60">Operator panel</p>
        <h1 className="mt-1 t-h1 text-white">Administration</h1>
        <p className="mt-1 text-sm text-white/70">
          For the platform owner only. This is where the plans and quotas
          that protect the margin are set.
        </p>
        <AdminTabs />
      </header>
      {children}
    </div>
  );
}
