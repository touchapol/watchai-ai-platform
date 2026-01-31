import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logEvent, EventAction } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        const payload = token ? verifyToken(token) : null;

        if (!payload?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, resource, details } = await request.json();

        const validActions: EventAction[] = [
            'VIEW_OVERVIEW', 'VIEW_USAGE_LOG', 'VIEW_EVENT_LOG',
            'VIEW_SECURITY_LOG', 'VIEW_SETTINGS', 'VIEW_PROFILE', 'SETTINGS_UPDATE',
            'PASSWORD_CHANGE', 'LOGOUT_ALL', 'VIEW_FILES',
            'FILE_UPLOAD', 'FILE_DELETE', 'FILE_RENAME', 'FILE_DOWNLOAD',
            'FILE_CREATE', 'FILE_EDIT', 'FOLDER_CREATE',
            'CONVERSATION_SELECT'
        ];

        if (!validActions.includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await logEvent(payload.userId, action, resource || '/dashboard', details);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Log event error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
