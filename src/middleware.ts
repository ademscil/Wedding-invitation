import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';
import { isCustomHost, normalizeHost } from '@/lib/domain';

/**
 * Two jobs, in this order:
 *
 * 1. Serve customer domains. A request arriving on a host that is not ours is
 *    rewritten to an internal route that looks the invitation up by that host.
 *    The lookup cannot happen here — middleware runs on the edge runtime and
 *    Prisma does not — so the host is carried in the path instead.
 *
 * 2. Keep anonymous visitors out of the dashboard, which is all the previous
 *    middleware did.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];

const requireAuth = withAuth({
  callbacks: {
    authorized: ({ token }) => token != null,
  },
});

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function platformOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return null;
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

function handleCustomDomain(req: NextRequest, host: string): NextResponse {
  const { pathname, search } = req.nextUrl;

  // The invitation itself, and the personalised guest link, are the only two
  // things a customer's domain serves.
  if (pathname === '/' || pathname.startsWith('/to/')) {
    const url = req.nextUrl.clone();
    url.pathname = `/d/${host}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Anything else belongs to the platform. Send the visitor there rather than
  // showing them a 404 on a domain the couple just told their guests about.
  const origin = platformOrigin();

  /*
   * Only redirect somewhere genuinely different. If NEXT_PUBLIC_APP_URL is
   * unset or points back at this same host, redirecting would send the browser
   * to the URL it just asked for and loop until it gives up.
   */
  if (origin && normalizeHost(new URL(origin).host) !== host) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, origin));
  }

  return new NextResponse(null, { status: 404 });
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const host = normalizeHost(req.headers.get('host'));

  if (isCustomHost(host)) {
    return handleCustomDomain(req, host);
  }

  /*
   * `/d/<host>` is the internal target of the rewrite above, not a public URL.
   * Reached directly on the platform host it would serve a second copy of an
   * invitation at an address nobody was given.
   */
  if (
    req.nextUrl.pathname === '/d' ||
    req.nextUrl.pathname.startsWith('/d/')
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (isProtected(req.nextUrl.pathname)) {
    return requireAuth(req as NextRequestWithAuth, event);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except API routes, Next's own assets and static files.
   *
   * API routes are deliberately excluded: a custom domain points at this same
   * deployment, so tRPC calls made from an invitation page already reach the
   * right handler and must not be rewritten.
   */
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp3|mp4|woff|woff2|ttf)$).*)',
  ],
};
