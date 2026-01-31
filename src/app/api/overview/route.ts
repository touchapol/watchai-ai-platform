import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getMongoDb } from '@/lib/mongodb';

function formatDateStr(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initDailyUsage(todayStart: Date): Record<string, number> {
    const usage: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        const date = new Date(todayStart);
        date.setDate(date.getDate() - i);
        usage[formatDateStr(date)] = 0;
    }
    return usage;
}

async function getTopModels(userId: string): Promise<{ model: string; count: number }[]> {
    try {
        const db = await getMongoDb();
        const result = await db.collection('llm_logs').aggregate([
            { $match: { userId } },
            { $group: { _id: '$model', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).toArray();
        return result.map(m => ({ model: m._id as string, count: m.count as number }));
    } catch {
        return [];
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const [allConversations, recentFilesData, totalFiles, topModels] = await Promise.all([
            prisma.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } }),
            prisma.file.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
            prisma.file.count({ where: { userId: user.id } }),
            getTopModels(user.id),
        ]);

        const dailyUsage = initDailyUsage(todayStart);
        let todayConversations = 0;
        let weekConversations = 0;

        allConversations.forEach(conv => {
            const convDate = new Date(conv.createdAt);
            const dateStr = formatDateStr(convDate);

            if (convDate >= todayStart) todayConversations++;
            if (convDate >= weekStart) weekConversations++;
            if (dailyUsage[dateStr] !== undefined) dailyUsage[dateStr]++;
        });

        const recentChats = allConversations.slice(0, 5).map(conv => ({
            id: conv.id,
            title: conv.title || 'การสนทนาใหม่',
            updatedAt: conv.updatedAt,
        }));

        const recentFiles = recentFilesData.map(file => ({
            id: file.id,
            name: file.filename,
            createdAt: file.createdAt,
        }));

        return NextResponse.json({
            stats: {
                totalChats: allConversations.length,
                totalMessages: 0,
                todayMessages: todayConversations,
                weekMessages: weekConversations,
                totalFiles,
            },
            dailyUsage: Object.entries(dailyUsage).map(([date, count]) => ({ date, count })),
            topModels,
            recentChats,
            recentFiles,
        });
    } catch (error) {
        console.error('Overview API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
