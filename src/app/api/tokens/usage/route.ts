import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTokenUsageSummary, getLLMLogs } from '@/lib/logger';

interface LLMLog {
    model?: string;
    totalTokens?: number;
}

function calculateModelBreakdown(logs: LLMLog[]): Record<string, { tokens: number; count: number }> {
    const breakdown: Record<string, { tokens: number; count: number }> = {};
    for (const log of logs) {
        const model = log.model || 'unknown';
        if (!breakdown[model]) breakdown[model] = { tokens: 0, count: 0 };
        breakdown[model].tokens += log.totalTokens || 0;
        breakdown[model].count += 1;
    }
    return breakdown;
}

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const period = new URL(request.url).searchParams.get('period') as 'day' | 'week' | 'month' || 'day';

        const [dayUsage, weekUsage, monthUsage, logsResult] = await Promise.all([
            getTokenUsageSummary(user.id, 'day'),
            getTokenUsageSummary(user.id, 'week'),
            getTokenUsageSummary(user.id, 'month'),
            getLLMLogs(user.id, {}, 1, 50),
        ]);

        return NextResponse.json({
            usage: { day: dayUsage, week: weekUsage, month: monthUsage },
            modelBreakdown: calculateModelBreakdown(logsResult.logs as LLMLog[]),
            period,
        });
    } catch (error) {
        console.error('Token usage error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
