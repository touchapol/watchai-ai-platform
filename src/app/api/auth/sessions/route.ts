import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getActiveSessions } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessions = await getActiveSessions(payload.userId);

        const parseUserAgent = (ua: string) => {
            if (!ua) return { device: 'unknown', browser: 'Unknown', os: 'Unknown' };
            const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
            const isTablet = /iPad|Tablet/i.test(ua);
            let device = 'desktop';
            if (isTablet) device = 'tablet';
            else if (isMobile) device = 'mobile';

            let browser = 'Unknown';
            if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Edg')) browser = 'Edge';
            else if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Safari')) browser = 'Safari';

            let os = 'Unknown';
            if (ua.includes('Windows')) os = 'Windows';
            else if (ua.includes('Mac')) os = 'macOS';
            else if (ua.includes('Linux')) os = 'Linux';
            else if (ua.includes('Android')) os = 'Android';
            else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

            return { device, browser, os };
        };

        const formattedSessions = sessions.map(session => ({
            deviceToken: session.deviceToken,
            userAgent: session.userAgent,
            ip: session.ip,
            createdAt: session.createdAt,
            lastActive: session.lastActive,
            expiresAt: session.expiresAt,
            isCurrentDevice: session.deviceToken === payload.deviceToken,
            ...parseUserAgent(session.userAgent),
        }));

        return NextResponse.json({ sessions: formattedSessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
