import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protected paths that require authentication
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/candidates') ||
    pathname.startsWith('/addskills') ||
    pathname.startsWith('/jobcreation');

  // Auth paths (login, signup) - redirect authenticated users away from these
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/signup');

  if (isProtectedPath && !token) {
    // Redirect to login if token is missing
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    // Redirect to dashboard if already authenticated
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Matching Paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/candidates/:path*',
    '/addskills/:path*',
    '/jobcreation/:path*',
    '/login',
    '/signup',
  ],
};
