import { Fraunces, Inter } from 'next/font/google';

/**
 * Inter and Fraunces are self-hosted at build time (next/font downloads and
 * serves the file locally, zero runtime requests). Deliberately NOT used in
 * the widget (api/src/public/widget.js): loading webfonts on a client's site
 * would be a performance toll on someone else's page.
 */
export const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans-local',
  display: 'swap',
});

/** Display serif for headings — Inter is kept for everything else. */
export const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif-local',
  display: 'swap',
  axes: ['opsz'],
});
