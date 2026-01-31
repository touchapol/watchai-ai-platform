import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const modelId = searchParams.get('model');

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let providerName: string | null = null;

        if (modelId) {
            const model = await prisma.aiModel.findFirst({
                where: { name: modelId, isActive: true },
                include: { provider: { select: { name: true } } },
            });
            if (model) {
                providerName = model.provider.name;
            }
        }

        if (!providerName && modelId) {
            const settings = await prisma.systemSettings.findUnique({ where: { id: 'system' } });
            if (settings?.defaultModelId) {
                const defaultModel = await prisma.aiModel.findFirst({
                    where: { name: settings.defaultModelId, isActive: true },
                    include: { provider: { select: { name: true } } },
                });
                if (defaultModel) {
                    providerName = defaultModel.provider.name;
                }
            }
        }

        if (!providerName) {
            const firstModel = await prisma.aiModel.findFirst({
                where: { isActive: true },
                include: { provider: { select: { name: true } } },
                orderBy: { displayName: 'asc' },
            });
            if (firstModel) {
                providerName = firstModel.provider.name;
            }
        }

        const whereClause = {
            isActive: true,
            isRateLimited: false,
            ...(providerName ? { aiProvider: { name: providerName } } : {}),
        };

        const activeApiKeys = await prisma.apiKey.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                dailyLimit: true,
                dailyUsed: true,
                dailyTokenLimit: true,
                dailyTokenUsed: true,
                lastResetAt: true,
            },
        });

        let hasAvailableKey = false;
        let totalDailyLimit = 0;
        let totalDailyUsed = 0;
        let totalTokenLimit = 0;
        let totalTokenUsed = 0;

        for (const key of activeApiKeys) {
            const needsReset = key.lastResetAt < startOfDay;
            const dailyUsed = needsReset ? 0 : key.dailyUsed;
            const tokenUsed = needsReset ? 0 : key.dailyTokenUsed;

            if (key.dailyLimit) {
                totalDailyLimit += key.dailyLimit;
                totalDailyUsed += dailyUsed;
            }

            if (key.dailyTokenLimit) {
                totalTokenLimit += key.dailyTokenLimit;
                totalTokenUsed += tokenUsed;
            }

            const withinDailyLimit = !key.dailyLimit || dailyUsed < key.dailyLimit;
            const withinTokenLimit = !key.dailyTokenLimit || tokenUsed < key.dailyTokenLimit;

            if (withinDailyLimit && withinTokenLimit) {
                hasAvailableKey = true;
            }
        }

        const canSend = hasAvailableKey;
        const remainingRequests = Math.max(0, totalDailyLimit - totalDailyUsed);
        const remainingTokens = Math.max(0, totalTokenLimit - totalTokenUsed);

        return NextResponse.json({
            canSend,
            provider: providerName,
            remainingRequests: totalDailyLimit > 0 ? remainingRequests : null,
            remainingTokens: totalTokenLimit > 0 ? remainingTokens : null,
            totalDailyLimit: totalDailyLimit > 0 ? totalDailyLimit : null,
            totalTokenLimit: totalTokenLimit > 0 ? totalTokenLimit : null,
            message: canSend ? null : `ไม่สามารถส่งข้อความได้ เนื่องจากโควต้า${providerName ? ` (${providerName})` : ''} หมดแล้ว`,
        });
    } catch (error) {
        console.error('Check quota error:', error);
        return NextResponse.json({
            canSend: true,
            error: 'ไม่สามารถตรวจสอบโควต้าได้'
        });
    }
}
