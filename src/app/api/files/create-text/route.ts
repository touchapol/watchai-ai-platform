import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const body = await request.json();
        const { filename, content, path: uploadPath } = body;

        if (!filename) return NextResponse.json({ error: 'กรุณาระบุชื่อไฟล์' }, { status: 400 });

        const userDir = path.join(process.cwd(), 'uploads', user.id, uploadPath || '');
        if (!existsSync(userDir)) await mkdir(userDir, { recursive: true });

        const uniqueName = `${Date.now()}_${filename}`;
        const filePath = path.join(userDir, uniqueName);
        const storagePath = path.join(user.id, uploadPath || '', uniqueName);

        const fileContent = content || '';
        const buffer = Buffer.from(fileContent, 'utf-8');
        await writeFile(filePath, buffer);

        const savedFile = await prisma.file.create({
            data: {
                userId: user.id,
                filename,
                storagePath,
                mimeType: 'text/plain',
                size: buffer.length,
                type: 'DOCUMENT',
            },
        });

        return NextResponse.json({ message: 'สร้างไฟล์สำเร็จ', file: savedFile }, { status: 201 });
    } catch (error) {
        console.error('Create text file error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างไฟล์' }, { status: 500 });
    }
}
