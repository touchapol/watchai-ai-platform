import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.API_KEY_SECRET;
    if (!key) {
        throw new Error('API_KEY_SECRET environment variable is not set');
    }
    return crypto.createHash('sha256').update(key).digest();
}

export function encryptApiKey(plainText: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
        return encryptedData;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***';
    const prefix = key.substring(0, 4);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
}

export function isEncrypted(value: string): boolean {
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}
