import { cookies } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET = process.env.JWT_SECRET || 'csrf-secret-key';
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_EXPIRY = 60 * 60 * 1000;

function generateToken(): string {
    const timestamp = Date.now().toString();
    const random = randomBytes(32).toString('hex');
    const data = `${timestamp}:${random}`;
    const signature = createHmac('sha256', CSRF_SECRET).update(data).digest('hex');
    return `${data}:${signature}`;
}

function validateToken(token: string): boolean {
    try {
        const parts = token.split(':');
        if (parts.length !== 3) return false;

        const [timestamp, random, signature] = parts;
        const data = `${timestamp}:${random}`;
        const expectedSignature = createHmac('sha256', CSRF_SECRET).update(data).digest('hex');

        if (signature !== expectedSignature) return false;

        const tokenTime = parseInt(timestamp);
        if (Date.now() - tokenTime > TOKEN_EXPIRY) return false;

        return true;
    } catch {
        return false;
    }
}

export async function getOrCreateCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!token || !validateToken(token)) {
        token = generateToken();
    }

    return token;
}

export async function setCsrfCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    const isSecure = process.env.COOKIE_SECURE === 'true';
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: TOKEN_EXPIRY / 1000,
        path: '/',
    });
}

export async function verifyCsrfToken(request: Request): Promise<boolean> {
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (!headerToken) return false;

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    if (!cookieToken) return false;

    if (headerToken !== cookieToken) return false;

    return validateToken(cookieToken);
}

export { CSRF_HEADER_NAME };
