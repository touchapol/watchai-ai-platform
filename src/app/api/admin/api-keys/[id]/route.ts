import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { logEvent } from '@/lib/logger';

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
        const { name, description, isActive, priority, dailyLimit, minuteLimit, dailyTokenLimit, minuteTokenLimit } = body;

        const existingKey = await prisma.apiKey.findUnique({ where: { id } });
        if (!existingKey) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 });
        }

        const updatedKey = await prisma.apiKey.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
                ...(priority !== undefined && { priority }),
                ...(dailyLimit !== undefined && { dailyLimit }),
                ...(minuteLimit !== undefined && { minuteLimit }),
                ...(dailyTokenLimit !== undefined && { dailyTokenLimit }),
                ...(minuteTokenLimit !== undefined && { minuteTokenLimit }),
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_UPDATE_API_KEY' as never, '/admin/api-keys', { keyId: id, name });
        }

        return NextResponse.json({ apiKey: updatedKey });
    } catch (error) {
        console.error('Update API key error:', error);
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

        const existingKey = await prisma.apiKey.findUnique({ where: { id } });
        if (!existingKey) {
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }

        await prisma.apiKey.delete({ where: { id } });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_DELETE_API_KEY' as never, '/admin/api-keys', { keyId: id });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if ((error as { code?: string }).code === 'P2025') {
            return NextResponse.json({ success: true, message: 'Already deleted' });
        }
        console.error('Delete API key error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
