import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/categories',
  '/transactions',
  '/budgets',
];

export function middleware(request: NextRequest) {
  const isProtected = PROTECTED_ROUTES.some((r) =>
    request.nextUrl.pathname.startsWith(r),
  );

  if (!isProtected) return NextResponse.next();

  const refreshToken = request.cookies.get('refresh_token');
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/categories/:path*',
    '/transactions/:path*',
    '/budgets/:path*',
  ],
};
