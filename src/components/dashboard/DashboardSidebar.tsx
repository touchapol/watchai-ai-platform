'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Tab, NAV_ITEMS } from './types';

interface DashboardSidebarProps {
    user: User | null;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export function DashboardSidebar({ user, activeTab, onTabChange }: DashboardSidebarProps) {
    const router = useRouter();

    const getButtonClass = (id: string) => {
        const isActive = activeTab === id;
        return `flex items-center gap-3 px-2 py-2 rounded transition-colors w-full text-left ${isActive
            ? 'bg-gray-100 dark:bg-[#1a1a19] text-gray-900 dark:text-white font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`;
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col ml-7 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/chat" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    ย้อนกลับ
                </Link>
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#272726]" />
            </div>

            <div className="mb-6">
                {user ? (
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center text-gray-700 dark:text-white font-medium text-sm">
                            {user.username?.slice(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                                {user.username || 'User'}
                            </span>
                            <span className="text-xs text-gray-500">{user.email || 'Unknown'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mb-1 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
                        <div className="space-y-2">
                            <div className="h-3 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                            <div className="h-2 w-28 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                        </div>
                    </div>
                )}
            </div>

            <nav className="space-y-0.5 text-[13px]">
                {NAV_ITEMS.map((item, i) => {
                    if ('divider' in item) {
                        return <div key={i} className="border-t border-gray-200 dark:border-[#272726] my-3" />;
                    }
                    if (item.type === 'button') {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id as Tab)}
                                className={getButtonClass(item.id)}
                            >
                                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    }
                    if (item.type === 'logout') {
                        return (
                            <button
                                key={item.id}
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    }
                    return null;
                })}
            </nav>
        </aside>
    );
}
