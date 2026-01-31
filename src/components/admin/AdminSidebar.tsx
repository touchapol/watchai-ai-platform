'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { AdminUser, AdminTab, NavItem, NAV_ITEMS } from './types';

interface SidebarProps {
    user: AdminUser | null;
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
}

export function AdminSidebar({ user, activeTab, onTabChange }: SidebarProps) {
    const getButtonClass = useCallback((id: string) => {
        const isActive = activeTab === id;
        const baseClass = 'flex items-center gap-3 px-2 py-2 rounded transition-colors w-full text-left';
        const activeClass = 'bg-gray-100 dark:bg-[#1a1a19] text-gray-900 dark:text-white font-medium';
        const inactiveClass = 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
        return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
    }, [activeTab]);

    return (
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col ml-7 sticky top-6">
            <BackButton />
            <UserProfile user={user} />
            <Navigation items={NAV_ITEMS} onTabChange={onTabChange} getButtonClass={getButtonClass} />
        </aside>
    );
}

function BackButton() {
    return (
        <div className="flex items-center gap-2 mb-6">
            <Link
                href="/chat"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                ย้อนกลับ
            </Link>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#272726]" />
        </div>
    );
}

function UserProfile({ user }: { user: AdminUser | null }) {
    if (!user) {
        return <UserProfileSkeleton />;
    }

    const initials = user.username?.slice(0, 2).toUpperCase() || 'AD';

    return (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-medium text-sm">
                    {initials}
                </div>
                <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                        {user.username || 'Admin'}
                    </span>
                    <span className="text-xs text-red-500 dark:text-red-400">Administrator</span>
                </div>
            </div>
        </div>
    );
}

function UserProfileSkeleton() {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-1 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                    <div className="h-2 w-16 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                </div>
            </div>
        </div>
    );
}

interface NavigationProps {
    items: NavItem[];
    onTabChange: (tab: AdminTab) => void;
    getButtonClass: (id: string) => string;
}

function Navigation({ items, onTabChange, getButtonClass }: NavigationProps) {
    return (
        <nav className="space-y-0.5 text-[13px]">
            {items.map((item) => (
                <div key={item.id}>
                    {item.hasDivider && (
                        <div className="h-px bg-gray-200 dark:bg-[#272726] my-3" />
                    )}
                    <button
                        onClick={() => onTabChange(item.id)}
                        className={getButtonClass(item.id)}
                    >
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        {item.label}
                    </button>
                </div>
            ))}
        </nav>
    );
}
