import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'system' }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 'system', sessionTimeoutHours: 168 }
            });
        }

        const models = await prisma.aiModel.findMany({
            where: { isActive: true },
            include: { provider: { select: { name: true, displayName: true } } },
            orderBy: [{ provider: { name: 'asc' } }, { displayName: 'asc' }]
        });

        return NextResponse.json({ settings, models });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { sessionTimeoutHours, defaultModelId } = body;

        const updateData: { sessionTimeoutHours?: number; defaultModelId?: string | null } = {};

        if (sessionTimeoutHours !== undefined) {
            if (typeof sessionTimeoutHours !== 'number' || sessionTimeoutHours < 1 || sessionTimeoutHours > 720) {
                return NextResponse.json({ error: 'Session timeout ต้องอยู่ระหว่าง 1-720 ชั่วโมง' }, { status: 400 });
            }
            updateData.sessionTimeoutHours = sessionTimeoutHours;
        }

        if (defaultModelId !== undefined) {
            updateData.defaultModelId = defaultModelId || null;
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'system' },
            update: updateData,
            create: { id: 'system', sessionTimeoutHours: sessionTimeoutHours || 168, defaultModelId: defaultModelId || null },
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
