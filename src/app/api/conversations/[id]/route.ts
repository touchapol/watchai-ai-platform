import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logEvent } from '@/lib/logger';
import { getMessagesByConversationId, deleteMessagesByConversationId } from '@/lib/messages';

interface RouteParams {
    params: Promise<{ id: string }>;
}

async function getConversationForUser(id: string, userId: string) {
    return prisma.conversation.findFirst({ where: { id, userId } });
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const conversation = await getConversationForUser(id, user.id);
        if (!conversation) return NextResponse.json({ error: 'ไม่พบการสนทนา' }, { status: 404 });

        const mongoMessages = await getMessagesByConversationId(id);
        const allAttachmentIds = mongoMessages.flatMap(msg => msg.attachments || []);

        const fileDetails = allAttachmentIds.length > 0
            ? await prisma.file.findMany({
                where: { id: { in: allAttachmentIds } },
                select: { id: true, filename: true, mimeType: true, size: true }
            })
            : [];

        const fileDetailsMap = new Map(fileDetails.map(f => [f.id, f]));

        const messages = mongoMessages.map(msg => ({
            id: msg._id?.toString(),
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content,
            promptTokens: msg.promptTokens,
            completionTokens: msg.completionTokens,
            totalTokens: msg.totalTokens,
            attachments: msg.attachments,
            attachmentDetails: msg.attachments?.map(id => fileDetailsMap.get(id)).filter(Boolean),
            citations: msg.citations,
            createdAt: msg.createdAt.toISOString(),
        }));

        return NextResponse.json({ conversation: { ...conversation, messages } });
    } catch (error) {
        console.error('Get conversation error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        const conversation = await getConversationForUser(id, user.id);
        if (!conversation) return NextResponse.json({ error: 'ไม่พบการสนทนา' }, { status: 404 });

        await deleteMessagesByConversationId(id);
        await prisma.conversation.delete({ where: { id } });

        await logEvent(user.id, 'CONVERSATION_DELETE', `/api/conversations/${id}`, {
            method: 'DELETE',
            conversationId: id,
        });

        return NextResponse.json({ message: 'ลบการสนทนาสำเร็จ' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const conversation = await getConversationForUser(id, user.id);
        if (!conversation) return NextResponse.json({ error: 'ไม่พบการสนทนา' }, { status: 404 });

        const updated = await prisma.conversation.update({
            where: { id },
            data: { title: body.title },
        });

        return NextResponse.json({ conversation: updated });
    } catch (error) {
        console.error('Update conversation error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
