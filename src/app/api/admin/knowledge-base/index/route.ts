import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { chunkDocument, generateEmbedding } from '@/lib/embedding';
import { readFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 300;

export async function POST(request: Request) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { docId } = body;

        if (!docId) {
            return NextResponse.json({ error: 'docId is required' }, { status: 400 });
        }

        const doc = await prisma.knowledgeBaseDoc.findUnique({
            where: { id: docId },
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        await prisma.$executeRaw`DELETE FROM document_chunks WHERE "kbDocId" = ${docId}`;

        const filePath = path.join(process.cwd(), 'uploads', doc.storagePath);
        const fileBuffer = await readFile(filePath);
        let content = fileBuffer.toString('utf-8');
        content = content.replace(/\x00/g, '');

        const chunks = chunkDocument(content);
        let chunksCreated = 0;

        const BATCH_SIZE = 5;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (chunk, idx) => {
                const chunkIndex = i + idx;
                const cleanChunk = chunk.replace(/\x00/g, '');
                const embedding = await generateEmbedding(cleanChunk);

                if (embedding) {
                    const embeddingStr = `[${embedding.join(',')}]`;
                    await prisma.$executeRaw`
                        INSERT INTO document_chunks (id, "kbDocId", "chunkIndex", content, embedding, "createdAt")
                        VALUES (gen_random_uuid(), ${docId}, ${chunkIndex}, ${cleanChunk}, ${embeddingStr}::vector, NOW())
                    `;
                    chunksCreated++;
                }
            }));
        }

        await prisma.knowledgeBaseDoc.update({
            where: { id: docId },
            data: { isIndexed: true, indexedAt: new Date() },
        });

        return NextResponse.json({
            success: true,
            message: `Indexed ${chunksCreated} chunks`,
            chunksCreated,
        });
    } catch (error) {
        console.error('Index KB doc error:', error);
        return NextResponse.json({ error: 'Failed to index' }, { status: 500 });
    }
}
