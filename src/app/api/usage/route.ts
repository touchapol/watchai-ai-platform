import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '7';
        const days = parseInt(period, 10);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDate = new Date(todayStart);
        startDate.setDate(startDate.getDate() - days + 1);

        const db = await getMongoDb();
        const llmLogs = db.collection('llm_logs');

        const totalUsage = await llmLogs.aggregate([
            { $match: { userId: user.id, timestamp: { $gte: startDate }, status: 'SUCCESS' } },
            {
                $group: {
                    _id: null,
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' },
                    totalTokens: { $sum: '$totalTokens' },
                    messageCount: { $sum: 1 }
                }
            }
        ]).toArray();

        const dailyTokens = await llmLogs.aggregate([
            { $match: { userId: user.id, timestamp: { $gte: startDate }, status: 'SUCCESS' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Bangkok' } },
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' },
                    totalTokens: { $sum: '$totalTokens' }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        const modelBreakdown = await llmLogs.aggregate([
            { $match: { userId: user.id, timestamp: { $gte: startDate }, status: 'SUCCESS' } },
            {
                $group: {
                    _id: '$model',
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' },
                    totalTokens: { $sum: '$totalTokens' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalTokens: -1 } }
        ]).toArray();

        const dailyUsageMap: Record<string, { promptTokens: number; completionTokens: number; totalTokens: number }> = {};
        const formatDateStr = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(todayStart);
            date.setDate(date.getDate() - i);
            const dateStr = formatDateStr(date);
            dailyUsageMap[dateStr] = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        }

        dailyTokens.forEach(day => {
            if (dailyUsageMap[day._id]) {
                dailyUsageMap[day._id] = {
                    promptTokens: day.promptTokens,
                    completionTokens: day.completionTokens,
                    totalTokens: day.totalTokens
                };
            }
        });

        return NextResponse.json({
            tokenUsage: totalUsage[0] || { promptTokens: 0, completionTokens: 0, totalTokens: 0, messageCount: 0 },
            dailyTokens: Object.entries(dailyUsageMap).map(([date, data]) => ({ date, ...data })),
            modelBreakdown: modelBreakdown.map(m => ({
                model: m._id,
                promptTokens: m.promptTokens,
                completionTokens: m.completionTokens,
                totalTokens: m.totalTokens,
                count: m.count
            }))
        });
    } catch (error) {
        console.error('Usage API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
