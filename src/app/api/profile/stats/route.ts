import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getMongoDb();

        const [conversationCount, messageCount, fileCount, usageData, user] = await Promise.all([
            db.collection('conversations').countDocuments({ userId: payload.userId }),
            db.collection('messages').countDocuments({ userId: payload.userId }),
            db.collection('files').countDocuments({ userId: payload.userId }),
            db.collection('usage_logs').aggregate([
                { $match: { userId: payload.userId } },
                { $group: { _id: null, totalTokens: { $sum: '$totalTokens' } } }
            ]).toArray(),
            db.collection('users').findOne({ id: payload.userId })
        ]);

        return NextResponse.json({
            totalConversations: conversationCount,
            totalMessages: messageCount,
            totalFiles: fileCount,
            totalTokensUsed: usageData[0]?.totalTokens || 0,
            memberSince: user?.createdAt || null
        });
    } catch (error) {
        console.error('Profile stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
