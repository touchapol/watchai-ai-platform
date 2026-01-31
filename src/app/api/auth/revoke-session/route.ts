import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { revokeSession } from '@/lib/session';
import { logSecurity } from '@/lib/logger';

const getLocationFromIP = async (ip: string) => {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return 'Local Network';
    }
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`);
        const data = await res.json();
        if (data.city && data.country) {
            return `${data.city}, ${data.country}`;
        }
        return data.country || 'Unknown';
    } catch {
        return 'Unknown';
    }
};

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { deviceToken } = await request.json();

        if (!deviceToken) {
            return NextResponse.json({ error: 'deviceToken required' }, { status: 400 });
        }

        const revokedSession = await revokeSession(deviceToken);

        if (revokedSession) {
            const userAgent = request.headers.get('user-agent') || '';
            const revokerIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                '127.0.0.1';
            const revokedLocation = await getLocationFromIP(revokedSession.ip);

            await logSecurity(payload.userId, 'SESSION_REVOKED', 'WARNING', {
                userAgent,
                revokerIp,
                revokedDeviceToken: deviceToken,
                revokedUserAgent: revokedSession.userAgent,
                revokedIp: revokedSession.ip,
                revokedLocation,
                revokedCreatedAt: revokedSession.createdAt,
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: 'Session not found or already revoked' });
    } catch (error) {
        console.error('Revoke session error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
