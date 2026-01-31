import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { logEvent } from '@/lib/logger';
import { encryptApiKey } from '@/lib/encryption';

const PROVIDERS = {
    gemini: {
        name: 'Google Gemini',
        icon: 'auto_awesome',
        color: '#4285f4',
        keyPrefix: 'AIza',
        docsUrl: 'https://aistudio.google.com/apikey'
    },
    openai: {
        name: 'OpenAI',
        icon: 'smart_toy',
        color: '#10a37f',
        keyPrefix: 'sk-',
        docsUrl: 'https://platform.openai.com/api-keys'
    },
    claude: {
        name: 'Anthropic Claude',
        icon: 'psychology',
        color: '#d97706',
        keyPrefix: 'sk-ant-',
        docsUrl: 'https://console.anthropic.com/settings/keys'
    },
    grok: {
        name: 'xAI Grok',
        icon: 'bolt',
        color: '#1da1f2',
        keyPrefix: 'xai-',
        docsUrl: 'https://console.x.ai'
    },
    deepseek: {
        name: 'DeepSeek',
        icon: 'explore',
        color: '#6366f1',
        keyPrefix: 'sk-',
        docsUrl: 'https://platform.deepseek.com/api_keys'
    }
};

export async function GET() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_VIEW_API_KEYS' as never, '/admin/api-keys', {});
        }

        const apiKeys = await prisma.apiKey.findMany({
            orderBy: [{ provider: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                name: true,
                description: true,
                provider: true,
                isActive: true,
                priority: true,
                dailyLimit: true,
                dailyUsed: true,
                minuteLimit: true,
                minuteUsed: true,
                lastResetAt: true,
                lastUsedAt: true,
                isRateLimited: true,
                rateLimitedAt: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return NextResponse.json({ apiKeys, providers: PROVIDERS });
    } catch (error) {
        console.error('Get API keys error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function verifyApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        switch (provider) {
            case 'gemini': {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey });
                await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: 'test',
                });
                return { valid: true };
            }
            case 'openai': {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                if (res.ok) return { valid: true };
                return { valid: false, error: 'Invalid OpenAI API key' };
            }
            case 'claude': {
                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 1,
                        messages: [{ role: 'user', content: 'hi' }]
                    })
                });
                if (res.ok || res.status === 400) return { valid: true };
                return { valid: false, error: 'Invalid Claude API key' };
            }
            case 'grok': {
                const res = await fetch('https://api.x.ai/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                if (res.ok) return { valid: true };
                return { valid: false, error: 'Invalid Grok API key' };
            }
            case 'deepseek': {
                const res = await fetch('https://api.deepseek.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                if (res.ok) return { valid: true };
                return { valid: false, error: 'Invalid DeepSeek API key' };
            }
            default:
                return { valid: true };
        }
    } catch (error) {
        const err = error as Error;
        if (err.message?.includes('API key') || err.message?.includes('401') || err.message?.includes('403')) {
            return { valid: false, error: 'Invalid API key' };
        }
        return { valid: true };
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, apiKey, provider = 'gemini' } = body;

        if (!name || !apiKey) {
            return NextResponse.json({ error: 'Name and API key are required' }, { status: 400 });
        }

        if (!Object.keys(PROVIDERS).includes(provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        const verification = await verifyApiKey(provider, apiKey);
        if (!verification.valid) {
            return NextResponse.json({ error: verification.error || 'Invalid API key' }, { status: 400 });
        }

        const defaultLimits: Record<string, { daily: number; minute: number }> = {
            gemini: { daily: 1500, minute: 15 },
            openai: { daily: 10000, minute: 60 },
            claude: { daily: 10000, minute: 60 },
            grok: { daily: 10000, minute: 60 },
            deepseek: { daily: 10000, minute: 60 },
        };

        const limits = defaultLimits[provider] || { daily: 1500, minute: 15 };

        const encryptedApiKey = encryptApiKey(apiKey);

        const newApiKey = await prisma.apiKey.create({
            data: {
                name,
                description,
                apiKey: encryptedApiKey,
                provider,
                dailyLimit: limits.daily,
                minuteLimit: limits.minute,
            }
        });

        const user = await getCurrentUser();
        if (user) {
            logEvent(user.id, 'ADMIN_ADD_API_KEY' as never, '/admin/api-keys', {
                keyId: newApiKey.id,
                name,
                provider
            });
        }

        return NextResponse.json({
            apiKey: {
                id: newApiKey.id,
                name: newApiKey.name,
                description: newApiKey.description,
                provider: newApiKey.provider,
                isActive: newApiKey.isActive,
                priority: newApiKey.priority,
                dailyLimit: newApiKey.dailyLimit,
                dailyUsed: newApiKey.dailyUsed,
                createdAt: newApiKey.createdAt,
            },
            verified: true
        }, { status: 201 });
    } catch (error) {
        console.error('Create API key error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

