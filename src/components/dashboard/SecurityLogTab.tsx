'use client';

import { useState, useEffect } from 'react';

interface SecurityLog {
    id: string;
    timestamp: string;
    event: string;
    severity: string;
    details: Record<string, unknown>;
    ip: string;
    location: string;
    device: string;
    browser: string;
    os: string;
    deviceToken: string | null;
}

export default function SecurityLogTab() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [prevCount, setPrevCount] = useState(5);
    const [page, setPage] = useState(1);
    const [logPeriod, setLogPeriod] = useState<1 | 7 | 30>(30);
    const [currentUserAgent, setCurrentUserAgent] = useState('');
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    });

    useEffect(() => {
        setCurrentUserAgent(navigator.userAgent);
    }, []);

    const [revokeTarget, setRevokeTarget] = useState<SecurityLog | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);
    const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
    const [logoutAllLoading, setLogoutAllLoading] = useState(false);

    const fetchLogs = async (p: number, start: Date, end: Date) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p.toString(),
                limit: '10',
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
            const res = await fetch(`/api/logs/security?${params}`);
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

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'mobile':
                return 'smartphone';
            case 'tablet':
                return 'tablet';
            case 'desktop':
                return 'laptop_mac';
            default:
                return 'devices_other';
        }
    };

    const translateEvent = (event: string) => {
        const translations: Record<string, string> = {
            LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
            LOGIN_FAILED: 'เข้าสู่ระบบล้มเหลว',
            LOGOUT: 'ออกจากระบบ',
            PASSWORD_CHANGE: 'เปลี่ยนรหัสผ่าน',
            SESSION_REVOKED: 'Revoked',
        };
        return translations[event] || event;
    };

    const isSessionRevoked = (log: SecurityLog) => {
        return logs.some(l =>
            l.event === 'SESSION_REVOKED' &&
            (l.details as Record<string, string>)?.revokedDeviceToken === log.deviceToken
        );
    };

    const isSessionActive = (log: SecurityLog) => {
        if (log.event !== 'LOGIN_SUCCESS') return false;
        if (!log.deviceToken) return false;
        const loginTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return (now - loginTime) < sevenDaysMs;
    };

    const isCurrentDevice = (log: SecurityLog) => {
        return (log.details as Record<string, string>)?.userAgent === currentUserAgent;
    };

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
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">หน้า {page}/{totalPages} ({total} รายการ)</span>
                </div>
            </div>
            {loading ? (
                <div style={{ minHeight: `${prevCount * 72 + 40}px` }}>
                    <div className="space-y-3">
                        {[...Array(prevCount)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-[#272726]">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-full animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                                    <div className="h-3 w-48 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                                </div>
                                <div className="h-3 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : logs.length > 0 ? (
                <>
                    <div className="space-y-3" style={{ minHeight: `${logs.length * 72 + 40}px` }}>
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-[#272726]">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.event === 'LOGIN_SUCCESS'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : log.event === 'LOGIN_FAILED'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {getDeviceIcon(log.device)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                                            {log.event === 'SESSION_REVOKED'
                                                ? (() => {
                                                    const details = log.details as Record<string, string>;
                                                    const revokedUA = details?.revokedUserAgent || '';
                                                    const browserMatch = revokedUA.match(/(Chrome|Firefox|Safari|Edge|Opera)/i);
                                                    const osMatch = revokedUA.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/i);
                                                    const browser = browserMatch ? browserMatch[0] : 'Unknown';
                                                    const os = osMatch ? osMatch[0] : 'Unknown';
                                                    return browser === 'Unknown' && os === 'Unknown' ? 'Unknown Device' : `${browser} บน ${os}`;
                                                })()
                                                : log.browser === 'Unknown' && log.os === 'Unknown'
                                                    ? 'Unknown Device'
                                                    : `${log.browser} บน ${log.os}`}
                                        </span>
                                        {log.event !== 'SESSION_REVOKED' && (log.details as Record<string, string>)?.userAgent === currentUserAgent && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                อุปกรณ์นี้
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${log.event === 'LOGIN_SUCCESS'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : log.event === 'LOGIN_FAILED'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : log.event === 'LOGOUT'
                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    : log.event === 'SESSION_REVOKED'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {translateEvent(log.event)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        <span className="material-symbols-outlined align-middle mr-0.5" style={{ fontSize: '14px' }}>location_on</span>
                                        {log.event === 'SESSION_REVOKED'
                                            ? (log.details as Record<string, string>)?.revokedLocation || 'Unknown'
                                            : log.location} • IP: {log.event === 'SESSION_REVOKED'
                                                ? (log.details as Record<string, string>)?.revokedIp || log.ip
                                                : log.ip} • {formatTime(log.timestamp)}
                                        {log.event === 'SESSION_REVOKED' && (
                                            <span className="ml-2">
                                                • โดย {log.browser} บน {log.os}@{(log.details as Record<string, string>)?.revokerIp || log.ip}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {isSessionActive(log) && !isCurrentDevice(log) && (
                                    isSessionRevoked(log) ? (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
                                            Already revoked
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setRevokeTarget(log)}
                                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        >
                                            Revoke
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
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

            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRevokeTarget(null)} />
                    <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <span className="material-symbols-outlined text-[32px] text-red-600 dark:text-red-400">remove_circle</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                            ยกเลิก Session นี้?
                        </h3>
                        <div className="bg-gray-50 dark:bg-[#252525] rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {revokeTarget.browser === 'Unknown' && revokeTarget.os === 'Unknown'
                                    ? 'Unknown Device'
                                    : `${revokeTarget.browser} บน ${revokeTarget.os}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {revokeTarget.location} • IP: {revokeTarget.ip}
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            การดำเนินการนี้จะออกจากระบบอุปกรณ์ที่เลือก
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRevokeTarget(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={async () => {
                                    if (!revokeTarget.deviceToken) return;
                                    setRevokeLoading(true);
                                    try {
                                        await fetch('/api/auth/revoke-session', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ deviceToken: revokeTarget.deviceToken })
                                        });
                                        await fetchLogs(page, dateRange.start, dateRange.end);
                                    } finally {
                                        setRevokeLoading(false);
                                        setRevokeTarget(null);
                                    }
                                }}
                                disabled={revokeLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {revokeLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                                        ยืนยัน Revoke
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLogoutAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[24px]">logout</span>
                        </div>
                        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                            ออกจากระบบทุกอุปกรณ์
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            การดำเนินการนี้จะออกจากระบบทุกอุปกรณ์ยกเว้นอุปกรณ์ปัจจุบัน
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutAllModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={async () => {
                                    setLogoutAllLoading(true);
                                    try {
                                        await fetch('/api/auth/logout-all', { method: 'POST' });
                                        await fetchLogs(page, dateRange.start, dateRange.end);
                                    } finally {
                                        setLogoutAllLoading(false);
                                        setShowLogoutAllModal(false);
                                    }
                                }}
                                disabled={logoutAllLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {logoutAllLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        ยืนยัน
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
