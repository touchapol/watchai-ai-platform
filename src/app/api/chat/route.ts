import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logEvent, logLLM } from '@/lib/logger';
import { logError } from '@/lib/errorLogger';
import { SYSTEM_INSTRUCTION } from '@/lib/constants';
import { createMessage, getRecentMessages, ChatMessage } from '@/lib/messages';
import { getMemoriesForContext } from '@/lib/memory';
import { searchSimilarChunks } from '@/lib/embedding';
import {
    getAvailableApiKey,
    incrementApiKeyUsage,
    decryptKey,
    processAttachments,
    convertToOpenAIContent,
    buildOpenAIMessages,
    Citation,
    GeminiMessageContent,
} from '@/services/llmService';
import * as openaiService from '@/services/openaiService';
import * as geminiService from '@/services/geminiService';

export async function GET() {
    try {
        const models = await prisma.aiModel.findMany({
            where: {
                isActive: true,
                provider: { isActive: true }
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
            models: models.map((m: typeof models[number]) => ({
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

        let geminiContent: GeminiMessageContent = content;
        let fileNames: string[] = [];

        if (attachments && attachments.length > 0) {
            const processed = await processAttachments(attachments, user.id);
            if (typeof processed.geminiContent !== 'string' && Array.isArray(processed.geminiContent)) {
                const textContent = processed.files
                    .filter(f => f.type === 'DOCUMENT')
                    .map(f => `\n\n--- เอกสาร: ${f.filename} ---\n${f.data}`)
                    .join('');
                const finalText = textContent ? `${textContent}\n\n---\n\nคำถาม: ${content}` : content;
                geminiContent = [...processed.geminiContent, { text: finalText }];
            } else if (typeof processed.geminiContent === 'string' && processed.geminiContent) {
                geminiContent = `${processed.geminiContent}\n\n---\n\nคำถาม: ${content}`;
            }
            fileNames = processed.files.map(f => f.filename);
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

        const encoder = new TextEncoder();
        let fullContent = '';
        let promptTokens = 0;
        let completionTokens = 0;
        let totalTokens = 0;
        let citations: Citation[] = [];

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'start',
                        conversationId: conversation.id,
                        userMessageId: userMessage?._id?.toString(),
                    })}\n\n`));

                    const streamCallbacks = {
                        onChunk: (text: string) => {
                            fullContent += text;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'chunk',
                                content: text,
                            })}\n\n`));
                        },
                        onError: (error: Error) => {
                            console.error('Stream error:', error);
                        },
                    };

                    if (isOpenAI) {
                        const openaiContent = convertToOpenAIContent(geminiContent, content);
                        const messages = buildOpenAIMessages(enhancedSystemInstruction, history, openaiContent);

                        const result = await openaiService.streamCompletion(messages, modelId, {
                            ...streamCallbacks,
                            onUsage: (pt, ct) => {
                                promptTokens = pt;
                                completionTokens = ct;
                                totalTokens = pt + ct;
                            },
                        });

                        fullContent = result.fullContent;
                        promptTokens = result.promptTokens;
                        completionTokens = result.completionTokens;
                        totalTokens = result.totalTokens;
                    } else {
                        const result = await geminiService.streamCompletion(
                            modelId,
                            enhancedSystemInstruction,
                            history,
                            geminiContent,
                            {
                                ...streamCallbacks,
                                onUsage: (pt, ct, tt) => {
                                    promptTokens = pt;
                                    completionTokens = ct;
                                    totalTokens = tt;
                                },
                                onCitations: (c) => {
                                    citations = c;
                                },
                            }
                        );

                        fullContent = result.fullContent;
                        promptTokens = result.promptTokens;
                        completionTokens = result.completionTokens;
                        totalTokens = result.totalTokens;
                        citations = result.citations;
                    }

                    if (fileNames.length > 0 && fullContent.length > 0) {
                        for (const filename of fileNames) {
                            citations.push({ source: filename, content: '' });
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
