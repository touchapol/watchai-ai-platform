'use client';

import { useState } from 'react';
import { DailyUsage } from '@/types/dashboard';

interface Props {
    data: DailyUsage[];
    days: 7 | 14 | 30;
    onDaysChange: (days: 7 | 14 | 30) => void;
}

export default function UsageChart({ data, days, onDaysChange }: Props) {
    const [hoveredDay, setHoveredDay] = useState<{ index: number; x: number } | null>(null);
    const filteredData = data.slice(-days);
    const maxValue = Math.max(...filteredData.map(d => d.count), 1);
    const dataPoints = filteredData.length - 1 || 1;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">การใช้งานการสนทนา</h2>
                <div className="flex items-center text-xs relative z-20">
                    {[7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => onDaysChange(d as 7 | 14 | 30)}
                            className={`px-2 py-1 rounded transition-colors ${days === d
                                ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-[#2c2c2c]'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative h-40" onMouseLeave={() => setHoveredDay(null)}>
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="usageAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M0,100 ${filteredData.map((day, i) => {
                            const x = (i / dataPoints) * 300;
                            const y = 100 - (day.count / maxValue) * 90;
                            return `L${x},${y}`;
                        }).join(' ')} L300,100 Z`}
                        fill="url(#usageAreaGradient)"
                    />
                    <path
                        d={`M0,${100 - (filteredData[0]?.count || 0) / maxValue * 90} ${filteredData.map((day, i) => {
                            const x = (i / dataPoints) * 300;
                            const y = 100 - (day.count / maxValue) * 90;
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
                                x1={(hoveredDay.index / dataPoints) * 300}
                                y1="0"
                                x2={(hoveredDay.index / dataPoints) * 300}
                                y2="100"
                                stroke="rgb(156, 163, 175)"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                            <circle
                                cx={(hoveredDay.index / dataPoints) * 300}
                                cy={100 - (filteredData[hoveredDay.index]?.count || 0) / maxValue * 90}
                                r="4"
                                fill="rgb(75, 85, 99)"
                                className="dark:fill-gray-300"
                            />
                        </>
                    )}
                    {filteredData.map((_, i) => (
                        <rect
                            key={i}
                            x={(i / dataPoints) * 300 - 5}
                            y="0"
                            width="10"
                            height="100"
                            fill="transparent"
                            onMouseEnter={() => setHoveredDay({ index: i, x: (i / dataPoints) * 100 })}
                        />
                    ))}
                </svg>
                {hoveredDay !== null && filteredData[hoveredDay.index] && (
                    <div
                        className="absolute -top-2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-30"
                        style={{ left: `${hoveredDay.x}%` }}
                    >
                        <p className="font-medium">{formatDate(filteredData[hoveredDay.index].date)}</p>
                        <p>{filteredData[hoveredDay.index].count} สนทนา</p>
                    </div>
                )}
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{formatDate(filteredData[0]?.date || '')}</span>
                    <span>{formatDate(filteredData[Math.floor(filteredData.length / 2)]?.date || '')}</span>
                    <span>{formatDate(filteredData[filteredData.length - 1]?.date || '')}</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-[#272726]">
                <span className="text-xs text-gray-500">รวมทั้งหมด</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {filteredData.reduce((sum, d) => sum + d.count, 0).toLocaleString()} สนทนา
                </span>
            </div>
        </div>
    );
}
