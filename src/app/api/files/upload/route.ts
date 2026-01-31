import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'text/html',
    'text/javascript',
    'text/css',
    'application/json',
    'application/javascript',
    'application/xml',
    'text/xml',
    'text/markdown',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getFileType(mimeType: string): 'DOCUMENT' | 'IMAGE' | null {
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'DOCUMENT';
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'IMAGE';
    return null;
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const uploadPath = (formData.get('path') as string) || '';

        if (!file) return NextResponse.json({ error: 'กรุณาเลือกไฟล์' }, { status: 400 });
        if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)' }, { status: 400 });

        const fileType = getFileType(file.type);
        if (!fileType) return NextResponse.json({ error: 'ประเภทไฟล์ไม่รองรับ' }, { status: 400 });

        const userDir = path.join(process.cwd(), 'uploads', user.id, uploadPath);
        if (!existsSync(userDir)) await mkdir(userDir, { recursive: true });

        const ext = path.extname(file.name);
        const baseName = path.basename(file.name, ext);
        const uniqueName = `${Date.now()}_${baseName}${ext}`;
        const filePath = path.join(userDir, uniqueName);
        const storagePath = path.join(user.id, uploadPath, uniqueName);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const savedFile = await prisma.file.create({
            data: {
                userId: user.id,
                filename: file.name,
                storagePath,
                mimeType: file.type,
                size: file.size,
                type: fileType,
            },
        });

        return NextResponse.json({ message: 'อัพโหลดสำเร็จ', file: savedFile }, { status: 201 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัพโหลด' }, { status: 500 });
    }
}
