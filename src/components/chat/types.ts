export interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    createdAt: string;
    isStreaming?: boolean;
    isError?: boolean;
    attachments?: string[];
    attachmentDetails?: { id: string; filename: string; mimeType: string; size: number }[];
    citations?: { source: string; content: string; url?: string; startIndex?: number; endIndex?: number }[];
}

export interface UserFile {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    type: string;
    storagePath?: string;
}

export interface UploadingFile {
    tempId: string;
    filename: string;
    localUrl: string;
    mimeType: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    file?: UserFile;
    errorMessage?: string;
}

export interface Model {
    id: string;
    name: string;
    description: string;
}

export interface Folder {
    name: string;
    path: string;
}

export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
