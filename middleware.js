import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];
const COOKIE_NAME = 'sac_session';
const COOKIE_VALUE = 'authorised';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const session = request.cookies.get(COOKIE_NAME);
  if (session?.value === COOKIE_VALUE) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
