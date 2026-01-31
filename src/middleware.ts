import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicRoutes = ['/login', '/register', '/terms', '/setup', '/api/auth/login', '/api/auth/register', '/api/setup', '/api/setup/check'];
const publicPrefixes = ['/api/auth/', '/_next/', '/favicon.ico'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix));

    if (isPublicRoute || isPublicPrefix) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch (error) {

        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth-token');
        return response;
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
    ],
};
