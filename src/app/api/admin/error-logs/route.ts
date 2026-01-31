import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getErrorLogs, deleteErrorLog, clearAllErrorLogs } from '@/lib/errorLogger';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const source = searchParams.get('source') || undefined;

        const result = await getErrorLogs(page, limit, source);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลได้' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const clearAll = searchParams.get('clearAll') === 'true';

        if (clearAll) {
            await clearAllErrorLogs();
            return NextResponse.json({ success: true, message: 'ลบ logs ทั้งหมดเรียบร้อย' });
        }

        if (id) {
            const success = await deleteErrorLog(id);
            if (success) {
                return NextResponse.json({ success: true });
            }
            return NextResponse.json({ error: 'ไม่พบรายการที่ต้องการลบ' }, { status: 404 });
        }

        return NextResponse.json({ error: 'ต้องระบุ id หรือ clearAll' }, { status: 400 });
    } catch (error) {
        console.error('Error deleting log:', error);
        return NextResponse.json({ error: 'ไม่สามารถลบได้' }, { status: 500 });
    }
}
