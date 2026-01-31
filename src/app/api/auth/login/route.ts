import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { generateToken, getSessionTimeout } from '@/lib/auth';
import { logSecurity } from '@/lib/logger';
import { createSession } from '@/lib/session';
import { verifyCsrfToken } from '@/lib/csrf';

export async function POST(request: Request) {
    try {
        const isValidCsrf = await verifyCsrfToken(request);
        if (!isValidCsrf) {
            return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
        }

        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json(
                { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier.toLowerCase() },
                    { username: identifier.toLowerCase() }
                ]
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            );
        }

        const isValidPassword = await verifyPassword(password, user.password);
        const userAgent = request.headers.get('user-agent') || '';
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        if (!isValidPassword) {
            await logSecurity(user.id, 'LOGIN_FAILED', 'WARNING', { reason: 'รหัสผ่านไม่ถูกต้อง', userAgent });
            return NextResponse.json(
                { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            );
        }

        const deviceToken = await createSession(user.id, userAgent, ip);
        const sessionTimeout = await getSessionTimeout();

        const token = generateToken({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            deviceToken,
        }, sessionTimeout);

        await logSecurity(user.id, 'LOGIN_SUCCESS', 'INFO', { method: 'password', userAgent, deviceToken });

        const response = NextResponse.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
            { status: 500 }
        );
    }
}
