import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
    getUserMemories,
    createMemory,
    deleteMemory,
    updateMemory,
    getMemoryCount,
    MemoryType,
} from '@/lib/memory';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const memories = await getUserMemories(user.id);
        const count = await getMemoryCount(user.id);

        return NextResponse.json({ memories, count });
    } catch (error) {
        console.error('Error fetching memories:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const body = await request.json();
        const { type, content } = body as { type: MemoryType; content: string };

        if (!type || !content?.trim()) {
            return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
        }

        const validTypes: MemoryType[] = ['fact', 'preference', 'instruction', 'context'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'ประเภท memory ไม่ถูกต้อง' }, { status: 400 });
        }

        const memory = await createMemory({
            userId: user.id,
            type,
            content: content.trim(),
            source: 'manual',
            isActive: true,
        });

        return NextResponse.json({ memory });
    } catch (error) {
        console.error('Error creating memory:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const memoryId = searchParams.get('id');

        if (!memoryId) {
            return NextResponse.json({ error: 'ไม่พบ memory ID' }, { status: 400 });
        }

        const deleted = await deleteMemory(memoryId, user.id);

        if (!deleted) {
            return NextResponse.json({ error: 'ไม่พบ memory หรือไม่มีสิทธิ์ลบ' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting memory:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const body = await request.json();
        const { id, content, type, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'ไม่พบ memory ID' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {};
        if (content !== undefined) updates.content = content;
        if (type !== undefined) updates.type = type;
        if (isActive !== undefined) updates.isActive = isActive;

        const updated = await updateMemory(id, updates);

        if (!updated) {
            return NextResponse.json({ error: 'ไม่พบ memory' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating memory:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
