'use client';

import { AdminTab, TAB_TITLES } from './types';
import { AdminUsersTab } from './AdminUsersTab';
import { AuthSettingsTab } from './AuthSettingsTab';
import { AiSettingsTab } from './AiSettingsTab';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsageTab } from './AdminUsageTab';
import { AdminEventsTab } from './AdminEventsTab';
import { AdminSecurityTab } from './AdminSecurityTab';
import { AdminProvidersTab } from './AdminProvidersTab';
import { AdminKnowledgeBaseTab } from './AdminKnowledgeBaseTab';
import { AdminErrorLogsTab } from './AdminErrorLogsTab';

interface MainContentProps {
    activeTab: AdminTab;
}

const TAB_COMPONENTS: Record<AdminTab, React.ComponentType> = {
    overview: AdminOverviewTab,
    users: AdminUsersTab,
    providers: AdminProvidersTab,
    usage: AdminUsageTab,
    events: AdminEventsTab,
    knowledgebase: AdminKnowledgeBaseTab,
    errorlogs: AdminErrorLogsTab,
    security: AdminSecurityTab,
    auth: AuthSettingsTab,
    aisettings: AiSettingsTab,
};

export function AdminMainContent({ activeTab }: MainContentProps) {
    const TabComponent = TAB_COMPONENTS[activeTab];

    return (
        <div className="w-full">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {TAB_TITLES[activeTab]}
            </h1>
            <TabComponent />
        </div>
    );
}
