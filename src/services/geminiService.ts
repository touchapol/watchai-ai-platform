import { GoogleGenerativeAI, GenerateContentResponse, GenerateContentResult } from '@google/generative-ai';
import {
    getAvailableApiKey,
    incrementApiKeyUsage,
    markApiKeyRateLimited,
    decryptKey,
    GeminiMessageContent,
    Citation,
} from './llmService';

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onUsage: (promptTokens: number, completionTokens: number, totalTokens: number) => void;
    onCitations: (citations: Citation[]) => void;
    onError: (error: Error) => void;
}

export interface StreamResult {
    success: boolean;
    keyId?: string;
    fullContent: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    citations: Citation[];
}

export async function streamCompletion(
    modelId: string,
    systemInstruction: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    messageContent: GeminiMessageContent,
    callbacks: StreamCallbacks
): Promise<StreamResult> {
    const keyRecord = await getAvailableApiKey('gemini');
    if (!keyRecord) {
        callbacks.onError(new Error('No API key available'));
        return { success: false, fullContent: '', promptTokens: 0, completionTokens: 0, totalTokens: 0, citations: [] };
    }

    const apiKey = decryptKey(keyRecord.apiKey);
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    const citations: Citation[] = [];

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction,
            tools: [{ googleSearch: {} }] as never,
        });

        const chat = geminiModel.startChat({ history });
        const result: GenerateContentResult = await chat.sendMessageStream(messageContent);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullContent += text;
            callbacks.onChunk(text);
        }

        const response: GenerateContentResponse = await result.response;
        const usageMetadata = response.usageMetadata;
        promptTokens = usageMetadata?.promptTokenCount || 0;
        completionTokens = usageMetadata?.candidatesTokenCount || 0;
        totalTokens = usageMetadata?.totalTokenCount || 0;
        callbacks.onUsage(promptTokens, completionTokens, totalTokens);

        const candidates = response.candidates;
        if (candidates && candidates[0]) {
            const groundingMetadata = candidates[0].groundingMetadata;
            if (groundingMetadata) {
                const chunks = groundingMetadata.groundingChunks || [];
                const supports = groundingMetadata.groundingSupports || [];

                chunks.forEach((chunk: unknown, index: number) => {
                    const c = chunk as { web?: { title?: string; uri?: string } };
                    if (c.web) {
                        const support = supports.find((s: unknown) => {
                            const sup = s as { groundingChunkIndices?: number[] };
                            return sup.groundingChunkIndices?.includes(index);
                        });
                        const seg = (support as { segment?: { startIndex?: number; endIndex?: number } } | undefined)?.segment;
                        citations.push({
                            source: c.web.title || `Source ${index + 1}`,
                            content: '',
                            url: c.web.uri,
                            startIndex: seg?.startIndex,
                            endIndex: seg?.endIndex,
                        });
                    }
                });

                if (citations.length > 0) {
                    callbacks.onCitations(citations);
                }
            }
        }

        await incrementApiKeyUsage(keyRecord.id, totalTokens);

        return {
            success: true,
            keyId: keyRecord.id,
            fullContent,
            promptTokens,
            completionTokens,
            totalTokens,
            citations,
        };
    } catch (error) {
        callbacks.onError(error as Error);

        const errorStr = String(error);
        if (errorStr.includes('429') || errorStr.includes('quota')) {
            await markApiKeyRateLimited(keyRecord.id);
        }

        return {
            success: false,
            keyId: keyRecord.id,
            fullContent,
            promptTokens,
            completionTokens,
            totalTokens,
            citations,
        };
    }
}

export async function generateResponse(
    prompt: string,
    model: string = 'gemini-2.5-flash-preview'
): Promise<string> {
    const keyRecord = await getAvailableApiKey('gemini');
    if (!keyRecord) {
        return 'Error: No Gemini API key available';
    }

    const apiKey = decryptKey(keyRecord.apiKey);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model });
        const response = await geminiModel.generateContent(prompt);
        const result = response.response;

        await incrementApiKeyUsage(keyRecord.id, result.usageMetadata?.totalTokenCount || 0);
        return result.text() || 'No response generated.';
    } catch (error) {
        console.error('Gemini API Error:', error);
        return `Error: ${(error as Error).message}`;
    }
}
