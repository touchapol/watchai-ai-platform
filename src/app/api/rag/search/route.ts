import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { searchSimilarChunks, getRelevantContext } from '@/lib/rag';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { query, limit = 5, format = 'chunks' } = body;

        if (!query) {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

        if (format === 'context') {
            const { context, sources } = await getRelevantContext(query, user.id);
            return NextResponse.json({ context, sources });
        }

        const chunks = await searchSimilarChunks(query, user.id, limit);
        return NextResponse.json({ chunks });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
    }
}
