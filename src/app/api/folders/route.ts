import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface FolderInfo {
    name: string;
    path: string;
    fileCount: number;
    folderCount: number;
    createdAt: string;
}

async function getFolderInfo(folderPath: string, relativePath: string): Promise<FolderInfo> {
    const stats = await stat(folderPath);
    const entries = await readdir(folderPath, { withFileTypes: true });

    return {
        name: path.basename(folderPath),
        path: relativePath,
        fileCount: entries.filter(e => e.isFile() && !e.name.startsWith('.')).length,
        folderCount: entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).length,
        createdAt: stats.birthtime.toISOString(),
    };
}

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const currentPath = searchParams.get('path') || '';

        const userDir = path.join(process.cwd(), 'uploads', user.id);
        const targetDir = path.join(userDir, currentPath);

        if (!existsSync(targetDir)) {
            await mkdir(targetDir, { recursive: true });
            return NextResponse.json({ folders: [], currentPath });
        }

        const entries = await readdir(targetDir, { withFileTypes: true });
        const folders: FolderInfo[] = [];

        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                const folderPath = path.join(targetDir, entry.name);
                const relativePath = path.join(currentPath, entry.name);
                folders.push(await getFolderInfo(folderPath, relativePath));
            }
        }

        folders.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ folders, currentPath });
    } catch (error) {
        console.error('Get folders error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { name, parentPath } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'กรุณาระบุชื่อโฟลเดอร์' }, { status: 400 });
        }

        const safeName = name.trim().replace(/[/\\?%*:|"<>]/g, '-');
        const userDir = path.join(process.cwd(), 'uploads', user.id);
        const newFolderPath = path.join(userDir, parentPath || '', safeName);

        if (existsSync(newFolderPath)) {
            return NextResponse.json({ error: 'โฟลเดอร์นี้มีอยู่แล้ว' }, { status: 400 });
        }

        await mkdir(newFolderPath, { recursive: true });

        const relativePath = path.join(parentPath || '', safeName);
        const folderInfo = await getFolderInfo(newFolderPath, relativePath);

        return NextResponse.json({ folder: folderInfo }, { status: 201 });
    } catch (error) {
        console.error('Create folder error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const folderPath = searchParams.get('path') || '';

        if (!folderPath) {
            return NextResponse.json({ error: 'กรุณาระบุ path' }, { status: 400 });
        }

        const userDir = path.join(process.cwd(), 'uploads', user.id);
        const targetPath = path.join(userDir, folderPath);

        if (!existsSync(targetPath)) {
            return NextResponse.json({ error: 'ไม่พบโฟลเดอร์' }, { status: 404 });
        }

        const prisma = (await import('@/lib/db')).default;
        const storagePathPrefix = `${user.id}/${folderPath}`;

        await prisma.file.deleteMany({
            where: {
                userId: user.id,
                storagePath: {
                    startsWith: storagePathPrefix
                }
            }
        });

        const { rm } = await import('fs/promises');
        await rm(targetPath, { recursive: true, force: true });

        return NextResponse.json({ message: 'ลบโฟลเดอร์สำเร็จ' });
    } catch (error) {
        console.error('Delete folder error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
