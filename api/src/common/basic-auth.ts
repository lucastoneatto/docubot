import { timingSafeEqual } from 'node:crypto';

/** Constant-time comparison, tolerant of different lengths. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // We still compare against itself so as not to leak the length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Extracts and validates Basic Auth credentials from an Authorization header. */
export function checkBasicAuth(
  header: string | undefined,
  user: string,
  password: string,
): boolean {
  if (!header?.startsWith('Basic ')) return false;

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;

  const okUser = safeEqual(decoded.slice(0, separator), user);
  const okPass = safeEqual(decoded.slice(separator + 1), password);
  // We always evaluate both so as not to reveal which one failed.
  return okUser && okPass;
}
