export { default } from 'next-auth/middleware';

export const config = {
  // Role is enforced in the admin layout; this only stops anonymous visitors
  // from reaching the page before that check runs.
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
