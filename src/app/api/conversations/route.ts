import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logEvent } from '@/lib/logger';
import { getMessageCount } from '@/lib/messages';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const search = new URL(request.url).searchParams.get('search');

        const conversations = await prisma.conversation.findMany({
            where: {
                userId: user.id,
                ...(search && { title: { contains: search, mode: 'insensitive' } }),
            },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, createdAt: true, updatedAt: true },
        });

        const conversationsWithCounts = await Promise.all(
            conversations.map(async conv => ({
                ...conv,
                _count: { messages: await getMessageCount(conv.id) },
            }))
        );

        return NextResponse.json({ conversations: conversationsWithCounts });
    } catch (error) {
        console.error('List conversations error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const { title } = await request.json();

        const conversation = await prisma.conversation.create({
            data: { userId: user.id, title: title || 'แชทใหม่' },
        });

        await logEvent(user.id, 'CONVERSATION_CREATE', '/api/conversations', {
            method: 'POST',
            conversationId: conversation.id,
        });

        return NextResponse.json({ conversation }, { status: 201 });
    } catch (error) {
        console.error('Create conversation error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
