import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = await getMongoDb();
        const llmLogsCollection = db.collection('llm_logs');

        const totalStatsResult = await llmLogsCollection.aggregate([
            {
                $group: {
                    _id: null,
                    totalTokens: { $sum: '$totalTokens' },
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' },
                    messageCount: { $sum: 1 }
                }
            }
        ]).toArray();

        const totalStats = totalStatsResult[0] || {
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            messageCount: 0
        };

        const modelBreakdown = await llmLogsCollection.aggregate([
            {
                $group: {
                    _id: '$model',
                    totalTokens: { $sum: '$totalTokens' },
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalTokens: -1 } },
            { $limit: 10 }
        ]).toArray();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const dailyTokensResult = await llmLogsCollection.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    totalTokens: { $sum: '$totalTokens' },
                    promptTokens: { $sum: '$promptTokens' },
                    completionTokens: { $sum: '$completionTokens' }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        const dateMap = new Map(dailyTokensResult.map(d => [d._id, d]));
        const dailyTokens = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toISOString().split('T')[0];
            const data = dateMap.get(dateStr);
            dailyTokens.push({
                date: dateStr,
                totalTokens: data?.totalTokens || 0,
                promptTokens: data?.promptTokens || 0,
                completionTokens: data?.completionTokens || 0
            });
        }

        return NextResponse.json({
            tokenUsage: {
                totalTokens: totalStats.totalTokens,
                promptTokens: totalStats.promptTokens,
                completionTokens: totalStats.completionTokens,
                messageCount: totalStats.messageCount
            },
            modelBreakdown: modelBreakdown.map(m => ({
                model: m._id || 'Unknown',
                totalTokens: m.totalTokens,
                promptTokens: m.promptTokens,
                completionTokens: m.completionTokens,
                count: m.count
            })),
            dailyTokens
        });
    } catch (error) {
        console.error('Admin usage stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
