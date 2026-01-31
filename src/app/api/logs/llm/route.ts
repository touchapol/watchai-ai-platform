import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getLLMLogs } from '@/lib/logger';

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

        const filters: { startDate?: Date; endDate?: Date } = {};
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const result = await getLLMLogs(user.id, filters, page, limit);

        const formattedLogs = result.logs.map(log => ({
            id: log._id.toString(),
            timestamp: log.timestamp,
            model: log.model,
            promptTokens: log.promptTokens,
            completionTokens: log.completionTokens,
            totalTokens: log.totalTokens,
            latencyMs: log.latencyMs,
            status: log.status,
            conversationId: log.conversationId,
        }));

        return NextResponse.json({
            logs: formattedLogs,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        });
    } catch (error) {
        console.error('Get LLM logs error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
