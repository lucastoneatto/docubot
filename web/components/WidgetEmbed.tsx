'use client';

import { useEffect, useRef } from 'react';

type DocubotApi = {
  mount: (options: {
    collectionId: string;
    apiUrl: string;
    color?: string;
    greeting?: string;
    title?: string;
    container?: HTMLElement | null;
  }) => HTMLElement | null;
  unmount: (collectionId: string) => void;
};

declare global {
  interface Window {
    docubot?: DocubotApi;
  }
}

const SCRIPT_MARKER = 'script[data-docubot-embed]';

export function WidgetEmbed({
  collectionId,
  apiUrl,
  color,
  greeting,
  title,
}: {
  collectionId: string;
  apiUrl: string;
  color?: string;
  greeting?: string;
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    const mount = () => {
      if (cancelled || !container || !window.docubot) return;
      window.docubot.mount({
        collectionId,
        apiUrl,
        color,
        greeting,
        title,
        container,
      });
    };

    if (window.docubot) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(SCRIPT_MARKER);
      if (existing) {
        existing.addEventListener('load', mount);
      } else {
        const script = document.createElement('script');
        script.src = `${apiUrl}/widget.js`;
        script.async = true;
        script.setAttribute('data-auto', 'false');
        script.setAttribute('data-docubot-embed', 'true');
        script.addEventListener('load', mount);
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      window.docubot?.unmount(collectionId);
    };
  }, [collectionId, apiUrl, color, greeting, title]);

  return <div id={`docubot-embed-${collectionId}`} ref={containerRef} />;
}
