import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/db';
import { decryptApiKey, isEncrypted } from '@/lib/encryption';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function chunkDocument(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + CHUNK_SIZE;

        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);

            if (breakPoint > start + CHUNK_SIZE / 2) {
                end = breakPoint + 1;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - CHUNK_OVERLAP;

        if (start < 0) start = 0;
        if (start >= text.length) break;
    }

    return chunks.filter(chunk => chunk.length > 50);
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                aiProvider: { name: 'gemini' },
                isActive: true,
                isRateLimited: false,
            },
            orderBy: { priority: 'desc' },
        });

        if (!apiKey) {
            console.error('No Gemini API key available for embeddings');
            return null;
        }

        let apiKeyValue = apiKey.apiKey;
        if (isEncrypted(apiKeyValue)) {
            apiKeyValue = decryptApiKey(apiKeyValue);
        }

        const genAI = new GoogleGenerativeAI(apiKeyValue);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}

export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    const results: (number[] | null)[] = [];

    for (const text of texts) {
        const embedding = await generateEmbedding(text);
        results.push(embedding);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
}

interface SimilarChunk {
    content: string;
    similarity: number;
    docName: string;
}

export async function searchSimilarChunks(query: string, limit: number = 5): Promise<SimilarChunk[]> {
    try {
        const queryEmbedding = await generateEmbedding(query);
        if (!queryEmbedding) return [];

        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        const results = await prisma.$queryRaw<Array<{
            content: string;
            similarity: number;
            filename: string;
        }>>`
            SELECT 
                dc.content,
                1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity,
                kb.filename
            FROM document_chunks dc
            JOIN knowledge_base_docs kb ON dc."kbDocId" = kb.id
            WHERE kb."isIndexed" = true
            ORDER BY dc.embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `;

        return results
            .filter(r => r.similarity > 0.3)
            .map(r => ({
                content: r.content,
                similarity: r.similarity,
                docName: r.filename,
            }));
    } catch (error) {
        console.error('Error searching similar chunks:', error);
        return [];
    }
}

