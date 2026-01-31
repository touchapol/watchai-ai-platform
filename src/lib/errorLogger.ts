import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface ErrorLogData {
    source: string;
    errorType: string;
    message: string;
    details?: string;
    userId?: string;
    apiKeyId?: string;
    modelId?: string;
}

export async function logError(data: ErrorLogData): Promise<void> {
    try {
        const db = await getMongoDb();
        await db.collection('error_logs').insertOne({
            ...data,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error('Failed to log error:', error);
    }
}

export async function getErrorLogs(page = 1, limit = 20, source?: string) {
    const db = await getMongoDb();
    const query = source ? { source } : {};

    const [logs, total] = await Promise.all([
        db.collection('error_logs')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray(),
        db.collection('error_logs').countDocuments(query),
    ]);

    return {
        logs: logs.map(log => ({
            id: log._id.toString(),
            source: log.source,
            errorType: log.errorType,
            message: log.message,
            details: log.details,
            userId: log.userId,
            apiKeyId: log.apiKeyId,
            modelId: log.modelId,
            createdAt: log.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

export async function deleteErrorLog(id: string): Promise<boolean> {
    try {
        const db = await getMongoDb();
        const result = await db.collection('error_logs').deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Failed to delete error log:', error);
        return false;
    }
}

export async function clearAllErrorLogs(): Promise<boolean> {
    try {
        const db = await getMongoDb();
        await db.collection('error_logs').deleteMany({});
        return true;
    } catch (error) {
        console.error('Failed to clear error logs:', error);
        return false;
    }
}
