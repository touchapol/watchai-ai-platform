export interface User {
    id: string;
    username: string;
    email: string;
}

export interface OverviewData {
    stats: {
        totalChats: number;
        totalMessages: number;
        todayMessages: number;
        weekMessages: number;
        totalFiles: number;
    };
    dailyUsage: DailyUsage[];
    topModels: ModelUsage[];
    recentChats: RecentChat[];
    recentFiles: RecentFile[];
}

export interface DailyUsage {
    date: string;
    count: number;
}

export interface ModelUsage {
    model: string;
    count: number;
}

export interface RecentChat {
    id: string;
    title: string;
    messageCount: number;
    updatedAt: string;
}

export interface RecentFile {
    id: string;
    name: string;
    createdAt: string;
}

export interface UsageData {
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        messageCount: number;
    };
    dailyTokens: DailyTokenUsage[];
    modelBreakdown: ModelTokenUsage[];
}

export interface DailyTokenUsage {
    date: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface ModelTokenUsage {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    count: number;
}
