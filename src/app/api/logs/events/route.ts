import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEventLogs } from '@/lib/logger';

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

        const result = await getEventLogs(filters, page, limit);

        const formattedLogs = result.logs.map(log => ({
            id: log._id.toString(),
            timestamp: log.timestamp,
            action: log.action,
            resource: log.resource,
            details: log.details,
        }));

        return NextResponse.json({
            logs: formattedLogs,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        });
    } catch (error) {
        console.error('Get event logs error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
