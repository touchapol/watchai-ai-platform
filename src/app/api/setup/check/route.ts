import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const userCount = await prisma.user.count();
        return NextResponse.json({ needsSetup: userCount === 0 });
    } catch (error) {
        console.error('Setup check error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
