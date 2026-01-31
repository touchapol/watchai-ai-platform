import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { verifyCsrfToken } from '@/lib/csrf';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateInput(username: string, email: string, password: string, termsAccepted: boolean) {
    if (!username || !email || !password) return 'กรุณากรอกข้อมูลให้ครบถ้วน';
    if (!termsAccepted) return 'กรุณายอมรับข้อตกลงการใช้งาน';
    if (!EMAIL_REGEX.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง';
    if (password.length < MIN_PASSWORD_LENGTH) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    return null;
}

export async function POST(request: Request) {
    try {
        if (!await verifyCsrfToken(request)) {
            return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
        }

        const { username, email, password, termsAccepted } = await request.json();
        const validationError = validateInput(username, email, password, termsAccepted);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase();
        const normalizedUsername = username.toLowerCase();

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] }
        });

        if (existingUser) {
            const error = existingUser.email === normalizedEmail ? 'อีเมลนี้ถูกใช้งานแล้ว' : 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
            return NextResponse.json({ error }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                username: normalizedUsername,
                email: normalizedEmail,
                password: await hashPassword(password),
                termsAccepted: true,
                role: 'USER',
            },
            select: { id: true, username: true, email: true, role: true, createdAt: true }
        });

        return NextResponse.json({ message: 'สมัครสมาชิกสำเร็จ', user }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
    }
}
