import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';

/** Keeps anonymous visitors out of the dashboard and the admin panel. */

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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isProtected(req.nextUrl.pathname)) {
    return requireAuth(req as NextRequestWithAuth, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
