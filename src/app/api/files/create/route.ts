import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { filename, content, path: uploadPath } = await request.json();

        if (!filename?.trim()) {
            return NextResponse.json({ error: 'กรุณาระบุชื่อไฟล์' }, { status: 400 });
        }

        const allowedExtensions = ['.txt', '.md', '.json', '.csv', '.html', '.css', '.xml', '.js'];
        const ext = path.extname(filename).toLowerCase() || '.txt';
        if (!allowedExtensions.includes(ext)) {
            return NextResponse.json({ error: 'นามสกุลไฟล์ไม่ได้รับอนุญาต' }, { status: 400 });
        }

        const targetPath = uploadPath || '';
        const storagePathPrefix = targetPath ? `${user.id}/${targetPath}/` : `${user.id}/`;

        const existingFile = await prisma.file.findFirst({
            where: {
                userId: user.id,
                filename: filename.trim(),
                storagePath: {
                    startsWith: storagePathPrefix
                }
            }
        });

        if (existingFile) {
            return NextResponse.json({ error: 'มีไฟล์ชื่อนี้อยู่แล้วในโฟลเดอร์นี้' }, { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), 'uploads', user.id, targetPath);
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
        }

        const uniqueFilename = `${Date.now()}-${filename.trim()}`;
        const filePath = path.join(uploadsDir, uniqueFilename);
        const fileContent = content || '';

        await writeFile(filePath, fileContent, 'utf-8');

        const mimeType = ext === '.txt' ? 'text/plain'
            : ext === '.md' ? 'text/markdown'
                : ext === '.json' ? 'application/json'
                    : ext === '.csv' ? 'text/csv'
                        : ext === '.html' ? 'text/html'
                            : ext === '.css' ? 'text/css'
                                : ext === '.xml' ? 'application/xml'
                                    : ext === '.js' ? 'application/javascript'
                                        : 'text/plain';

        const storagePath = targetPath ? `${user.id}/${targetPath}/${uniqueFilename}` : `${user.id}/${uniqueFilename}`;

        const file = await prisma.file.create({
            data: {
                userId: user.id,
                filename: filename.trim(),
                storagePath,
                mimeType,
                size: Buffer.byteLength(fileContent, 'utf-8'),
                type: 'DOCUMENT',
            },
        });

        return NextResponse.json({ file }, { status: 201 });
    } catch (error) {
        console.error('Create file error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
