'use client';

import { useState, Suspense } from 'react';
import {
    AdminSidebar,
    AdminMainContent,
    AdminLoadingScreen,
    MobileHeader,
    MobileMenuDrawer,
    MobileBottomNav,
    AdminPageLayout,
    AdminContentArea,
    useAdminAuth,
    useTabState,
} from '@/components/admin';

function AdminContent() {
    const { user, loading } = useAdminAuth();
    const { activeTab, setActiveTab } = useTabState();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (loading) return <AdminLoadingScreen />;

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
    };

    return (
        <AdminPageLayout>
            <MobileHeader activeTab={activeTab} onMenuOpen={() => setMobileMenuOpen(true)} />
            {mobileMenuOpen && (
                <MobileMenuDrawer
                    user={user}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onClose={() => setMobileMenuOpen(false)}
                />
            )}
            <AdminContentArea
                sidebar={<AdminSidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} />}
                content={<AdminMainContent activeTab={activeTab} />}
            />
            <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </AdminPageLayout>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminLoadingScreen />}>
            <AdminContent />
        </Suspense>
    );
}
