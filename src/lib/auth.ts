import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './db';

export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    role: 'USER' | 'ADMIN';
    deviceToken?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const DEFAULT_SESSION_TIMEOUT_HOURS = 168;

export async function getSessionTimeout(): Promise<number> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'system' }
        });
        return settings?.sessionTimeoutHours || DEFAULT_SESSION_TIMEOUT_HOURS;
    } catch {
        return DEFAULT_SESSION_TIMEOUT_HOURS;
    }
}

export function generateToken(user: {
    id: string;
    email: string;
    username: string;
    role: 'USER' | 'ADMIN';
    deviceToken?: string;
}, expiresInHours: number = DEFAULT_SESSION_TIMEOUT_HOURS): string {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        deviceToken: user.deviceToken,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: `${expiresInHours}h` });
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {

        return null;
    }
}

/**
 * Get current user from request cookies
 */
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
        return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            createdAt: true,
        },
    });

    return user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
    const user = await getCurrentUser();
    return user?.role === 'ADMIN';
}
