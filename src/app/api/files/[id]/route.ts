import { NextResponse } from 'next/server';
import { readFile, unlink, writeFile as fsWriteFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

const DANGEROUS_EXTENSIONS = ['.sh', '.exe', '.bat', '.cmd', '.ps1', '.py', '.js', '.php', '.pl', '.rb', '.jar', '.msi', '.com', '.vbs', '.wsf'];
const TEXT_MIME_TYPES = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/markdown', 'text/xml', 'application/xml'];

async function getFileForUser(id: string, userId: string) {
    return prisma.file.findFirst({ where: { id, userId } });
}

function getFilePath(storagePath: string) {
    return path.join(process.cwd(), 'uploads', storagePath);
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const file = await getFileForUser(id, user.id);
        if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });

        const filePath = getFilePath(file.storagePath);
        if (!existsSync(filePath)) return NextResponse.json({ error: 'ไฟล์ไม่มีอยู่' }, { status: 404 });

        const fileBuffer = await readFile(filePath);
        const forceDownloadParam = new URL(request.url).searchParams.get('download') === '1';
        const ext = path.extname(file.filename).toLowerCase();
        const isDangerous = DANGEROUS_EXTENSIONS.includes(ext);
        const forceDownload = forceDownloadParam || isDangerous;

        const isTextFile = TEXT_MIME_TYPES.includes(file.mimeType) || file.mimeType.startsWith('text/');
        const contentType = forceDownload
            ? 'application/octet-stream'
            : (isTextFile ? `${file.mimeType}; charset=utf-8` : file.mimeType);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.filename)}"`,
                'Content-Length': file.size.toString(),
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'private, no-cache',
            },
        });
    } catch (error) {
        console.error('Get file error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const file = await getFileForUser(id, user.id);
        if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });

        const filePath = getFilePath(file.storagePath);
        if (existsSync(filePath)) await unlink(filePath);

        await prisma.file.delete({ where: { id } });
        return NextResponse.json({ message: 'ลบไฟล์สำเร็จ' });
    } catch (error) {
        console.error('Delete file error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const file = await getFileForUser(id, user.id);
        if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 404 });

        const { filename, content } = await request.json();
        const filePath = getFilePath(file.storagePath);

        if (content !== undefined) {
            await fsWriteFile(filePath, content, 'utf-8');
            await prisma.file.update({
                where: { id },
                data: { size: Buffer.byteLength(content, 'utf-8') },
            });
        }

        if (filename?.trim()) {
            await prisma.file.update({
                where: { id },
                data: { filename: filename.trim() },
            });
        }

        const updated = await prisma.file.findFirst({ where: { id } });
        return NextResponse.json({ file: updated });
    } catch (error) {
        console.error('Update file error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
