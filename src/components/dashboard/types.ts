export type Tab = 'overview' | 'usage' | 'events' | 'security' | 'profile' | 'memory' | 'settings';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    tokenQuota?: number;
    tokenUsed?: number;
}

export const TAB_LABELS: Record<Tab, string> = {
    overview: 'ภาพรวม',
    usage: 'บันทึกการใช้งาน',
    events: 'บันทึกกิจกรรม',
    security: 'บันทึกความปลอดภัย',
    profile: 'โปรไฟล์',
    memory: 'Memory',
    settings: 'การตั้งค่า',
};

export const VALID_TABS = ['overview', 'usage', 'events', 'security', 'profile', 'memory', 'settings'] as const;

export const NAV_ITEMS = [
    { id: 'overview', icon: 'schedule', label: 'ภาพรวม', type: 'button' },
    { id: 'profile', icon: 'person', label: 'โปรไฟล์', type: 'button' },
    { id: 'memory', icon: 'psychology', label: 'Memory', type: 'button' },
    { id: 'usage', icon: 'bar_chart', label: 'บันทึกการใช้งาน', type: 'button' },
    { id: 'events', icon: 'article', label: 'บันทึกกิจกรรม', type: 'button' },
    { id: 'security', icon: 'shield', label: 'บันทึกความปลอดภัย', type: 'button' },
    { id: 'settings', icon: 'settings', label: 'การตั้งค่า', type: 'button' },
    { divider: true },
    { id: 'logout', icon: 'logout', label: 'ออกจากระบบ', type: 'logout' },
] as const;

export const MOBILE_NAV_ITEMS = [
    { id: 'overview', icon: 'schedule', label: 'ภาพรวม' },
    { id: 'profile', icon: 'person', label: 'โปรไฟล์' },
    { id: 'memory', icon: 'psychology', label: 'Memory' },
    { id: 'usage', icon: 'bar_chart', label: 'ใช้งาน' },
    { id: 'events', icon: 'article', label: 'กิจกรรม' },
    { id: 'security', icon: 'shield', label: 'ปลอดภัย' },
    { id: 'settings', icon: 'settings', label: 'ตั้งค่า' },
];

export const TAB_ACTION_MAP: Record<Tab, string> = {
    overview: 'VIEW_OVERVIEW',
    usage: 'VIEW_USAGE_LOG',
    events: 'VIEW_EVENT_LOG',
    security: 'VIEW_SECURITY_LOG',
    profile: 'VIEW_PROFILE',
    memory: 'VIEW_MEMORY',
    settings: 'VIEW_SETTINGS',
};
