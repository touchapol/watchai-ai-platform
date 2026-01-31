import { getMongoDb } from './mongodb';
import { ObjectId } from 'mongodb';

export interface ChatMessage {
    _id?: ObjectId;
    conversationId: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    attachments: string[];
    citations?: object[];
    createdAt: Date;
}

export async function createMessage(message: Omit<ChatMessage, '_id' | 'createdAt'>): Promise<ChatMessage> {
    const db = await getMongoDb();
    const collection = db.collection<ChatMessage>('messages');

    const doc: ChatMessage = {
        ...message,
        createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
}

export async function getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]> {
    const db = await getMongoDb();
    const collection = db.collection<ChatMessage>('messages');

    return collection
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .toArray();
}

export async function getRecentMessages(conversationId: string, limit: number = 20): Promise<ChatMessage[]> {
    const db = await getMongoDb();
    const collection = db.collection<ChatMessage>('messages');

    return collection
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
        .then(msgs => msgs.reverse());
}

export async function deleteMessagesByConversationId(conversationId: string): Promise<number> {
    const db = await getMongoDb();
    const collection = db.collection<ChatMessage>('messages');

    const result = await collection.deleteMany({ conversationId });
    return result.deletedCount;
}

export async function getMessageCount(conversationId: string): Promise<number> {
    const db = await getMongoDb();
    const collection = db.collection<ChatMessage>('messages');

    return collection.countDocuments({ conversationId });
}
