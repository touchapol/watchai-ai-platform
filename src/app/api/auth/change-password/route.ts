import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { logSecurity } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { password: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: payload.userId },
            data: { password: hashedPassword }
        });

        const userAgent = request.headers.get('user-agent') || '';
        await logSecurity(payload.userId, 'PASSWORD_CHANGE', 'INFO', { method: 'settings', userAgent });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
