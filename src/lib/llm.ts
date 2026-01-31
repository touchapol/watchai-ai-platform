import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const DEFAULT_MODEL = 'gemini-2.0-flash-001';
const DEFAULT_SYSTEM_PROMPT = 'คุณเป็น AI ผู้ช่วยที่เป็นมิตรและช่วยเหลือ ตอบเป็นภาษาไทยเมื่อผู้ใช้ถามเป็นภาษาไทย';
const FILE_SYSTEM_PROMPT = `${DEFAULT_SYSTEM_PROMPT}\nเมื่อตอบจากเอกสาร ให้อ้างอิงแหล่งที่มาด้วย`;

export interface LLMMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface LLMResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface Citation {
    source: string;
    content: string;
    page?: number;
}

function extractUsage(usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }) {
    return {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        completionTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0,
    };
}

export async function sendMessage(
    content: string,
    history: LLMMessage[] = [],
    systemPrompt?: string
): Promise<LLMResponse> {
    const model = genAI.getGenerativeModel({
        model: DEFAULT_MODEL,
        systemInstruction: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(content);
    const response = result.response;

    return {
        content: response.text(),
        usage: extractUsage(response.usageMetadata),
    };
}

export async function sendMessageWithFile(
    content: string,
    fileContent: string,
    fileName: string,
    history: LLMMessage[] = []
): Promise<LLMResponse> {
    const model = genAI.getGenerativeModel({
        model: DEFAULT_MODEL,
        systemInstruction: FILE_SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history });
    const messageWithContext = `เอกสาร: ${fileName}\n---\n${fileContent}\n---\n\nคำถาม: ${content}`;
    const result = await chat.sendMessage(messageWithContext);
    const response = result.response;

    return {
        content: response.text(),
        usage: extractUsage(response.usageMetadata),
    };
}

export async function analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string
): Promise<LLMResponse> {
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const result = await model.generateContent([
        { inlineData: { data: imageBase64, mimeType } },
        prompt || 'อธิบายรูปภาพนี้',
    ]);
    const response = result.response;

    return {
        content: response.text(),
        usage: extractUsage(response.usageMetadata),
    };
}

export function extractCitations(content: string, sources: string[]): Citation[] {
    return sources
        .filter(source => content.toLowerCase().includes(source.toLowerCase()))
        .map(source => ({
            source,
            content: content.substring(0, 100) + '...',
        }));
}
