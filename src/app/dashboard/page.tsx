'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OverviewData } from '@/types/dashboard';
import {
    Tab,
    User,
    TAB_LABELS,
    VALID_TABS,
    TAB_ACTION_MAP,
    UsageTab,
    SettingsTab,
    ProfileTab,
    MemoryTab,
    EventLogTab,
    SecurityLogTab,
    DashboardSidebar,
    DashboardOverviewTab,
    MobileHeader,
    MobileMenuOverlay,
    MobileBottomNav,
} from '@/components/dashboard';

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const tab = searchParams.get('tab');
        if (tab && VALID_TABS.includes(tab as Tab)) {
            return tab as Tab;
        }
        return 'overview';
    });
    const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartDays, setChartDays] = useState<7 | 14 | 30>(7);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && VALID_TABS.includes(tab as Tab)) {
            setActiveTab(tab as Tab);
        }
    }, [searchParams]);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then(res => res.json()),
            fetch('/api/overview').then(res => res.json())
        ]).then(([authData, overview]) => {
            if (authData.user) setUser(authData.user);
            setOverviewData(overview);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch('/api/logs/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: TAB_ACTION_MAP[activeTab], resource: `/dashboard/${activeTab}` })
        }).catch(() => { });
    }, [activeTab]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <DashboardOverviewTab
                        data={overviewData}
                        loading={loading}
                        chartDays={chartDays}
                        onChartDaysChange={setChartDays}
                    />
                );
            case 'usage':
                return (
                    <>
                        <h1 className="hidden md:block text-xl font-semibold text-gray-900 dark:text-white mb-6">Usage Log</h1>
                        <UsageTab />
                    </>
                );
            case 'events':
                return (
                    <>
                        <h1 className="hidden md:block text-xl font-semibold text-gray-900 dark:text-white mb-6">Event Log</h1>
                        <EventLogTab />
                    </>
                );
            case 'security':
                return (
                    <>
                        <h1 className="hidden md:block text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Log</h1>
                        <SecurityLogTab />
                    </>
                );
            case 'profile':
                return (
                    <>
                        <h1 className="hidden md:block text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile</h1>
                        <ProfileTab />
                    </>
                );
            case 'memory':
                return (
                    <>
                        <h1 className="hidden md:block text-xl font-semibold text-gray-900 dark:text-white mb-6">Memory</h1>
                        <MemoryTab />
                    </>
                );
            case 'settings':
                return (
                    <>
                        <h1 className="hidden md:block text-xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>
                        <SettingsTab />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-[#0d0d0c] text-gray-900 dark:text-gray-200 min-h-screen flex flex-col font-sans antialiased">
            <MobileHeader
                activeTabLabel={TAB_LABELS[activeTab]}
                onOpenMenu={() => setMobileMenuOpen(true)}
            />

            <MobileMenuOverlay
                isOpen={mobileMenuOpen}
                user={user}
                activeTab={activeTab}
                onClose={() => setMobileMenuOpen(false)}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
            />

            <div className="flex flex-1 justify-center px-4 md:px-0">
                <div className="flex flex-col md:flex-row w-full max-w-6xl gap-6 md:items-start md:pt-[15vh]">
                    <DashboardSidebar
                        user={user}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                    <main className="flex-1 overflow-y-auto pb-24 md:pb-7 md:px-6 md:self-start flex-shrink-0 flex flex-col">
                        <div className="w-full">
                            {renderTabContent()}
                        </div>
                    </main>
                </div>
            </div>

            <MobileBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="bg-white dark:bg-[#0d0d0c] min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
