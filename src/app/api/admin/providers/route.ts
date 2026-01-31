import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { logEvent } from '@/lib/logger';
import { maskApiKey, decryptApiKey, isEncrypted } from '@/lib/encryption';

export async function GET() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_VIEW_PROVIDERS' as never, '/admin/providers', {});
        }

        const providers = await prisma.aiProvider.findMany({
            orderBy: [{ priority: 'desc' }, { name: 'asc' }],
            include: {
                apiKeys: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        apiKey: true,
                        isActive: true,
                        dailyUsed: true,
                        dailyLimit: true,
                        minuteUsed: true,
                        minuteLimit: true,
                        dailyTokenUsed: true,
                        dailyTokenLimit: true,
                        minuteTokenUsed: true,
                        minuteTokenLimit: true,
                        isRateLimited: true,
                        createdAt: true,
                        lastUsedAt: true,
                    }
                },
                models: {
                    orderBy: { name: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        description: true,
                        isActive: true,
                    }
                },
                _count: {
                    select: { apiKeys: true, models: true }
                }
            }
        });

        const providersWithMaskedKeys = providers.map(provider => ({
            ...provider,
            apiKeys: provider.apiKeys.map(key => {
                let rawKey = key.apiKey;
                if (isEncrypted(rawKey)) {
                    try {
                        rawKey = decryptApiKey(rawKey);
                    } catch {
                        rawKey = '***';
                    }
                }
                return {
                    ...key,
                    maskedKey: maskApiKey(rawKey),
                    apiKey: undefined,
                };
            })
        }));

        return NextResponse.json({ providers: providersWithMaskedKeys });
    } catch (error) {
        console.error('Get providers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, displayName, icon, color, docsUrl, models } = body;

        if (!name || !displayName) {
            return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
        }

        const existing = await prisma.aiProvider.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json({ error: 'Provider already exists' }, { status: 400 });
        }

        const provider = await prisma.aiProvider.create({
            data: {
                name,
                displayName,
                icon: icon || 'smart_toy',
                color: color || '#666666',
                docsUrl,
                ...(models && models.length > 0 && {
                    models: {
                        create: models.map((m: { name: string; displayName: string }) => ({
                            name: m.name,
                            displayName: m.displayName,
                        }))
                    }
                })
            },
            include: {
                apiKeys: true,
                models: true,
                _count: { select: { apiKeys: true, models: true } }
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_ADD_PROVIDER' as never, '/admin/providers', {
                providerId: provider.id,
                name
            });
        }

        return NextResponse.json({ provider }, { status: 201 });
    } catch (error) {
        console.error('Create provider error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
