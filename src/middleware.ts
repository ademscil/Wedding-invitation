export { default } from 'next-auth/middleware';

export const config = {
  // Admin pages additionally verify the ADMIN role server-side in their layout;
  // this only ensures an unauthenticated visitor is sent to login first.
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
