import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const models = await prisma.aiModel.findMany({
            where: { isActive: true },
            orderBy: { displayName: 'asc' },
            select: {
                id: true,
                name: true,
                displayName: true,
                provider: { select: { name: true } },
            },
        });

        const formatted = models.map(m => ({
            id: m.name,
            name: m.displayName,
            provider: m.provider.name,
        }));

        return NextResponse.json({ models: formatted });
    } catch (error) {
        console.error('Models error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
