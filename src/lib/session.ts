import { getMongoDb } from './mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export interface DeviceSession {
    _id?: ObjectId;
    userId: string;
    deviceToken: string;
    userAgent: string;
    ip: string;
    createdAt: Date;
    expiresAt: Date;
    lastActive: Date;
}

export async function createSession(userId: string, userAgent: string, ip: string): Promise<string> {
    const db = await getMongoDb();
    const deviceToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.collection<DeviceSession>('device_sessions').insertOne({
        userId,
        deviceToken,
        userAgent,
        ip,
        createdAt: now,
        expiresAt,
        lastActive: now,
    });

    return deviceToken;
}

export async function validateSession(deviceToken: string): Promise<DeviceSession | null> {
    const db = await getMongoDb();
    const session = await db.collection<DeviceSession>('device_sessions').findOne({
        deviceToken,
        expiresAt: { $gt: new Date() }
    });

    if (session) {
        await db.collection('device_sessions').updateOne(
            { _id: session._id },
            { $set: { lastActive: new Date() } }
        );
    }

    return session;
}

export async function revokeSession(deviceToken: string): Promise<DeviceSession | null> {
    const db = await getMongoDb();
    const session = await db.collection<DeviceSession>('device_sessions').findOneAndDelete({ deviceToken });
    return session;
}

export async function revokeAllSessions(userId: string, exceptToken?: string): Promise<number> {
    const db = await getMongoDb();
    const filter: Record<string, unknown> = { userId };
    if (exceptToken) {
        filter.deviceToken = { $ne: exceptToken };
    }
    const result = await db.collection('device_sessions').deleteMany(filter);
    return result.deletedCount;
}

export async function getActiveSessions(userId: string): Promise<DeviceSession[]> {
    const db = await getMongoDb();
    return await db.collection<DeviceSession>('device_sessions')
        .find({
            userId,
            expiresAt: { $gt: new Date() }
        })
        .sort({ lastActive: -1 })
        .toArray();
}

export async function cleanExpiredSessions(): Promise<number> {
    const db = await getMongoDb();
    const result = await db.collection('device_sessions').deleteMany({
        expiresAt: { $lte: new Date() }
    });
    return result.deletedCount;
}
