import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSecurityLogs } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const filters: { userId: string; startDate?: Date; endDate?: Date } = { userId: user.id };
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const result = await getSecurityLogs(filters, page, limit);

        const parseUserAgent = (ua: string | undefined) => {
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

        const formattedLogs = await Promise.all(result.logs.map(async log => {
            const deviceInfo = parseUserAgent(log.details?.userAgent as string);
            const location = await getLocationFromIP(log.ip);
            return {
                id: log._id.toString(),
                timestamp: log.timestamp,
                event: log.event,
                severity: log.severity,
                details: log.details,
                ip: log.ip,
                location,
                device: deviceInfo.device,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                deviceToken: (log.details?.deviceToken as string) || null,
            };
        }));

        return NextResponse.json({
            logs: formattedLogs,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        });
    } catch (error) {
        console.error('Get security logs error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
