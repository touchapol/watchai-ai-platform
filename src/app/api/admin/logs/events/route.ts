import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { getMongoDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_VIEW_EVENT_LOG', '/admin/events', {});
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const userId = url.searchParams.get('userId') || '';
        const skip = (page - 1) * limit;

        const db = await getMongoDb();
        const eventLogsCollection = db.collection('event_logs');

        const query = userId ? { userId } : {};

        const [logs, total] = await Promise.all([
            eventLogsCollection.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
            eventLogsCollection.countDocuments(query)
        ]);

        const userIds = [...new Set(logs.map((log: Record<string, unknown>) => log.userId as string))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, email: true }
        });
        const userMap = new Map<string, { id: string; username: string; email: string }>(
            users.map((u: { id: string; username: string; email: string }) => [u.id, u])
        );

        const formattedLogs = logs.map((log: Record<string, unknown>) => ({
            id: (log._id as { toString(): string }).toString(),
            userId: log.userId as string,
            username: userMap.get(log.userId as string)?.username || 'Unknown',
            email: userMap.get(log.userId as string)?.email || '',
            action: log.action as string,
            resource: (log.resource as string) || '',
            details: (log.details as Record<string, unknown>) || {},
            timestamp: log.timestamp as Date
        }));

        return NextResponse.json({
            logs: formattedLogs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Admin event logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
