'use client';

import { useState, useEffect } from 'react';

interface SystemStats {
    totalUsers: number;
    totalChats: number;
    totalFiles: number;
    todayChats: number;
    weekChats: number;
    activeUsers: number;
}

interface DailyUsage {
    date: string;
    count: number;
}

interface TopModel {
    model: string;
    count: number;
}

interface TopUser {
    id: string;
    username: string;
    email: string;
    chatCount: number;
}

export function AdminOverviewTab() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
    const [topModels, setTopModels] = useState<TopModel[]>([]);
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<{ index: number; x: number } | null>(null);

    useEffect(() => {
        fetch('/api/admin/overview')
            .then(res => res.json())
            .then(data => {
                setStats(data.stats);
                setDailyUsage(data.dailyUsage || []);
                setTopModels(data.topModels || []);
                setTopUsers(data.topUsers || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <OverviewSkeleton />;
    }

    const maxUsage = Math.max(...dailyUsage.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon="group" label="ผู้ใช้ทั้งหมด" value={stats?.totalUsers || 0} />
                <StatCard icon="chat" label="แชททั้งหมด" value={stats?.totalChats || 0} />
                <StatCard icon="folder" label="ไฟล์ทั้งหมด" value={stats?.totalFiles || 0} />
                <StatCard icon="today" label="แชทวันนี้" value={stats?.todayChats || 0} />
                <StatCard icon="date_range" label="แชทสัปดาห์นี้" value={stats?.weekChats || 0} />
                <StatCard icon="person" label="ผู้ใช้งานจริง" value={stats?.activeUsers || 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-5">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">การใช้งาน 30 วัน</h3>
                    <div className="relative h-40" onMouseLeave={() => setHoveredDay(null)}>
                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path
                                d={`M0,100 ${dailyUsage.slice(-30).map((day, i) => {
                                    const x = (i / 29) * 300;
                                    const y = 100 - (day.count / maxUsage) * 90;
                                    return `L${x},${y}`;
                                }).join(' ')} L300,100 Z`}
                                fill="url(#areaGradient)"
                            />
                            <path
                                d={`M0,${100 - (dailyUsage[0]?.count || 0) / maxUsage * 90} ${dailyUsage.slice(-30).map((day, i) => {
                                    const x = (i / 29) * 300;
                                    const y = 100 - (day.count / maxUsage) * 90;
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
                                        cy={100 - (dailyUsage[hoveredDay.index]?.count || 0) / maxUsage * 90}
                                        r="4"
                                        fill="rgb(75, 85, 99)"
                                        className="dark:fill-gray-300"
                                    />
                                </>
                            )}
                            {dailyUsage.slice(-30).map((_, i) => (
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
                        {hoveredDay !== null && dailyUsage[hoveredDay.index] && (
                            <div
                                className="absolute -top-2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none"
                                style={{ left: `${hoveredDay.x}%` }}
                            >
                                <p className="font-medium">{dailyUsage[hoveredDay.index].date}</p>
                                <p>{dailyUsage[hoveredDay.index].count} แชท</p>
                            </div>
                        )}
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>{dailyUsage[0]?.date?.slice(5) || ''}</span>
                            <span>{dailyUsage[14]?.date?.slice(5) || ''}</span>
                            <span>{dailyUsage[29]?.date?.slice(5) || ''}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-[#272726]">
                        <span className="text-xs text-gray-500">รวมทั้งหมด</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {dailyUsage.reduce((sum, d) => sum + d.count, 0).toLocaleString()} แชท
                        </span>
                    </div>
                </section>

                <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-5">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Top Models</h3>
                    <div className="space-y-2">
                        {topModels.length === 0 ? (
                            <p className="text-sm text-gray-500">ไม่มีข้อมูล</p>
                        ) : (
                            topModels.map((model, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{model.model}</span>
                                    <span className="text-gray-500 ml-2">{model.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-5">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Top Users</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-[#272726] text-left text-xs text-gray-500 uppercase">
                                <th className="pb-2">ผู้ใช้</th>
                                <th className="pb-2">อีเมล</th>
                                <th className="pb-2 text-right">จำนวนแชท</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-gray-500">ไม่มีข้อมูล</td>
                                </tr>
                            ) : (
                                topUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-200 dark:border-[#272726] last:border-0">
                                        <td className="py-2 text-gray-900 dark:text-white">{user.username}</td>
                                        <td className="py-2 text-gray-500">{user.email}</td>
                                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{user.chatCount}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px] text-gray-400">{icon}</span>
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
    );
}

function OverviewSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
                <div className="h-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
            </div>
        </div>
    );
}
