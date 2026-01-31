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
            logEvent(user.id, 'ADMIN_VIEW_SECURITY_LOG', '/admin/security', {});
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const userId = url.searchParams.get('userId') || '';
        const skip = (page - 1) * limit;

        const db = await getMongoDb();
        const securityLogsCollection = db.collection('security_logs');

        const query = userId ? { userId } : {};

        const [logs, total] = await Promise.all([
            securityLogsCollection.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
            securityLogsCollection.countDocuments(query)
        ]);

        const userIds = [...new Set(logs.map((log: Record<string, unknown>) => log.userId as string).filter(Boolean))];
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
            action: log.event as string,
            level: log.severity as string,
            metadata: {
                ip: log.ip as string,
                userAgent: log.userAgent as string,
                ...(log.details as Record<string, unknown>)
            },
            createdAt: log.timestamp as Date
        }));

        return NextResponse.json({
            logs: formattedLogs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Admin security logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
