import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logSecurity } from '@/lib/logger';
import { revokeSession } from '@/lib/session';

export async function POST(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? verifyToken(token) : null;

    if (payload?.userId) {
        const userAgent = request.headers.get('user-agent') || '';
        await logSecurity(payload.userId, 'LOGOUT', 'INFO', { userAgent });

        if (payload.deviceToken) {
            await revokeSession(payload.deviceToken as string);
        }
    }

    const response = NextResponse.json({ message: 'ออกจากระบบสำเร็จ' });

    response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });

    return response;
}
