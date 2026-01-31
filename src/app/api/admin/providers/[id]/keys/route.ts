import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { logEvent } from '@/lib/logger';
import { encryptApiKey } from '@/lib/encryption';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        const keys = await prisma.apiKey.findMany({
            where: { providerId: id },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
                priority: true,
                dailyLimit: true,
                dailyUsed: true,
                minuteLimit: true,
                minuteUsed: true,
                isRateLimited: true,
                lastUsedAt: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ keys });
    } catch (error) {
        console.error('Get provider keys error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, apiKey, dailyLimit, minuteLimit, dailyTokenLimit, minuteTokenLimit } = body;

        if (!name || !apiKey) {
            return NextResponse.json({ error: 'Name and API key are required' }, { status: 400 });
        }

        const provider = await prisma.aiProvider.findUnique({ where: { id } });
        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        const encryptedApiKey = encryptApiKey(apiKey);

        const newKey = await prisma.apiKey.create({
            data: {
                providerId: id,
                name,
                description,
                apiKey: encryptedApiKey,
                provider: provider.name,
                dailyLimit: dailyLimit ? parseInt(dailyLimit) : 10000,
                minuteLimit: minuteLimit ? parseInt(minuteLimit) : 60,
                dailyTokenLimit: dailyTokenLimit ? parseInt(dailyTokenLimit) : null,
                minuteTokenLimit: minuteTokenLimit ? parseInt(minuteTokenLimit) : null,
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_ADD_API_KEY' as never, '/admin/providers', {
                providerId: id,
                keyId: newKey.id,
                name
            });
        }

        return NextResponse.json({
            key: {
                id: newKey.id,
                name: newKey.name,
                description: newKey.description,
                isActive: newKey.isActive,
                priority: newKey.priority,
                dailyLimit: newKey.dailyLimit,
                dailyUsed: newKey.dailyUsed,
                createdAt: newKey.createdAt,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Create provider key error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
