import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** The landing ('/') is public; so are the other marketing/auth routes. */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/legal',
];

/**
 * Constant-time comparison over the operator panel's credentials.
 * Avoids leaking via timing which of the two fields failed.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  let diff = bufA.length ^ bufB.length;
  for (let i = 0; i < Math.max(bufA.length, bufB.length); i += 1) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return diff === 0;
}

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="DocuBot Admin"' },
  });
}

function guardAdmin(request: NextRequest) {
  const user = process.env.ADMIN_USER ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';
  // With no credentials configured the panel stays closed, never open.
  if (!user || !password) return unauthorized();

  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const separator = decoded.indexOf(':');
  if (separator === -1) return unauthorized();

  const okUser = safeEqual(decoded.slice(0, separator), user);
  const okPass = safeEqual(decoded.slice(separator + 1), password);
  if (!(okUser && okPass)) return unauthorized();

  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The operator panel uses basic auth, not the user session.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return guardAdmin(request);
  }

  const authed = request.cookies.has('docubot_token');

  // With a session already started, the landing adds nothing: go straight to the dashboard.
  if (pathname === '/') {
    if (!authed) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // '/' is compared exactly: with startsWith it would make every route public.
  const isPublic = PUBLIC_PATHS.some(
    (path) =>
      pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)),
  );
  if (isPublic) return NextResponse.next();

  if (!authed) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:png|jpg|svg|ico|css|js|woff2?)$).*)'],
};
