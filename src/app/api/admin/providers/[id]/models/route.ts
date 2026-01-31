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

        const models = await prisma.aiModel.findMany({
            where: { providerId: id },
            orderBy: { displayName: 'asc' },
        });

        return NextResponse.json({ models });
    } catch (error) {
        console.error('Get provider models error:', error);
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
        const { name, displayName, description } = body;

        if (!name || !displayName) {
            return NextResponse.json({ error: 'Name and display name required' }, { status: 400 });
        }

        const provider = await prisma.aiProvider.findUnique({ where: { id } });
        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        const model = await prisma.aiModel.create({
            data: {
                providerId: id,
                name,
                displayName,
                description,
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_ADD_MODEL' as never, '/admin/providers', {
                providerId: id,
                modelId: model.id,
                name
            });
        }

        return NextResponse.json({ model }, { status: 201 });
    } catch (error) {
        console.error('Create model error:', error);
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
        const { modelId, isActive, displayName, description } = body;

        if (!modelId) {
            return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
        }

        const model = await prisma.aiModel.update({
            where: { id: modelId, providerId: id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(displayName !== undefined && { displayName }),
                ...(description !== undefined && { description }),
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_UPDATE_MODEL' as never, '/admin/providers', {
                modelId,
                isActive
            });
        }

        return NextResponse.json({ model });
    } catch (error) {
        console.error('Update model error:', error);
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
        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('modelId');

        if (!modelId) {
            return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
        }

        await prisma.aiModel.delete({
            where: { id: modelId, providerId: id }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_DELETE_MODEL' as never, '/admin/providers', { modelId });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete model error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
