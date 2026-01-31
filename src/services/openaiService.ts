import OpenAI from 'openai';
import {
    getAvailableApiKey,
    incrementApiKeyUsage,
    markApiKeyRateLimited,
    decryptKey,
    OpenAIMessage,
} from './llmService';

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onUsage: (promptTokens: number, completionTokens: number) => void;
    onError: (error: Error) => void;
}

export interface StreamResult {
    success: boolean;
    keyId?: string;
    fullContent: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export async function streamCompletion(
    messages: OpenAIMessage[],
    modelId: string,
    callbacks: StreamCallbacks
): Promise<StreamResult> {
    const keyRecord = await getAvailableApiKey('openai');
    if (!keyRecord) {
        callbacks.onError(new Error('No API key available'));
        return { success: false, fullContent: '', promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    const apiKey = decryptKey(keyRecord.apiKey);
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    try {
        const openai = new OpenAI({ apiKey });
        const stream = await openai.chat.completions.create({
            model: modelId,
            messages: messages as never[],
            stream: true,
            stream_options: { include_usage: true },
        });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
                fullContent += text;
                callbacks.onChunk(text);
            }
            if (chunk.usage) {
                promptTokens = chunk.usage.prompt_tokens || 0;
                completionTokens = chunk.usage.completion_tokens || 0;
            }
        }

        await incrementApiKeyUsage(keyRecord.id, promptTokens + completionTokens);

        return {
            success: true,
            keyId: keyRecord.id,
            fullContent,
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
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
            totalTokens: promptTokens + completionTokens,
        };
    }
}

export async function generateResponse(
    prompt: string,
    model: string = 'gpt-4o-mini'
): Promise<string> {
    const keyRecord = await getAvailableApiKey('openai');
    if (!keyRecord) {
        return 'Error: No OpenAI API key available';
    }

    const apiKey = decryptKey(keyRecord.apiKey);

    try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }],
        });

        await incrementApiKeyUsage(keyRecord.id, response.usage?.total_tokens || 0);
        return response.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return `Error: ${(error as Error).message}`;
    }
}
