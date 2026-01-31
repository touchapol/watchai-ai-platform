'use client';

import { OverviewData } from '@/types/dashboard';
import { StatsCards, UsageChart, TopModels, RecentFiles } from './index';

interface DashboardOverviewTabProps {
    data: OverviewData | null;
    loading: boolean;
    chartDays: 7 | 14 | 30;
    onChartDaysChange: (days: 7 | 14 | 30) => void;
}

export function DashboardOverviewTab({ data, loading, chartDays, onChartDaysChange }: DashboardOverviewTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full" />
            </div>
        );
    }

    return (
        <>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Overview</h1>

            <StatsCards
                totalChats={data?.stats.totalChats || 0}
                todayChats={data?.stats.todayMessages || 0}
                totalFiles={data?.stats.totalFiles || 0}
            />

            <UsageChart
                data={data?.dailyUsage || []}
                days={chartDays}
                onDaysChange={onChartDaysChange}
            />

            <TopModels models={data?.topModels || []} />

            <RecentFiles files={data?.recentFiles || []} />
        </>
    );
}
