import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logSecurity } from '@/lib/logger';
import { revokeAllSessions } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await revokeAllSessions(payload.userId);

        const userAgent = request.headers.get('user-agent') || '';
        await logSecurity(payload.userId, 'LOGOUT', 'INFO', { userAgent, method: 'logout-all' });

        const response = NextResponse.json({ success: true });
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Logout all error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
