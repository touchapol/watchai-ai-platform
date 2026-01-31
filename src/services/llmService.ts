import prisma from '@/lib/db';
import { decryptApiKey, isEncrypted } from '@/lib/encryption';
import { readFile } from 'fs/promises';
import path from 'path';

export interface ApiKeyRecord {
    id: string;
    apiKey: string;
    dailyUsed: number;
    dailyLimit: number | null;
}

export async function getAvailableApiKey(providerName: string): Promise<ApiKeyRecord | null> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const apiKeys = await prisma.apiKey.findMany({
        where: {
            aiProvider: { name: providerName },
            isActive: true,
            isRateLimited: false,
        },
        orderBy: { priority: 'desc' },
    });

    for (const key of apiKeys) {
        if (key.lastResetAt < startOfDay) {
            await prisma.apiKey.update({
                where: { id: key.id },
                data: { dailyUsed: 0, minuteUsed: 0, lastResetAt: now, isRateLimited: false },
            });
            key.dailyUsed = 0;
        }

        if (key.dailyLimit && key.dailyUsed >= key.dailyLimit) {
            continue;
        }

        return key;
    }

    return null;
}

export async function incrementApiKeyUsage(keyId: string, tokens: number = 0): Promise<void> {
    const now = new Date();
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) return;

    const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    const shouldResetMinute = key.lastMinuteResetAt < startOfMinute;

    await prisma.apiKey.update({
        where: { id: keyId },
        data: {
            dailyUsed: { increment: 1 },
            dailyTokenUsed: { increment: tokens },
            minuteUsed: shouldResetMinute ? 1 : { increment: 1 },
            minuteTokenUsed: shouldResetMinute ? tokens : { increment: tokens },
            lastMinuteResetAt: shouldResetMinute ? now : undefined,
            lastUsedAt: now,
        },
    });
}

export async function markApiKeyRateLimited(keyId: string): Promise<void> {
    await prisma.apiKey.update({
        where: { id: keyId },
        data: {
            isRateLimited: true,
            rateLimitedAt: new Date(),
        },
    });
}

export function decryptKey(apiKey: string): string {
    if (isEncrypted(apiKey)) {
        return decryptApiKey(apiKey);
    }
    return apiKey;
}

export type GeminiMessagePart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type GeminiMessageContent = string | GeminiMessagePart[];

export type OpenAIMessagePart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
export type OpenAIMessageContent = string | OpenAIMessagePart[];
export type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: OpenAIMessageContent };

export interface Citation {
    source: string;
    content: string;
    url?: string;
    startIndex?: number;
    endIndex?: number;
}

export interface FileContent {
    type: 'IMAGE' | 'DOCUMENT';
    mimeType: string;
    data: string;
    filename: string;
}

export async function processAttachments(
    attachmentIds: string[],
    userId: string
): Promise<{ geminiContent: GeminiMessageContent; files: FileContent[] }> {
    const fileRecords = await prisma.file.findMany({
        where: { id: { in: attachmentIds }, userId },
    });

    const parts: GeminiMessagePart[] = [];
    const files: FileContent[] = [];
    let documentContents = '';

    for (const fileRecord of fileRecords) {
        const filePath = path.join(process.cwd(), 'uploads', fileRecord.storagePath);
        try {
            const fileBuffer = await readFile(filePath);

            if (fileRecord.type === 'IMAGE') {
                const mimeType = fileRecord.mimeType || 'image/jpeg';
                const base64Data = fileBuffer.toString('base64');
                parts.push({ inlineData: { mimeType, data: base64Data } });
                files.push({ type: 'IMAGE', mimeType, data: base64Data, filename: fileRecord.filename });
            } else if (fileRecord.type === 'DOCUMENT') {
                const fileContent = fileBuffer.toString('utf-8');
                documentContents += `\n\n--- เอกสาร: ${fileRecord.filename} ---\n${fileContent}`;
                files.push({ type: 'DOCUMENT', mimeType: 'text/plain', data: fileContent, filename: fileRecord.filename });
            }
        } catch (err) {
            console.error(`Failed to read file ${fileRecord.filename}:`, err);
        }
    }

    return {
        geminiContent: parts.length > 0 ? parts : documentContents,
        files,
    };
}

export function convertToOpenAIContent(geminiContent: GeminiMessageContent, textContent: string): OpenAIMessageContent {
    if (typeof geminiContent === 'string') {
        return geminiContent || textContent;
    }

    return geminiContent.map((part) => {
        if ('text' in part) {
            return { type: 'text' as const, text: part.text };
        } else if ('inlineData' in part) {
            return {
                type: 'image_url' as const,
                image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
            };
        }
        return { type: 'text' as const, text: '' };
    });
}

export function buildOpenAIMessages(
    systemInstruction: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>,
    userContent: OpenAIMessageContent
): OpenAIMessage[] {
    return [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({
            role: h.role === 'model' ? 'assistant' as const : 'user' as const,
            content: h.parts.map(p => p.text || '').join(''),
        })),
        { role: 'user' as const, content: userContent },
    ];
}
