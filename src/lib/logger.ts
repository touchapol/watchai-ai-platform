import { getMongoDb } from './mongodb';
import { headers } from 'next/headers';

export type EventAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'REGISTER'
    | 'FILE_UPLOAD'
    | 'FILE_VIEW'
    | 'FILE_DELETE'
    | 'FILE_RENAME'
    | 'FILE_DOWNLOAD'
    | 'FILE_CREATE'
    | 'FILE_EDIT'
    | 'FOLDER_CREATE'
    | 'VIEW_FILES'
    | 'CHAT_MESSAGE'
    | 'CONVERSATION_CREATE'
    | 'CONVERSATION_DELETE'
    | 'CONVERSATION_SELECT'
    | 'SETTINGS_UPDATE'
    | 'PASSWORD_CHANGE'
    | 'VIEW_OVERVIEW'
    | 'VIEW_USAGE_LOG'
    | 'VIEW_EVENT_LOG'
    | 'VIEW_SECURITY_LOG'
    | 'VIEW_PROFILE'
    | 'VIEW_SETTINGS'
    | 'LOGOUT_ALL'
    | 'ADMIN_VIEW_OVERVIEW'
    | 'ADMIN_VIEW_USERS'
    | 'ADMIN_VIEW_USAGE_LOG'
    | 'ADMIN_VIEW_EVENT_LOG'
    | 'ADMIN_VIEW_SECURITY_LOG'
    | 'ADMIN_VIEW_SETTINGS'
    | 'ADMIN_UPDATE_SETTINGS'
    | 'ADMIN_UPDATE_USER';

export type SecurityEvent =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'PASSWORD_CHANGE'
    | 'LOGOUT'
    | 'SESSION_REVOKED'
    | 'ACCOUNT_LOCKED'
    | 'UNAUTHORIZED_ACCESS';

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

// Log event to MongoDB
export async function logEvent(
    userId: string | null,
    action: EventAction,
    resource: string,
    details?: Record<string, unknown>
): Promise<void> {
    try {
        const db = await getMongoDb();
        const headersList = await headers();

        await db.collection('event_logs').insertOne({
            timestamp: new Date(),
            userId,
            action,
            resource,
            method: details?.method || 'UNKNOWN',
            details: details || {},
            ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
            userAgent: headersList.get('user-agent') || 'unknown',
        });
    } catch (error) {
        console.error('Failed to log event:', error);
    }
}

// Log security event
export async function logSecurity(
    userId: string | null,
    event: SecurityEvent,
    severity: Severity,
    details?: Record<string, unknown>
): Promise<void> {
    try {
        const db = await getMongoDb();
        const headersList = await headers();

        await db.collection('security_logs').insertOne({
            timestamp: new Date(),
            userId,
            event,
            severity,
            details: details || {},
            ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
            userAgent: headersList.get('user-agent') || 'unknown',
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

// Log LLM usage
export async function logLLM(
    userId: string,
    conversationId: string,
    messageId: string,
    usage: {
        model: string;
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        latencyMs: number;
        status: 'SUCCESS' | 'ERROR';
        error?: string;
    }
): Promise<void> {
    try {
        const db = await getMongoDb();

        await db.collection('llm_logs').insertOne({
            timestamp: new Date(),
            userId,
            conversationId,
            messageId,
            ...usage,
        });
    } catch (error) {
        console.error('Failed to log LLM usage:', error);
    }
}

// Get event logs (for admin)
export async function getEventLogs(
    filters: {
        userId?: string;
        action?: EventAction;
        startDate?: Date;
        endDate?: Date;
    } = {},
    page = 1,
    limit = 10
) {
    const db = await getMongoDb();

    const query: Record<string, unknown> = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) (query.timestamp as Record<string, Date>).$gte = filters.startDate;
        if (filters.endDate) (query.timestamp as Record<string, Date>).$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        db.collection('event_logs')
            .find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        db.collection('event_logs').countDocuments(query)
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get security logs (for admin)
export async function getSecurityLogs(
    filters: {
        userId?: string;
        severity?: Severity;
        startDate?: Date;
        endDate?: Date;
    } = {},
    page = 1,
    limit = 10
) {
    const db = await getMongoDb();

    const query: Record<string, unknown> = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) (query.timestamp as Record<string, Date>).$gte = filters.startDate;
        if (filters.endDate) (query.timestamp as Record<string, Date>).$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        db.collection('security_logs')
            .find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        db.collection('security_logs').countDocuments(query)
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get LLM logs for user with pagination
export async function getLLMLogs(
    userId: string,
    filters: {
        conversationId?: string;
        startDate?: Date;
        endDate?: Date;
    } = {},
    page = 1,
    limit = 10
) {
    const db = await getMongoDb();

    const query: Record<string, unknown> = { userId };
    if (filters.conversationId) query.conversationId = filters.conversationId;
    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) (query.timestamp as Record<string, Date>).$gte = filters.startDate;
        if (filters.endDate) (query.timestamp as Record<string, Date>).$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        db.collection('llm_logs')
            .find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        db.collection('llm_logs').countDocuments(query)
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Get token usage summary
export async function getTokenUsageSummary(
    userId: string,
    period: 'day' | 'week' | 'month' = 'day'
) {
    const db = await getMongoDb();

    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }

    const result = await db.collection('llm_logs').aggregate([
        {
            $match: {
                userId,
                timestamp: { $gte: startDate },
                status: 'SUCCESS',
            },
        },
        {
            $group: {
                _id: null,
                totalPromptTokens: { $sum: '$promptTokens' },
                totalCompletionTokens: { $sum: '$completionTokens' },
                totalTokens: { $sum: '$totalTokens' },
                messageCount: { $sum: 1 },
            },
        },
    ]).toArray();

    return result[0] || {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        messageCount: 0,
    };
}
