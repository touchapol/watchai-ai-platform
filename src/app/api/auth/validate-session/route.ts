import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { validateSession } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        if (payload.deviceToken) {
            const session = await validateSession(payload.deviceToken);
            if (!session) {
                const response = NextResponse.json({ valid: false }, { status: 401 });
                response.cookies.set('auth-token', '', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 0,
                    path: '/',
                });
                return response;
            }
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error('Validate session error:', error);
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}
