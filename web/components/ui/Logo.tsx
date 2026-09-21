import { cn } from '@/lib/cn';

const SIZES = { sm: 20, md: 24, lg: 32 } as const;

export type LogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * Reuses the same speech-bubble glyph the widget draws on the client's site
 * (api/src/public/widget.js), so the app's brand and the mark the end
 * visitor sees are the same symbol.
 */
export function Logo({ size = 'md', className }: LogoProps) {
  const px = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[5px] bg-accent', className)}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 24 24" width={px * 0.6} height={px * 0.6} fill="#fff">
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" />
      </svg>
    </span>
  );
}
