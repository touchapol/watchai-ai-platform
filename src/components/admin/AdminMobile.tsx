'use client';

import Link from 'next/link';
import { NAV_ITEMS, TAB_TITLES, AdminTab, AdminUser } from './types';

interface MobileHeaderProps {
    activeTab: AdminTab;
    onMenuOpen: () => void;
}

interface MobileMenuDrawerProps {
    user: AdminUser | null;
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
    onClose: () => void;
}

interface MobileBottomNavProps {
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
}

export function MobileHeader({ activeTab, onMenuOpen }: MobileHeaderProps) {
    return (
        <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-[#0d0d0c] border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center justify-between px-4 py-3">
                <Link href="/chat" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg">
                    <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </Link>
                <h1 className="text-base font-semibold">{TAB_TITLES[activeTab]}</h1>
                <button
                    onClick={onMenuOpen}
                    className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg"
                >
                    <span className="material-symbols-outlined text-[22px]">menu</span>
                </button>
            </div>
        </header>
    );
}

export function MobileMenuDrawer({ user, activeTab, onTabChange, onClose }: MobileMenuDrawerProps) {
    return (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose}>
            <div
                className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-[#0d0d0c] animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                <DrawerHeader onClose={onClose} />
                {user && <UserProfile user={user} />}
                <DrawerNavigation activeTab={activeTab} onTabChange={onTabChange} />
            </div>
        </div>
    );
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d0d0c] border-t border-gray-200 dark:border-[#262626] z-40">
            <div className="flex overflow-x-auto py-2 px-2 gap-1 scrollbar-hide">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 flex-shrink-0 ${activeTab === item.id
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                        <span className="text-[10px] whitespace-nowrap">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

function DrawerHeader({ onClose }: { onClose: () => void }) {
    return (
        <div className="p-4 border-b border-gray-200 dark:border-[#262626] flex items-center justify-between">
            <span className="font-semibold text-red-500">Admin Panel</span>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg">
                <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>
    );
}

function UserProfile({ user }: { user: AdminUser }) {
    const initials = user.username?.slice(0, 2).toUpperCase() || 'AD';

    return (
        <div className="p-4 border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-medium text-sm">
                    {initials}
                </div>
                <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                        {user.username || 'Admin'}
                    </span>
                    <span className="text-xs text-red-500">Administrator</span>
                </div>
            </div>
        </div>
    );
}

function DrawerNavigation({ activeTab, onTabChange }: { activeTab: AdminTab; onTabChange: (tab: AdminTab) => void }) {
    return (
        <nav className="p-2 overflow-y-auto max-h-[calc(100vh-180px)]">
            {NAV_ITEMS.map((item) => (
                <div key={item.id}>
                    {item.hasDivider && <div className="border-t border-gray-200 dark:border-[#262626] my-2" />}
                    <button
                        onClick={() => onTabChange(item.id)}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left ${activeTab === item.id
                                ? 'bg-gray-100 dark:bg-[#1a1a19] text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        {item.label}
                    </button>
                </div>
            ))}
        </nav>
    );
}
