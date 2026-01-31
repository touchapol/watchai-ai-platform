'use client';

import Link from 'next/link';
import { User, Tab, NAV_ITEMS, MOBILE_NAV_ITEMS } from './types';

interface MobileHeaderProps {
    activeTabLabel: string;
    onOpenMenu: () => void;
}

export function MobileHeader({ activeTabLabel, onOpenMenu }: MobileHeaderProps) {
    return (
        <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-[#0d0d0c] border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center justify-between px-4 py-3">
                <Link href="/chat" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg">
                    <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </Link>
                <h1 className="text-base font-semibold">{activeTabLabel}</h1>
                <button
                    onClick={onOpenMenu}
                    className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg"
                >
                    <span className="material-symbols-outlined text-[22px]">menu</span>
                </button>
            </div>
        </header>
    );
}

interface MobileMenuOverlayProps {
    isOpen: boolean;
    user: User | null;
    activeTab: Tab;
    onClose: () => void;
    onTabChange: (tab: Tab) => void;
    onLogout: () => void;
}

export function MobileMenuOverlay({ isOpen, user, activeTab, onClose, onTabChange, onLogout }: MobileMenuOverlayProps) {
    if (!isOpen) return null;

    return (
        <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-[#0d0d0c] animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 dark:border-[#262626] flex items-center justify-between">
                    <span className="font-semibold">เมนู</span>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {user && (
                    <div className="p-4 border-b border-gray-200 dark:border-[#262626]">
                        <div className="flex items-center gap-3">
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
                    </div>
                )}

                <nav className="p-2">
                    {NAV_ITEMS.filter(item => !('divider' in item) && item.type !== 'logout').map((item) => {
                        if ('divider' in item) return null;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id as Tab);
                                    onClose();
                                }}
                                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left ${activeTab === item.id
                                    ? 'bg-gray-100 dark:bg-[#1a1a19] text-gray-900 dark:text-white font-medium'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                    <div className="border-t border-gray-200 dark:border-[#262626] my-2" />
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        ออกจากระบบ
                    </button>
                </nav>
            </div>
        </div>
    );
}

interface MobileBottomNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d0d0c] border-t border-gray-200 dark:border-[#262626] z-40">
            <div className="flex justify-around py-2">
                {MOBILE_NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id as Tab)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${activeTab === item.id
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-500'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-[22px] ${activeTab === item.id ? 'font-bold' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-[10px]">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
