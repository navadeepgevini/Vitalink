import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'vitalink-dev-secret-key-change-in-production-2026'
);

const COOKIE_NAME = 'vitalink_session';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/doctor', '/admin', '/book', '/room', '/triage'];

// Role-based access rules
const roleRoutes: Record<string, string[]> = {
  patient: ['/dashboard', '/book', '/room', '/triage'],
  doctor: ['/doctor', '/room'],
  admin: ['/admin'],
};

// Role-based dashboard redirect
const roleDashboard: Record<string, string> = {
  patient: '/dashboard',
  doctor: '/doctor',
  admin: '/admin',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Check if route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, AUTH_SECRET);
      const role = payload.role as string;

      // Check role-based access
      const allowedRoutes = roleRoutes[role] || [];
      const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));

      if (!hasAccess) {
        // Redirect to their own dashboard
        const dashboard = roleDashboard[role] || '/login';
        return NextResponse.redirect(new URL(dashboard, request.url));
      }

      return NextResponse.next();
    } catch {
      // Invalid token — clear cookie and redirect to login
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // If user is logged in and visits /login, redirect to their dashboard
  if (pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, AUTH_SECRET);
      const role = payload.role as string;
      const dashboard = roleDashboard[role] || '/dashboard';
      return NextResponse.redirect(new URL(dashboard, request.url));
    } catch {
      // Invalid token — let them see login page
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
