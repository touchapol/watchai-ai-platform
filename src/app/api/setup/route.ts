import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/password';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateInput(username: string, email: string, password: string) {
    if (!username || !email || !password) return 'กรุณากรอกข้อมูลให้ครบถ้วน';
    if (username.length < 3) return 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    if (!EMAIL_REGEX.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง';
    if (password.length < MIN_PASSWORD_LENGTH) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    return null;
}

export async function POST(request: Request) {
    try {
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return NextResponse.json({ error: 'ระบบถูก setup เรียบร้อยแล้ว' }, { status: 400 });
        }

        const { username, email, password } = await request.json();
        const validationError = validateInput(username, email, password);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const admin = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password: await hashPassword(password),
                termsAccepted: true,
                role: 'ADMIN',
            },
            select: { id: true, username: true, email: true, role: true }
        });

        return NextResponse.json({ message: 'Setup สำเร็จ', user: admin }, { status: 201 });
    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
    }
}
