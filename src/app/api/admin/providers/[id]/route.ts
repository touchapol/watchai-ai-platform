import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { logEvent } from '@/lib/logger';

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

        const provider = await prisma.aiProvider.findUnique({
            where: { id },
            include: {
                apiKeys: {
                    orderBy: { priority: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isActive: true,
                        priority: true,
                        dailyLimit: true,
                        dailyUsed: true,
                        isRateLimited: true,
                        lastUsedAt: true,
                        createdAt: true,
                    }
                },
                models: {
                    orderBy: { displayName: 'asc' },
                }
            }
        });

        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        return NextResponse.json({ provider });
    } catch (error) {
        console.error('Get provider error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
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
        const { displayName, icon, color, docsUrl, isActive, priority } = body;

        const existing = await prisma.aiProvider.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        const provider = await prisma.aiProvider.update({
            where: { id },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(icon !== undefined && { icon }),
                ...(color !== undefined && { color }),
                ...(docsUrl !== undefined && { docsUrl }),
                ...(isActive !== undefined && { isActive }),
                ...(priority !== undefined && { priority }),
            },
            include: {
                apiKeys: true,
                models: true,
                _count: { select: { apiKeys: true, models: true } }
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_UPDATE_PROVIDER' as never, '/admin/providers', {
                providerId: id
            });
        }

        return NextResponse.json({ provider });
    } catch (error) {
        console.error('Update provider error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        const existing = await prisma.aiProvider.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        await prisma.aiProvider.delete({ where: { id } });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_DELETE_PROVIDER' as never, '/admin/providers', {
                providerId: id,
                name: existing.name
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete provider error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
