import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';

interface Message {
    conversationId: string;
    createdAt: Date;
    tokens?: { total?: number };
}

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d';

        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const db = await getMongoDb();

        const messages = await db.collection<Message>('messages').find({
            conversationId: { $regex: `^${user.id}` },
            createdAt: { $gte: startDate }
        }).toArray();

        const conversationIds = [...new Set(messages.map(m => m.conversationId))];

        const totalMessages = messages.length;
        const totalTokens = messages.reduce((sum, m) => sum + ((m.tokens?.total) || 0), 0);
        const totalConversations = conversationIds.length;

        const dailyMap = new Map<string, { messages: number; tokens: number }>();
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const key = date.toISOString().split('T')[0];
            dailyMap.set(key, { messages: 0, tokens: 0 });
        }

        messages.forEach(m => {
            const key = new Date(m.createdAt).toISOString().split('T')[0];
            const existing = dailyMap.get(key);
            if (existing) {
                existing.messages++;
                existing.tokens += (m.tokens?.total) || 0;
            }
        });

        const dailyUsage = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            ...data,
        }));

        return NextResponse.json({
            totalMessages,
            totalTokens,
            totalConversations,
            dailyUsage,
        });

    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
