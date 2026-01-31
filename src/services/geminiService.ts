import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import prisma from '@/lib/db';

interface ApiKeyData {
    id: string;
    apiKey: string;
    dailyUsed: number;
    dailyLimit: number | null;
    isActive: boolean;
    isRateLimited: boolean;
}

let cachedKeys: ApiKeyData[] = [];
let lastFetch = 0;
const CACHE_TTL = 60000;

async function getActiveApiKey(): Promise<string> {
    const now = Date.now();

    if (now - lastFetch > CACHE_TTL || cachedKeys.length === 0) {
        const keys = await prisma.apiKey.findMany({
            where: {
                isActive: true,
                isRateLimited: false,
                provider: 'gemini'
            },
            orderBy: [{ priority: 'desc' }, { dailyUsed: 'asc' }],
            select: {
                id: true,
                apiKey: true,
                dailyUsed: true,
                dailyLimit: true,
                isActive: true,
                isRateLimited: true,
            }
        });

        cachedKeys = keys.filter(k => !k.dailyLimit || k.dailyUsed < k.dailyLimit);
        lastFetch = now;
    }

    if (cachedKeys.length > 0) {
        return cachedKeys[0].apiKey;
    }

    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'dummy-key-for-ui-demo';
}

async function markKeyUsed(keyId: string): Promise<void> {
    try {
        await prisma.apiKey.update({
            where: { id: keyId },
            data: {
                dailyUsed: { increment: 1 },
                minuteUsed: { increment: 1 },
                lastUsedAt: new Date(),
            }
        });

        const key = cachedKeys.find(k => k.id === keyId);
        if (key) key.dailyUsed++;
    } catch {
        // Ignore errors
    }
}

async function markKeyRateLimited(apiKey: string): Promise<void> {
    try {
        await prisma.apiKey.updateMany({
            where: { apiKey },
            data: {
                isRateLimited: true,
                rateLimitedAt: new Date(),
            }
        });

        cachedKeys = cachedKeys.filter(k => k.apiKey !== apiKey);
    } catch {
        // Ignore errors
    }
}

export const generateResponse = async (
    prompt: string,
    model: string = 'gemini-2.5-flash-preview'
): Promise<string> => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const apiKey = await getActiveApiKey();
            const ai = new GoogleGenAI({ apiKey });

            const response: GenerateContentResponse = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    systemInstruction: "You are an AI Platform assistant. Respond using Markdown.",
                }
            });

            const usedKey = cachedKeys.find(k => k.apiKey === apiKey);
            if (usedKey) await markKeyUsed(usedKey.id);

            return response.text || "No response generated.";
        } catch (error) {
            lastError = error as Error;
            console.error("Gemini API Error:", error);

            if (lastError.message?.includes('429') || lastError.message?.includes('quota')) {
                const apiKey = await getActiveApiKey();
                await markKeyRateLimited(apiKey);
                continue;
            }

            break;
        }
    }

    return `**Error**: Unable to connect to LLM.\n\n*Simulated Response*: I understand you are asking about "${prompt}". As this is a UI demo without a live API key, I cannot generate a real-time response. \n\nHowever, I support:\n- Markdown rendering\n- Code blocks\n- Citations`;
};
