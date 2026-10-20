import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Adds security headers to every page and API response. */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)'],
};
