export type AdminTab = 'overview' | 'users' | 'usage' | 'events' | 'security' | 'auth' | 'aisettings' | 'providers' | 'knowledgebase' | 'errorlogs';

export interface AdminUser {
    id: string;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
}

export interface NavItem {
    id: AdminTab;
    icon: string;
    label: string;
    hasDivider?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
    { id: 'overview', icon: 'dashboard', label: 'ภาพรวม' },
    { id: 'users', icon: 'group', label: 'จัดการผู้ใช้' },
    { id: 'usage', icon: 'bar_chart', label: 'บันทึกการใช้งาน' },
    { id: 'events', icon: 'article', label: 'บันทึกกิจกรรม' },
    { id: 'security', icon: 'shield', label: 'บันทึกความปลอดภัย' },
    { id: 'auth', icon: 'lock', label: 'การตั้งค่า' },
    { id: 'providers', icon: 'hub', label: 'AI Providers', hasDivider: true },
    { id: 'aisettings', icon: 'psychology', label: 'AI Settings' },
    { id: 'knowledgebase', icon: 'school', label: 'Knowledge Base' },
    { id: 'errorlogs', icon: 'error', label: 'Error Logs' },
];

export const TAB_TITLES: Record<AdminTab, string> = {
    overview: 'ภาพรวมระบบ',
    users: 'จัดการผู้ใช้',
    providers: 'AI Providers',
    usage: 'บันทึกการใช้งาน',
    events: 'บันทึกกิจกรรม',
    knowledgebase: 'Knowledge Base',
    errorlogs: 'Error Logs',
    security: 'บันทึกความปลอดภัย',
    auth: 'การตั้งค่า',
    aisettings: 'AI Settings',
};

export const VALID_TABS: AdminTab[] = ['overview', 'users', 'providers', 'usage', 'events', 'knowledgebase', 'errorlogs', 'security', 'auth', 'aisettings'];

export function isValidTab(tab: string | null): tab is AdminTab {
    return tab !== null && VALID_TABS.includes(tab as AdminTab);
}
