import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { indexDocument } from '@/lib/rag';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { fileId } = body;

        if (!fileId) {
            return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
        }

        const file = await prisma.file.findFirst({
            where: { id: fileId, userId: user.id },
        });

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const result = await indexDocument(fileId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Indexed ${result.chunksCreated} chunks`,
                chunksCreated: result.chunksCreated,
            });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error('Index error:', error);
        return NextResponse.json({ error: 'Failed to index document' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const [files, total] = await Promise.all([
            prisma.file.findMany({
                where: { userId: user.id, type: 'DOCUMENT' },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: { select: { chunks: true } },
                },
            }),
            prisma.file.count({ where: { userId: user.id, type: 'DOCUMENT' } }),
        ]);

        return NextResponse.json({
            files: files.map(f => ({
                id: f.id,
                filename: f.filename,
                size: f.size,
                isIndexed: f.isIndexed,
                indexedAt: f.indexedAt,
                chunksCount: f._count.chunks,
                createdAt: f.createdAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Get indexed files error:', error);
        return NextResponse.json({ error: 'Failed to get files' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
        }

        const file = await prisma.file.findFirst({
            where: { id: fileId, userId: user.id },
        });

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        await prisma.$executeRaw`DELETE FROM document_chunks WHERE "fileId" = ${fileId}`;
        await prisma.file.update({
            where: { id: fileId },
            data: { isIndexed: false, indexedAt: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete index error:', error);
        return NextResponse.json({ error: 'Failed to delete index' }, { status: 500 });
    }
}
