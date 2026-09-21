'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

export function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" onClick={copy} variant="secondary" size="sm" className="shrink-0">
      {copied ? 'Copiado' : label}
    </Button>
  );
}
