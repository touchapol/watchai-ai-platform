'use client';

import { useState, useEffect } from 'react';
import { UserPicker } from './UserPicker';

interface UsageLog {
    id: string;
    userId: string;
    username: string;
    email: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface DailyTokens {
    date: string;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
}

interface UsageStats {
    tokenUsage: {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
        messageCount: number;
    };
    modelBreakdown: {
        model: string;
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
        count: number;
    }[];
    dailyTokens: DailyTokens[];
}

export function AdminUsageTab() {
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await fetch('/api/admin/logs/usage-stats');
            const data = await res.json();
            setStats(data);
        } catch {
            console.error('Fetch stats error');
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchLogs = async (page = 1, userId = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (userId) params.set('userId', userId);

            const res = await fetch(`/api/admin/logs/usage?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setPagination(data.pagination);
        } catch {
            console.error('Fetch usage logs error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchLogs();
    }, []);

    const handleUserChange = (user: { id: string; username: string } | null) => {
        setSelectedUser(user);
        fetchLogs(1, user?.id || '');
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('th-TH', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatNumber = (num: number) => num.toLocaleString('th-TH');

    const formatChartDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    const maxTokens = stats?.dailyTokens
        ? Math.max(...stats.dailyTokens.map(d => d.totalTokens), 1)
        : 1;

    const colSpan = selectedUser ? 4 : 5;

    return (
        <div className="space-y-6">
            {/* Token Stats */}
            {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4 animate-pulse">
                            <div className="h-8 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded mb-2" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                        </div>
                    ))}
                </div>
            ) : stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.tokenUsage.totalTokens)}</div>
                        <div className="text-xs text-gray-500 mt-1">Total Tokens</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.tokenUsage.promptTokens)}</div>
                        <div className="text-xs text-gray-500 mt-1">Prompt Tokens</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.tokenUsage.completionTokens)}</div>
                        <div className="text-xs text-gray-500 mt-1">Completion Tokens</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.tokenUsage.messageCount)}</div>
                        <div className="text-xs text-gray-500 mt-1">Messages</div>
                    </div>
                </div>
            )}

            {/* Token Usage Chart */}
            {stats && stats.dailyTokens.length > 0 && (
                <TokenUsageChart
                    dailyTokens={stats.dailyTokens}
                    maxTokens={maxTokens}
                />
            )}

            {/* Model Breakdown */}
            {stats && stats.modelBreakdown.length > 0 && (
                <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Model Breakdown</h3>
                    <div className="overflow-x-auto">
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
                                {stats.modelBreakdown.map((model, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-[#1a1a19] last:border-0">
                                        <td className="py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{model.model}</td>
                                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatNumber(model.promptTokens)}</td>
                                        <td className="py-3 text-right text-gray-500">{formatNumber(model.completionTokens)}</td>
                                        <td className="py-3 text-right text-gray-900 dark:text-white font-medium">{formatNumber(model.totalTokens)}</td>
                                        <td className="py-3 text-right text-gray-500">{formatNumber(model.count)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Picker */}
            <div className="flex items-center gap-4">
                <UserPicker selectedUser={selectedUser} onSelect={handleUserChange} />
            </div>

            {selectedUser && logs.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                        {logs[0].username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{logs[0].username}</p>
                        <p className="text-xs text-gray-500">{logs[0].email}</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-[#272726] text-left text-xs text-gray-500 uppercase">
                            {!selectedUser && <th className="px-4 py-3">ผู้ใช้</th>}
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3">Input</th>
                            <th className="px-4 py-3">Output</th>
                            <th className="px-4 py-3">เวลา</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-200 dark:border-[#272726] animate-pulse">
                                    {!selectedUser && <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-24" /></td>}
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-32" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-16" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-16" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-20" /></td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">ไม่มีข้อมูล</td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-200 dark:border-[#272726] last:border-0 text-sm">
                                    {!selectedUser && (
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-gray-900 dark:text-white">{log.username}</p>
                                                <p className="text-xs text-gray-500">{log.email}</p>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{log.model}</td>
                                    <td className="px-4 py-3 text-gray-500">{log.inputTokens?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-500">{log.outputTokens?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(log.createdAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">หน้า {pagination.page} จาก {pagination.totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchLogs(pagination.page - 1, selectedUser?.id || '')}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded-lg disabled:opacity-50"
                        >
                            ก่อนหน้า
                        </button>
                        <button
                            onClick={() => fetchLogs(pagination.page + 1, selectedUser?.id || '')}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded-lg disabled:opacity-50"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function TokenUsageChart({ dailyTokens, maxTokens }: { dailyTokens: DailyTokens[]; maxTokens: number }) {
    const [hoveredDay, setHoveredDay] = useState<{ index: number; x: number } | null>(null);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    return (
        <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-5">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Token Usage (30 วัน)</h3>
            <div className="relative h-40" onMouseLeave={() => setHoveredDay(null)}>
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="tokenAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M0,100 ${dailyTokens.slice(-30).map((day, i) => {
                            const x = (i / 29) * 300;
                            const y = 100 - (day.totalTokens / maxTokens) * 90;
                            return `L${x},${y}`;
                        }).join(' ')} L300,100 Z`}
                        fill="url(#tokenAreaGradient)"
                    />
                    <path
                        d={`M0,${100 - (dailyTokens[0]?.totalTokens || 0) / maxTokens * 90} ${dailyTokens.slice(-30).map((day, i) => {
                            const x = (i / 29) * 300;
                            const y = 100 - (day.totalTokens / maxTokens) * 90;
                            return `L${x},${y}`;
                        }).join(' ')}`}
                        fill="none"
                        stroke="rgb(107, 114, 128)"
                        strokeWidth="2"
                        className="dark:stroke-gray-400"
                    />
                    {hoveredDay !== null && (
                        <>
                            <line
                                x1={(hoveredDay.index / 29) * 300}
                                y1="0"
                                x2={(hoveredDay.index / 29) * 300}
                                y2="100"
                                stroke="rgb(156, 163, 175)"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                            <circle
                                cx={(hoveredDay.index / 29) * 300}
                                cy={100 - (dailyTokens[hoveredDay.index]?.totalTokens || 0) / maxTokens * 90}
                                r="4"
                                fill="rgb(75, 85, 99)"
                                className="dark:fill-gray-300"
                            />
                        </>
                    )}
                    {dailyTokens.slice(-30).map((_, i) => (
                        <rect
                            key={i}
                            x={(i / 29) * 300 - 5}
                            y="0"
                            width="10"
                            height="100"
                            fill="transparent"
                            onMouseEnter={() => setHoveredDay({ index: i, x: (i / 29) * 100 })}
                        />
                    ))}
                </svg>
                {hoveredDay !== null && dailyTokens[hoveredDay.index] && (
                    <div
                        className="absolute -top-2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none"
                        style={{ left: `${hoveredDay.x}%` }}
                    >
                        <p className="font-medium">{formatDate(dailyTokens[hoveredDay.index].date)}</p>
                        <p>Total: {dailyTokens[hoveredDay.index].totalTokens.toLocaleString()}</p>
                        <p className="text-gray-300 dark:text-gray-600">Prompt: {dailyTokens[hoveredDay.index].promptTokens.toLocaleString()}</p>
                        <p className="text-gray-400 dark:text-gray-500">Completion: {dailyTokens[hoveredDay.index].completionTokens.toLocaleString()}</p>
                    </div>
                )}
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{dailyTokens[0]?.date?.slice(5) || ''}</span>
                    <span>{dailyTokens[14]?.date?.slice(5) || ''}</span>
                    <span>{dailyTokens[29]?.date?.slice(5) || ''}</span>
                </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-[#272726]">
                <span className="text-xs text-gray-500">รวมทั้งหมด</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dailyTokens.reduce((sum, d) => sum + d.totalTokens, 0).toLocaleString()} tokens
                </span>
            </div>
        </section>
    );
}
