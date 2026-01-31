import prisma from '@/lib/db';
import { chunkDocument, generateEmbedding } from '@/lib/embedding';
import { readFile } from 'fs/promises';
import path from 'path';

export async function indexDocument(fileId: string): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
        const file = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            return { success: false, chunksCreated: 0, error: 'File not found' };
        }

        if (file.type !== 'DOCUMENT') {
            return { success: false, chunksCreated: 0, error: 'Only documents can be indexed' };
        }

        await prisma.$executeRaw`DELETE FROM document_chunks WHERE "fileId" = ${fileId}`;

        const filePath = path.join(process.cwd(), 'uploads', file.storagePath);
        const fileBuffer = await readFile(filePath);
        const content = fileBuffer.toString('utf-8');

        const chunks = chunkDocument(content);
        let chunksCreated = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);

            if (embedding) {
                const embeddingStr = `[${embedding.join(',')}]`;
                await prisma.$executeRaw`
                    INSERT INTO document_chunks (id, "fileId", "chunkIndex", content, embedding, "createdAt")
                    VALUES (gen_random_uuid(), ${fileId}, ${i}, ${chunk}, ${embeddingStr}::vector, NOW())
                `;
                chunksCreated++;
            }
        }

        await prisma.file.update({
            where: { id: fileId },
            data: { isIndexed: true, indexedAt: new Date() },
        });

        return { success: true, chunksCreated };
    } catch (error) {
        console.error('Error indexing document:', error);
        return { success: false, chunksCreated: 0, error: String(error) };
    }
}

export async function searchSimilarChunks(
    query: string,
    userId: string,
    limit: number = 5
): Promise<{ id: string; content: string; filename: string; similarity: number }[]> {
    try {
        const queryEmbedding = await generateEmbedding(query);
        if (!queryEmbedding) {
            return [];
        }

        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        const results = await prisma.$queryRaw<
            { id: string; content: string; filename: string; similarity: number }[]
        >`
            SELECT 
                dc.id,
                dc.content,
                f.filename,
                1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
            FROM document_chunks dc
            JOIN files f ON dc."fileId" = f.id
            WHERE f."userId" = ${userId}
            ORDER BY dc.embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `;

        return results.filter(r => r.similarity > 0.5);
    } catch (error) {
        console.error('Error searching similar chunks:', error);
        return [];
    }
}

export async function getRelevantContext(
    query: string,
    userId: string,
    maxTokens: number = 2000
): Promise<{ context: string; sources: string[] }> {
    const chunks = await searchSimilarChunks(query, userId, 10);

    if (chunks.length === 0) {
        return { context: '', sources: [] };
    }

    let context = '';
    const sources = new Set<string>();
    let estimatedTokens = 0;

    for (const chunk of chunks) {
        const chunkTokens = Math.ceil(chunk.content.length / 4);
        if (estimatedTokens + chunkTokens > maxTokens) break;

        context += `\n\n[จาก: ${chunk.filename}]\n${chunk.content}`;
        sources.add(chunk.filename);
        estimatedTokens += chunkTokens;
    }

    return { context: context.trim(), sources: Array.from(sources) };
}
