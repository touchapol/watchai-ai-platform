export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'Admin' | 'Engineer' | 'User';
}

export interface FileItem {
    id: string;
    name: string;
    type: 'PDF' | 'IMG' | 'TXT' | 'DOC' | 'CSV' | 'ZIP';
    size: string;
    date: string;
    color: string;
    icon: string;
    bgImage?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    citations?: string[];
}
