import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getSecretKey(): Buffer {
    const key = process.env.PASSWORD_SECRET_KEY;
    if (!key) throw new Error('PASSWORD_SECRET_KEY is not defined');
    return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

function encrypt(text: string): string {
    const key = getSecretKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const combined = Buffer.concat([iv, cipher.getAuthTag(), Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
}

function decrypt(encryptedBase64: string): string {
    const key = getSecretKey();
    const combined = Buffer.from(encryptedBase64, 'base64');

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

export async function hashPassword(password: string): Promise<string> {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    return encrypt(hashed);
}

export async function verifyPassword(password: string, encryptedHash: string): Promise<boolean> {
    try {
        const hashed = decrypt(encryptedHash);
        return await bcrypt.compare(password, hashed);
    } catch {
        return false;
    }
}
