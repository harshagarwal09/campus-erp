import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_jwt_secret'
);

// Role → allowed path prefixes
const ROLE_PATHS: Record<string, string[]> = {
  ADMIN: [
    '/dashboard',
    '/students',
    '/admin',
    '/clubs',
    '/hackathons',
    '/fests',
    '/settings',
    '/change-password',
  ],
  STUDENT: [
    '/student',
    '/club',
    '/hackathon',
    '/fest',
    '/settings',
    '/change-password',
  ],
  CLUB_HEAD: ['/clubs', '/settings', '/change-password'],
  HACKATHON_LEAD: ['/hackathons', '/settings', '/change-password'],
  FEST_COORDINATOR: ['/fests', '/settings', '/change-password'],
};

// Public paths that never require auth
const PUBLIC_PATHS = ['/login', '/unauthorized', '/api/auth/login', '/api/auth/refresh'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Allow all other /api/* routes to handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('accessToken')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Root redirect
    if (pathname === '/') {
      const dest = role === 'STUDENT' ? '/student/profile' : '/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Check role is allowed to access this path
    const allowedPrefixes = ROLE_PATHS[role] ?? [];
    const allowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!allowed) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  } catch {
    // Token invalid or expired — redirect to login
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('accessToken');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
