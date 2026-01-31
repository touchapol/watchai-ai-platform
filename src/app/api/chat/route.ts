import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logEvent, logLLM } from '@/lib/logger';
import { logError } from '@/lib/errorLogger';
import { SYSTEM_INSTRUCTION } from '@/lib/constants';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import path from 'path';
import { createMessage, getRecentMessages, ChatMessage } from '@/lib/messages';
import { decryptApiKey, isEncrypted } from '@/lib/encryption';
import { getMemoriesForContext } from '@/lib/memory';
import { searchSimilarChunks } from '@/lib/embedding';



async function getAvailableApiKey(providerName: string) {
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

async function incrementApiKeyUsage(keyId: string, tokens: number = 0) {
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

async function markApiKeyRateLimited(keyId: string) {
    await prisma.apiKey.update({
        where: { id: keyId },
        data: {
            isRateLimited: true,
            rateLimitedAt: new Date(),
        },
    });
}

export async function GET() {
    try {
        const models = await prisma.aiModel.findMany({
            where: {
                isActive: true,
                provider: {
                    isActive: true,
                }
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                provider: {
                    select: {
                        name: true,
                        displayName: true,
                        color: true,
                    }
                }
            },
            orderBy: [
                { provider: { name: 'asc' } },
                { displayName: 'asc' }
            ]
        });

        if (models.length === 0) {
            return NextResponse.json({
                models: [],
                message: 'ยังไม่มี Model ที่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
            });
        }

        return NextResponse.json({
            models: models.map(m => ({
                id: m.name,
                name: m.name,
                displayName: m.displayName,
                description: m.description,
                provider: m.provider
            }))
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        await logError({
            source: 'chat-api',
            errorType: 'FETCH_MODELS_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: String(error),
        });
        return NextResponse.json({
            models: [],
            message: 'เกิดข้อผิดพลาดในการโหลด Model'
        });
    }
}

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
        }

        const body = await request.json();
        const { conversationId, content, attachments, model: selectedModel, isRetry } = body;

        let modelId = selectedModel;
        if (!modelId) {
            const settings = await prisma.systemSettings.findUnique({ where: { id: 'system' } });
            if (settings?.defaultModelId) {
                modelId = settings.defaultModelId;
            } else {
                const firstModel = await prisma.aiModel.findFirst({ where: { isActive: true }, orderBy: { displayName: 'asc' } });
                if (firstModel) {
                    modelId = firstModel.name;
                } else {
                    return NextResponse.json({ error: 'ยังไม่มี Model พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }, { status: 503 });
                }
            }
        }

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'กรุณาพิมพ์ข้อความ' }, { status: 400 });
        }


        let conversation;
        let existingMessages: ChatMessage[] = [];

        if (conversationId) {
            conversation = await prisma.conversation.findFirst({
                where: { id: conversationId, userId: user.id },
            });

            if (!conversation) {
                return NextResponse.json({ error: 'ไม่พบการสนทนา' }, { status: 404 });
            }


            existingMessages = await getRecentMessages(conversationId, 20);
        } else {
            conversation = await prisma.conversation.create({
                data: {
                    userId: user.id,
                    title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                },
            });
        }


        const history = existingMessages.map((msg) => ({
            role: msg.role === 'USER' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.content }],
        }));


        let userMessage: Awaited<ReturnType<typeof createMessage>> | undefined;
        if (!isRetry) {
            userMessage = await createMessage({
                conversationId: conversation.id,
                role: 'USER',
                content: content,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                attachments: attachments || [],
            });
        }


        let messageContent: string | Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = content;

        if (attachments && attachments.length > 0) {
            const fileRecords = await prisma.file.findMany({
                where: { id: { in: attachments }, userId: user.id },
            });

            if (fileRecords.length > 0) {
                const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
                let documentContents = '';

                for (const fileRecord of fileRecords) {
                    const filePath = path.join(process.cwd(), 'uploads', fileRecord.storagePath);
                    try {
                        const fileBuffer = await readFile(filePath);

                        if (fileRecord.type === 'IMAGE') {
                            const mimeType = fileRecord.mimeType || 'image/jpeg';
                            const base64Data = fileBuffer.toString('base64');
                            parts.push({ inlineData: { mimeType, data: base64Data } });
                        } else if (fileRecord.type === 'DOCUMENT') {
                            const fileContent = fileBuffer.toString('utf-8');
                            documentContents += `\n\n--- เอกสาร: ${fileRecord.filename} ---\n${fileContent}`;
                        }
                    } catch (err) {
                        console.error(`Failed to read file ${fileRecord.filename}:`, err);
                    }
                }

                if (parts.length > 0) {
                    const textContent = documentContents
                        ? `${documentContents}\n\n---\n\nคำถาม: ${content}`
                        : content;
                    parts.push({ text: textContent });
                    messageContent = parts;
                } else if (documentContents) {
                    messageContent = `${documentContents}\n\n---\n\nคำถาม: ${content}`;
                }
            }
        }


        const modelRecord = await prisma.aiModel.findFirst({
            where: { name: modelId, isActive: true },
            include: { provider: true },
        });


        const providerName = modelRecord?.provider?.name || 'gemini';
        const apiKey = await getAvailableApiKey(providerName);


        if (!apiKey) {
            return NextResponse.json({ error: 'ไม่มี API Key ที่พร้อมใช้งาน' }, { status: 503 });
        }

        let apiKeyValue = apiKey.apiKey;


        if (apiKeyValue && isEncrypted(apiKeyValue)) {
            apiKeyValue = decryptApiKey(apiKeyValue);
        }


        const encoder = new TextEncoder();
        let fullContent = '';
        let totalTokens = 0;
        let promptTokens = 0;
        let completionTokens = 0;


        const isOpenAI = providerName === 'openai';


        const settings = await prisma.systemSettings.findUnique({ where: { id: 'system' } });
        const memoryEnabled = settings?.enableLongTermMemory !== false;
        const ragEnabled = settings?.enableRAG === true;

        const memoryContext = memoryEnabled ? await getMemoriesForContext(user.id) : '';


        let ragContext = '';
        if (ragEnabled) {
            const similarChunks = await searchSimilarChunks(content, 3);
            if (similarChunks.length > 0) {
                ragContext = similarChunks.map(c => `[${c.docName}]: ${c.content}`).join('\n\n');
            }
        }


        let enhancedSystemInstruction = SYSTEM_INSTRUCTION;

        if (memoryContext) {
            enhancedSystemInstruction += `\n\n--- ความจำเกี่ยวกับผู้ใช้คนนี้ ---\n${memoryContext}`;
        }

        if (ragContext) {
            enhancedSystemInstruction += `\n\n--- ข้อมูลจากคลังความรู้ (Knowledge Base) ---\nใช้ข้อมูลต่อไปนี้ในการตอบคำถาม ถ้าเกี่ยวข้อง (ห้ามใส่ [cite:...] หรืออ้างอิงชื่อไฟล์ในคำตอบ):\n${ragContext}`;
        }


        const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = isOpenAI ? [
            { role: 'system', content: enhancedSystemInstruction },
            ...history.map(h => ({
                role: h.role === 'model' ? 'assistant' as const : 'user' as const,
                content: h.parts.map((p: { text?: string }) => p.text || '').join(''),
            })),
            { role: 'user' as const, content: typeof messageContent === 'string' ? messageContent : content },
        ] : [];

        const stream = new ReadableStream({
            async start(controller) {
                try {

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'start',
                        conversationId: conversation.id,
                        userMessageId: userMessage?._id?.toString(),
                    })}\n\n`));


                    interface Citation {
                        source: string;
                        content: string;
                        url?: string;
                        startIndex?: number;
                        endIndex?: number;
                    }
                    let citations: Citation[] = [];

                    if (isOpenAI) {

                        const openai = new OpenAI({ apiKey: apiKeyValue });
                        const openaiStream = await openai.chat.completions.create({
                            model: modelId,
                            messages: openaiMessages,
                            stream: true,
                            stream_options: { include_usage: true },
                        });

                        for await (const chunk of openaiStream) {
                            const text = chunk.choices[0]?.delta?.content || '';
                            if (text) {
                                fullContent += text;
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    type: 'chunk',
                                    content: text,
                                })}\n\n`));
                            }
                            if (chunk.usage) {
                                promptTokens = chunk.usage.prompt_tokens || 0;
                                completionTokens = chunk.usage.completion_tokens || 0;
                                totalTokens = promptTokens + completionTokens;
                            }
                        }
                    } else {

                        const genAI = new GoogleGenerativeAI(apiKeyValue);
                        const geminiModel = genAI.getGenerativeModel({
                            model: modelId,
                            systemInstruction: enhancedSystemInstruction,
                            tools: [{ googleSearch: {} }] as never,
                        });

                        const chat = geminiModel.startChat({ history });
                        const result = await chat.sendMessageStream(messageContent);

                        for await (const chunk of result.stream) {
                            const text = chunk.text();
                            fullContent += text;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'chunk',
                                content: text,
                            })}\n\n`));
                        }


                        const response = await result.response;
                        const usageMetadata = response.usageMetadata;
                        promptTokens = usageMetadata?.promptTokenCount || 0;
                        completionTokens = usageMetadata?.candidatesTokenCount || 0;
                        totalTokens = usageMetadata?.totalTokenCount || 0;


                        const candidates = response.candidates;
                        if (candidates && candidates[0]) {
                            const groundingMetadata = candidates[0].groundingMetadata;
                            if (groundingMetadata) {
                                const chunks = groundingMetadata.groundingChunks || [];
                                const supports = groundingMetadata.groundingSupports || [];


                                chunks.forEach((chunk: any, index: number) => {
                                    if (chunk.web) {

                                        const support = supports.find((s: any) =>
                                            s.groundingChunkIndices?.includes(index)
                                        );
                                        const seg = support?.segment as { startIndex?: number; endIndex?: number } | undefined;
                                        citations.push({
                                            source: chunk.web.title || `Source ${index + 1}`,
                                            content: '',
                                            url: chunk.web.uri,
                                            startIndex: seg?.startIndex,
                                            endIndex: seg?.endIndex,
                                        });
                                    }
                                });
                            }
                        }
                    }


                    if (attachments && attachments.length > 0) {
                        const fileRecords = await prisma.file.findMany({
                            where: { id: { in: attachments } },
                            select: { filename: true }
                        });
                        for (const fileRecord of fileRecords) {
                            if (fileRecord && fullContent.length > 0) {
                                citations.push({
                                    source: fileRecord.filename,
                                    content: '',
                                });
                            }
                        }
                    }


                    const assistantMessage = await createMessage({
                        conversationId: conversation.id,
                        role: 'ASSISTANT',
                        content: fullContent,
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        attachments: [],
                        citations: citations.length > 0 ? citations : undefined,
                    });


                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { updatedAt: new Date() },
                    });


                    const latencyMs = Date.now() - startTime;
                    await logEvent(user.id, 'CHAT_MESSAGE', '/api/chat', {
                        method: 'POST',
                        conversationId: conversation.id,
                    });

                    await logLLM(user.id, conversation.id, assistantMessage._id?.toString() || '', {
                        model: modelId,
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        latencyMs,
                        status: 'SUCCESS',
                    });


                    if (apiKey) {
                        await incrementApiKeyUsage(apiKey.id, totalTokens);
                    }


                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'done',
                        messageId: assistantMessage._id?.toString(),
                        tokens: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
                        citations: citations.length > 0 ? citations : undefined,
                    })}\n\n`));

                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);


                    let errorMessage = 'เกิดข้อผิดพลาดในการส่งข้อความ';
                    const errorStr = String(error);

                    if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('Too Many Requests')) {
                        errorMessage = '⚠️ ระบบแชทยังไม่พร้อมใช้งานชั่วคราว เนื่องจากมีผู้ใช้งานเป็นจำนวนมาก กรุณาลองใหม่ในอีกสักครู่';
                        await logError({
                            source: 'chat-api',
                            errorType: 'RATE_LIMIT',
                            message: 'API rate limit exceeded (429)',
                            details: errorStr,
                            apiKeyId: apiKey?.id,
                            modelId: modelId,
                        });
                    } else if (errorStr.includes('Controller is already closed')) {
                        return;
                    } else {
                        await logError({
                            source: 'chat-api',
                            errorType: 'STREAMING_ERROR',
                            message: error instanceof Error ? error.message : 'Streaming error',
                            details: errorStr,
                            userId: user?.id,
                            apiKeyId: apiKey?.id,
                            modelId: modelId,
                        });
                    }

                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'error',
                            error: errorMessage,
                        })}\n\n`));
                        controller.close();
                    } catch {

                    }
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Chat error:', error);
        await logError({
            source: 'chat-api',
            errorType: 'GENERAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: String(error),
        });
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการส่งข้อความ' }, { status: 500 });
    }
}
