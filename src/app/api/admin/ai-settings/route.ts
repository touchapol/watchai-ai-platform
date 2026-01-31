import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'system' },
            select: {
                enableLongTermMemory: true,
                enableUserProfileMemory: true,
                enableRAG: true,
            },
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 'system' },
                select: {
                    enableLongTermMemory: true,
                    enableUserProfileMemory: true,
                    enableRAG: true,
                },
            });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching AI settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const updates: Record<string, boolean> = {};

        if (typeof body.enableLongTermMemory === 'boolean') {
            updates.enableLongTermMemory = body.enableLongTermMemory;
        }
        if (typeof body.enableUserProfileMemory === 'boolean') {
            updates.enableUserProfileMemory = body.enableUserProfileMemory;
        }
        if (typeof body.enableRAG === 'boolean') {
            updates.enableRAG = body.enableRAG;
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'system' },
            create: { id: 'system', ...updates },
            update: updates,
            select: {
                enableLongTermMemory: true,
                enableUserProfileMemory: true,
                enableRAG: true,
            },
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error updating AI settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
