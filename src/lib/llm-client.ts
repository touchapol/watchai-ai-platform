import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION } from './constants';

export interface LLMMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface LLMStreamResult {
    stream: AsyncIterable<string>;
    getTokenCount: () => Promise<{ input: number; output: number }>;
}

export interface LLMClient {
    streamChat(messages: LLMMessage[], model: string): Promise<LLMStreamResult>;
}

export class GeminiClient implements LLMClient {
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    async streamChat(messages: LLMMessage[], model: string): Promise<LLMStreamResult> {
        const geminiModel = this.client.getGenerativeModel({
            model,
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        const history = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: msg.content }],
        }));

        const lastMessage = messages[messages.length - 1];
        const chat = geminiModel.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage.content);

        let inputTokens = 0;
        let outputTokens = 0;

        const stream = (async function* () {
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) yield text;

                if (chunk.usageMetadata) {
                    inputTokens = chunk.usageMetadata.promptTokenCount || 0;
                    outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
                }
            }
        })();

        return {
            stream,
            getTokenCount: async () => ({ input: inputTokens, output: outputTokens }),
        };
    }
}

export class OpenAIClient implements LLMClient {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
    }

    async streamChat(messages: LLMMessage[], model: string): Promise<LLMStreamResult> {
        const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            ...messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
        ];

        const stream = await this.client.chat.completions.create({
            model,
            messages: openaiMessages,
            stream: true,
            stream_options: { include_usage: true },
        });

        let inputTokens = 0;
        let outputTokens = 0;

        const textStream = (async function* () {
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) yield content;

                if (chunk.usage) {
                    inputTokens = chunk.usage.prompt_tokens || 0;
                    outputTokens = chunk.usage.completion_tokens || 0;
                }
            }
        })();

        return {
            stream: textStream,
            getTokenCount: async () => ({ input: inputTokens, output: outputTokens }),
        };
    }
}

export function createLLMClient(provider: string, apiKey: string): LLMClient {
    switch (provider) {
        case 'gemini':
            return new GeminiClient(apiKey);
        case 'openai':
            return new OpenAIClient(apiKey);
        default:
            return new GeminiClient(apiKey);
    }
}
