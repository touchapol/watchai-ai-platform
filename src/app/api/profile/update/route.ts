import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';

export async function PATCH(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username } = await request.json();

        if (!username || username.trim().length < 2) {
            return NextResponse.json({ error: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร' }, { status: 400 });
        }

        if (username.trim().length > 30) {
            return NextResponse.json({ error: 'ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร' }, { status: 400 });
        }

        const db = await getMongoDb();

        const existingUser = await db.collection('users').findOne({
            username: username.trim(),
            id: { $ne: payload.userId }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }, { status: 400 });
        }

        await db.collection('users').updateOne(
            { id: payload.userId },
            { $set: { username: username.trim(), updatedAt: new Date() } }
        );

        await logEvent(payload.userId, 'SETTINGS_UPDATE', '/dashboard/profile', {
            setting: 'username',
            newValue: username.trim()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
