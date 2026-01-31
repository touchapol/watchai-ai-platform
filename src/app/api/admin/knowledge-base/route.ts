import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = [
            'text/plain',
            'text/markdown',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            return NextResponse.json({ error: 'Invalid file type. Only TXT, MD, PDF, DOC, DOCX allowed.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name;
        const ext = path.extname(filename);
        const storageName = `kb_${uuidv4()}${ext}`;
        const storagePath = `knowledge-base/${storageName}`;
        const fullPath = path.join(process.cwd(), 'uploads', storagePath);

        await mkdir(path.dirname(fullPath), { recursive: true });
        await writeFile(fullPath, buffer);

        const kbDoc = await prisma.knowledgeBaseDoc.create({
            data: {
                filename,
                storagePath,
                mimeType: file.type || 'text/plain',
                size: buffer.length,
                isIndexed: false,
            },
        });

        return NextResponse.json({
            success: true,
            document: {
                id: kbDoc.id,
                filename: kbDoc.filename,
                size: kbDoc.size,
                isIndexed: kbDoc.isIndexed,
            },
        });
    } catch (error) {
        console.error('KB upload error:', error);
        return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const documents = await prisma.knowledgeBaseDoc.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const totalChunks = await prisma.documentChunk.count();

        return NextResponse.json({
            documents: documents.map(d => ({
                id: d.id,
                filename: d.filename,
                size: d.size,
                isIndexed: d.isIndexed,
                indexedAt: d.indexedAt,
                createdAt: d.createdAt,
            })),
            totalChunks,
        });
    } catch (error) {
        console.error('KB list error:', error);
        return NextResponse.json({ error: 'Failed to list' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const docId = searchParams.get('id');

        if (!docId) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.$executeRaw`DELETE FROM document_chunks WHERE "kbDocId" = ${docId}`;
        await prisma.knowledgeBaseDoc.delete({ where: { id: docId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('KB delete error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
