'use client';

import { useState, useEffect } from 'react';
import { UsageData, DailyTokenUsage, ModelTokenUsage } from '@/types/dashboard';

interface LLMLog {
    id: string;
    timestamp: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    status: 'SUCCESS' | 'ERROR';
    conversationId?: string;
}

export default function UsageTab() {
    const [usageData, setUsageData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<1 | 7 | 14 | 30>(7);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/usage?period=${period}`)
            .then(res => res.json())
            .then(data => {
                setUsageData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [period]);

    const formatNumber = (num: number) => num.toLocaleString('th-TH');

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    const maxTokens = usageData?.dailyTokens
        ? Math.max(...usageData.dailyTokens.map(d => d.totalTokens), 1)
        : 1;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <TokenStats
                promptTokens={usageData?.tokenUsage.promptTokens || 0}
                completionTokens={usageData?.tokenUsage.completionTokens || 0}
                totalTokens={usageData?.tokenUsage.totalTokens || 0}
                messageCount={usageData?.tokenUsage.messageCount || 0}
            />

            <TokenChart
                data={usageData?.dailyTokens || []}
                maxTokens={maxTokens}
                period={period}
                onPeriodChange={setPeriod}
                formatDate={formatDate}
            />

            <ModelBreakdown
                models={usageData?.modelBreakdown || []}
                formatNumber={formatNumber}
            />

            <LLMRequestLog />
        </div>
    );
}

function TokenStats({ promptTokens, completionTokens, totalTokens, messageCount }: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    messageCount: number;
}) {
    const formatNumber = (num: number) => num.toLocaleString('th-TH');

    const stats = [
        { label: 'Total Tokens', value: formatNumber(totalTokens) },
        { label: 'Prompt Tokens', value: formatNumber(promptTokens) },
        { label: 'Completion Tokens', value: formatNumber(completionTokens) },
        { label: 'Messages', value: formatNumber(messageCount) }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-4"
                >
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

function TokenChart({ data, maxTokens, period, onPeriodChange, formatDate }: {
    data: DailyTokenUsage[];
    maxTokens: number;
    period: 1 | 7 | 14 | 30;
    onPeriodChange: (p: 1 | 7 | 14 | 30) => void;
    formatDate: (d: string) => string;
}) {
    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Token Usage</h2>
                <div className="flex items-center text-xs relative z-20">
                    {[1, 7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => onPeriodChange(d as 1 | 7 | 14 | 30)}
                            className={`px-2 py-1 rounded transition-colors ${period === d
                                ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-[#2c2c2c]'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-end gap-[2px] h-40 mt-8">
                {data.map((day, i) => {
                    const isNearEnd = i >= data.length - 3;
                    return (
                        <div key={i} className="flex-1 h-full flex items-end group relative">
                            <div className={`absolute -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 ${isNearEnd ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                                <div>Total: {day.totalTokens.toLocaleString()}</div>
                                <div className="text-gray-300">Prompt: {day.promptTokens.toLocaleString()}</div>
                                <div className="text-gray-400">Completion: {day.completionTokens.toLocaleString()}</div>
                            </div>
                            <div
                                className="w-full bg-gray-500 dark:bg-gray-400 rounded-t transition-all hover:bg-gray-600 dark:hover:bg-gray-300 cursor-pointer"
                                style={{
                                    height: `${(day.totalTokens / maxTokens) * 100}%`,
                                    minHeight: day.totalTokens > 0 ? '4px' : '0'
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className={`flex justify-between text-gray-500 mt-2 ${period === 30 ? 'text-[6px]' : 'text-[10px]'}`}>
                {data.map((day, i) => (
                    <span key={i} className="flex-1 text-center">{formatDate(day.date)}</span>
                ))}
            </div>
        </div>
    );
}

function ModelBreakdown({ models, formatNumber }: {
    models: ModelTokenUsage[];
    formatNumber: (n: number) => string;
}) {
    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Model Breakdown</h2>
            {models.length > 0 ? (
                <div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-[#272726]">
                                <th className="pb-2 font-medium">Model</th>
                                <th className="pb-2 font-medium text-right">Prompt</th>
                                <th className="pb-2 font-medium text-right">Completion</th>
                                <th className="pb-2 font-medium text-right">Total</th>
                                <th className="pb-2 font-medium text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {models.map((model, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-[#1a1a19]">
                                    <td className="py-3 text-gray-700 dark:text-gray-300">{model.model}</td>
                                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                                        {formatNumber(model.promptTokens)}
                                    </td>
                                    <td className="py-3 text-right text-gray-500">
                                        {formatNumber(model.completionTokens)}
                                    </td>
                                    <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                                        {formatNumber(model.totalTokens)}
                                    </td>
                                    <td className="py-3 text-right text-gray-500">{model.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            )}
        </div>
    );
}

function LLMRequestLog() {
    const [logs, setLogs] = useState<{ id: string; timestamp: string; model: string; promptTokens: number; completionTokens: number; totalTokens: number; latencyMs: number; status: 'SUCCESS' | 'ERROR'; conversationId?: string }[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [prevCount, setPrevCount] = useState(5);
    const [page, setPage] = useState(1);
    const [logPeriod, setLogPeriod] = useState<1 | 7 | 30>(30);
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    });

    const fetchLogs = async (p: number, start: Date, end: Date) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p.toString(),
                limit: '10',
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
            const res = await fetch(`/api/logs/llm?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setPrevCount(Math.max((data.logs || []).length, 1));
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page, dateRange.start, dateRange.end);
    }, [page, dateRange]);

    const handlePeriodChange = (days: 1 | 7 | 30) => {
        setLogPeriod(days);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);
        setDateRange({ start, end });
        setPage(1);
    };

    const handleExportXlsx = async () => {
        const XLSX = await import('xlsx');
        const params = new URLSearchParams({
            page: '1',
            limit: '10000',
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
        });
        const res = await fetch(`/api/logs/llm?${params}`);
        const data = await res.json();
        const exportData = (data.logs || []).map((log: { timestamp: string; model: string; promptTokens: number; completionTokens: number; totalTokens: number; latencyMs: number; status: string }) => ({
            'เวลา': new Date(log.timestamp).toLocaleString('th-TH'),
            'Model': log.model,
            'Prompt Tokens': log.promptTokens,
            'Completion Tokens': log.completionTokens,
            'Total Tokens': log.totalTokens,
            'Latency (ms)': log.latencyMs,
            'Status': log.status,
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'LLM Logs');
        XLSX.writeFile(wb, `llm-logs-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.xlsx`);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('th-TH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (date: Date) => {
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    const formatNumber = (num: number) => num.toLocaleString('th-TH');

    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-xs text-gray-600 dark:text-gray-400">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatDateShort(dateRange.start)} - {formatDateShort(dateRange.end)}
                    </div>
                    <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-0.5">
                        {([1, 7, 30] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => handlePeriodChange(d)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${logPeriod === d
                                    ? 'bg-white dark:bg-[#333] text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">หน้า {page}/{totalPages} ({total} รายการ)</span>
                    <button
                        onClick={handleExportXlsx}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Export XLSX
                    </button>
                </div>
            </div>
            {loading ? (
                <div style={{ minHeight: `${prevCount * 48 + 40}px` }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-[#272726]">
                                <th className="pb-2 font-medium">เวลา</th>
                                <th className="pb-2 font-medium">Model</th>
                                <th className="pb-2 font-medium text-right">Tokens</th>
                                <th className="pb-2 font-medium text-right">Latency</th>
                                <th className="pb-2 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(prevCount)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-[#1a1a19]">
                                    <td className="py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" /></td>
                                    <td className="py-3"><div className="h-4 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" /></td>
                                    <td className="py-3 text-right"><div className="h-4 w-12 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse ml-auto" /></td>
                                    <td className="py-3 text-right"><div className="h-4 w-10 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse ml-auto" /></td>
                                    <td className="py-3 text-center"><div className="h-5 w-5 bg-gray-200 dark:bg-[#2a2a2a] rounded-full animate-pulse mx-auto" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : logs.length > 0 ? (
                <>
                    <div style={{ minHeight: `${logs.length * 48 + 40}px` }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-[#272726]">
                                    <th className="pb-2 font-medium">เวลา</th>
                                    <th className="pb-2 font-medium">Model</th>
                                    <th className="pb-2 font-medium text-right">Tokens</th>
                                    <th className="pb-2 font-medium text-right">Latency</th>
                                    <th className="pb-2 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-100 dark:border-[#1a1a19]">
                                        <td className="py-3 text-gray-600 dark:text-gray-400 text-xs">
                                            {formatTime(log.timestamp)}
                                        </td>
                                        <td className="py-3 text-gray-700 dark:text-gray-300">
                                            {log.model}
                                        </td>
                                        <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                                            {formatNumber(log.totalTokens)}
                                        </td>
                                        <td className="py-3 text-right text-gray-500">
                                            {log.latencyMs ? `${(log.latencyMs / 1000).toFixed(2)}s` : '-'}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'SUCCESS'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {log.status === 'SUCCESS' ? '✓' : '✗'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-[#272726]">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                ก่อนหน้า
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-8 h-8 rounded text-xs font-medium transition-colors ${page === pageNum
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ถัดไป
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            )}
        </div>
    );
}
