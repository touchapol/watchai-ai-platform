import { NextResponse } from 'next/server';
import { getOrCreateCsrfToken, setCsrfCookie } from '@/lib/csrf';

export async function GET() {
    try {
        const token = await getOrCreateCsrfToken();
        await setCsrfCookie(token);

        return NextResponse.json({ csrfToken: token });
    } catch (error) {
        console.error('CSRF token error:', error);
        return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
    }
}
