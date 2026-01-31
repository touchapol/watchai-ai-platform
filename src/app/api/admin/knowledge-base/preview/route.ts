import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
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

        const doc = await prisma.knowledgeBaseDoc.findUnique({
            where: { id: docId },
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const filePath = path.join(process.cwd(), 'uploads', doc.storagePath);
        const fileBuffer = await readFile(filePath);
        let content = fileBuffer.toString('utf-8');
        content = content.replace(/\x00/g, '');

        const maxLength = 50000;
        const truncated = content.length > maxLength;
        const displayContent = truncated ? content.substring(0, maxLength) : content;

        return NextResponse.json({
            id: doc.id,
            filename: doc.filename,
            content: displayContent,
            truncated,
            totalLength: content.length,
        });
    } catch (error) {
        console.error('Preview error:', error);
        return NextResponse.json({ error: 'Failed to preview' }, { status: 500 });
    }
}
