import { getMongoDb } from './mongodb';
import { ObjectId } from 'mongodb';

export type MemoryType = 'fact' | 'preference' | 'instruction' | 'context';

export interface Memory {
    _id?: ObjectId;
    userId: string;
    type: MemoryType;
    content: string;
    source: 'extracted' | 'manual';
    conversationId?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

const COLLECTION_NAME = 'memories';

export async function createMemory(
    memory: Omit<Memory, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Memory> {
    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);

    const now = new Date();
    const doc: Memory = {
        ...memory,
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
}

export async function getUserMemories(
    userId: string,
    options?: { type?: MemoryType; limit?: number; activeOnly?: boolean }
): Promise<Memory[]> {
    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);

    const query: Record<string, unknown> = { userId };
    if (options?.type) query.type = options.type;
    if (options?.activeOnly !== false) query.isActive = true;

    return collection
        .find(query)
        .sort({ updatedAt: -1 })
        .limit(options?.limit || 50)
        .toArray();
}

export async function getMemoriesForContext(userId: string, limit = 20): Promise<string> {
    const memories = await getUserMemories(userId, { limit, activeOnly: true });

    if (memories.length === 0) return '';

    const grouped = {
        fact: [] as string[],
        preference: [] as string[],
        instruction: [] as string[],
        context: [] as string[],
    };

    memories.forEach((m) => {
        grouped[m.type].push(m.content);
    });

    const sections: string[] = [];

    if (grouped.fact.length > 0) {
        sections.push(`ข้อมูลเกี่ยวกับผู้ใช้:\n${grouped.fact.map((f) => `- ${f}`).join('\n')}`);
    }
    if (grouped.preference.length > 0) {
        sections.push(`ความชอบ/สไตล์:\n${grouped.preference.map((p) => `- ${p}`).join('\n')}`);
    }
    if (grouped.instruction.length > 0) {
        sections.push(`คำสั่งพิเศษ:\n${grouped.instruction.map((i) => `- ${i}`).join('\n')}`);
    }
    if (grouped.context.length > 0) {
        sections.push(`บริบทที่เกี่ยวข้อง:\n${grouped.context.map((c) => `- ${c}`).join('\n')}`);
    }

    return sections.join('\n\n');
}

export async function updateMemory(
    memoryId: string,
    updates: Partial<Pick<Memory, 'content' | 'type' | 'isActive'>>
): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);

    const result = await collection.updateOne(
        { _id: new ObjectId(memoryId) },
        { $set: { ...updates, updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
}

export async function deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);

    const result = await collection.deleteOne({
        _id: new ObjectId(memoryId),
        userId,
    });

    return result.deletedCount > 0;
}

export async function deleteUserMemories(userId: string): Promise<number> {
    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);

    const result = await collection.deleteMany({ userId });
    return result.deletedCount;
}

const MEMORY_EXTRACTION_PROMPT = `คุณเป็น Memory Extraction Agent
หน้าที่: วิเคราะห์การสนทนาและสกัดข้อมูลสำคัญที่ควรจดจำเกี่ยวกับผู้ใช้

ข้อมูลที่ควรสกัด:
1. **fact** - ข้อเท็จจริงเกี่ยวกับผู้ใช้ (ชื่อ, อาชีพ, ที่ทำงาน, ทักษะ, โปรเจค)
2. **preference** - ความชอบ, สไตล์การทำงาน, ภาษาที่ใช้, framework ที่ชอบ
3. **instruction** - คำสั่งที่ผู้ใช้บอกให้จำไว้เสมอ
4. **context** - บริบทสำคัญที่อาจใช้ในอนาคต

ตอบเป็น JSON array เท่านั้น:
[{"type": "fact|preference|instruction|context", "content": "ข้อมูลที่สกัด"}]

ถ้าไม่มีข้อมูลสำคัญ ตอบ: []`;

export interface ExtractedMemory {
    type: MemoryType;
    content: string;
}

export function getMemoryExtractionPrompt(): string {
    return MEMORY_EXTRACTION_PROMPT;
}

export async function saveExtractedMemories(
    userId: string,
    conversationId: string,
    memories: ExtractedMemory[]
): Promise<number> {
    if (memories.length === 0) return 0;

    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);

    const now = new Date();
    const docs: Memory[] = memories.map((m) => ({
        userId,
        type: m.type,
        content: m.content,
        source: 'extracted' as const,
        conversationId,
        createdAt: now,
        updatedAt: now,
        isActive: true,
    }));

    const result = await collection.insertMany(docs);
    return result.insertedCount;
}

export async function getMemoryCount(userId: string): Promise<number> {
    const db = await getMongoDb();
    const collection = db.collection<Memory>(COLLECTION_NAME);
    return collection.countDocuments({ userId, isActive: true });
}
