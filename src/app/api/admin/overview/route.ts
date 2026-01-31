import { NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getMongoDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';

export async function GET() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_VIEW_OVERVIEW', '/admin', {});
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const [totalUsers, totalChats, totalFiles, todayChats, weekChats] = await Promise.all([
            prisma.user.count(),
            prisma.conversation.count(),
            prisma.file.count(),
            prisma.conversation.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.conversation.count({ where: { createdAt: { gte: weekStart } } }),
        ]);

        const activeUsers = await prisma.user.count({
            where: { conversations: { some: {} } }
        });

        const formatDateStr = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const dailyUsage: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const date = new Date(todayStart);
            date.setDate(date.getDate() - i);
            dailyUsage[formatDateStr(date)] = 0;
        }

        const conversations = await prisma.conversation.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            select: { createdAt: true }
        });

        conversations.forEach((conv) => {
            const dateStr = formatDateStr(new Date(conv.createdAt));
            if (dailyUsage[dateStr] !== undefined) {
                dailyUsage[dateStr]++;
            }
        });

        let topModels: { model: string; count: number }[] = [];
        try {
            const db = await getMongoDb();
            const llmLogsCollection = db.collection('llm_logs');
            const modelAggregation = await llmLogsCollection.aggregate([
                { $group: { _id: '$model', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]).toArray();
            topModels = modelAggregation.map(m => ({ model: m._id as string, count: m.count as number }));
        } catch (e) {
            console.error('MongoDB error:', e);
        }

        const topUsersData = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                _count: { select: { conversations: true } }
            },
            orderBy: { conversations: { _count: 'desc' } },
            take: 10
        });

        const topUsers = topUsersData.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            chatCount: u._count.conversations
        }));

        return NextResponse.json({
            stats: { totalUsers, totalChats, totalFiles, todayChats, weekChats, activeUsers },
            dailyUsage: Object.entries(dailyUsage).map(([date, count]) => ({ date, count })),
            topModels,
            topUsers
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
