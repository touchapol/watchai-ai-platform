'use client';

import { useState, useEffect } from 'react';

interface EventLog {
    id: string;
    timestamp: string;
    action: string;
    resource: string;
    details: Record<string, unknown>;
}

export default function EventLogTab() {
    const [logs, setLogs] = useState<EventLog[]>([]);
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
            const res = await fetch(`/api/logs/events?${params}`);
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

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            READ: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    };

    const translateAction = (action: string) => {
        const translations: Record<string, string> = {
            CREATE: 'สร้าง',
            UPDATE: 'แก้ไข',
            DELETE: 'ลบ',
            READ: 'อ่าน',
            LOGIN: 'เข้าสู่ระบบ',
            LOGOUT: 'ออกจากระบบ',
            UPLOAD: 'อัปโหลด',
            DOWNLOAD: 'ดาวน์โหลด',
            SEND_MESSAGE: 'ส่งข้อความ',
            CHAT_MESSAGE: 'ส่งข้อความแชท',
            CONVERSATION_CREATE: 'สร้างการสนทนา',
            CONVERSATION_DELETE: 'ลบการสนทนา',
            CONVERSATION_SELECT: 'เลือกการสนทนา',
            FILE_UPLOAD: 'อัปโหลดไฟล์',
            FILE_DELETE: 'ลบไฟล์',
            FILE_RENAME: 'เปลี่ยนชื่อไฟล์',
            FILE_VIEW: 'ดูไฟล์',
            FILE_DOWNLOAD: 'ดาวน์โหลดไฟล์',
            FILE_CREATE: 'สร้างไฟล์',
            FILE_EDIT: 'แก้ไขไฟล์',
            FOLDER_CREATE: 'สร้างโฟลเดอร์',
            SETTINGS_UPDATE: 'อัปเดตการตั้งค่า',
            PASSWORD_CHANGE: 'เปลี่ยนรหัสผ่าน',
            VIEW_OVERVIEW: 'ดูหน้า Overview',
            VIEW_USAGE_LOG: 'ดูหน้า Usage Log',
            VIEW_EVENT_LOG: 'ดูหน้า Event Log',
            VIEW_SECURITY_LOG: 'ดูหน้า Security Log',
            VIEW_PROFILE: 'ดูหน้า Profile',
            VIEW_SETTINGS: 'ดูหน้าการตั้งค่า',
            LOGOUT_ALL: 'ออกจากระบบทุกอุปกรณ์',
            REGISTER: 'สมัครสมาชิก',
            VIEW_FILES: 'เข้าหน้าไฟล์',
            ADMIN_VIEW_OVERVIEW: 'ดูหน้า Admin Overview',
            ADMIN_VIEW_USERS: 'ดูหน้า Admin Users',
            ADMIN_VIEW_USAGE_LOG: 'ดูหน้า Admin Usage Log',
            ADMIN_VIEW_EVENT_LOG: 'ดูหน้า Admin Event Log',
            ADMIN_VIEW_SECURITY_LOG: 'ดูหน้า Admin Security Log',
            ADMIN_VIEW_SETTINGS: 'ดูหน้า Admin Settings',
            ADMIN_UPDATE_SETTINGS: 'อัปเดต Admin Settings',
            ADMIN_UPDATE_USER: 'อัปเดตข้อมูลผู้ใช้',
        };
        return translations[action] || action;
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
                <span className="text-xs text-gray-500">หน้า {page}/{totalPages} ({total} รายการ)</span>
            </div>
            {loading ? (
                <div style={{ minHeight: `${prevCount * 48 + 40}px` }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-[#272726]">
                                <th className="pb-2 font-medium">เวลา</th>
                                <th className="pb-2 font-medium">กระทำ</th>
                                <th className="pb-2 font-medium">ทรัพยากร</th>
                                <th className="pb-2 font-medium">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(prevCount)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-[#1a1a19]">
                                    <td className="py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" /></td>
                                    <td className="py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" /></td>
                                    <td className="py-3"><div className="h-4 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" /></td>
                                    <td className="py-3"><div className="h-4 w-32 bg-gray-200 dark:bg-[#2a2a2a] rounded animate-pulse" /></td>
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
                                    <th className="pb-2 font-medium">กระทำ</th>
                                    <th className="pb-2 font-medium">ทรัพยากร</th>
                                    <th className="pb-2 font-medium">รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const getDisplayResource = (resource: string, action: string) => {
                                        const apiToFrontend: Record<string, string> = {
                                            '/api/chat': '/chat',
                                            '/api/conversations': '/chat',
                                            '/api/files': '/files',
                                            '/api/overview': '/dashboard',
                                            '/api/logs/events': '/dashboard',
                                            '/api/logs/security': '/dashboard',
                                            '/api/logs/usage': '/dashboard',
                                            '/api/auth/me': '/dashboard',
                                        };
                                        return apiToFrontend[resource] || resource.replace('/api/', '/');
                                    };

                                    const getDisplayDetails = (log: EventLog) => {
                                        const details = log.details as Record<string, string>;
                                        const getFilePath = () => {
                                            const path = details?.path || '';
                                            const fileName = details?.fileName || '';
                                            if (path && fileName) return `/${path}/${fileName}`.replace(/\/+/g, '/');
                                            if (fileName) return `/${fileName}`;
                                            return details?.fileId || log.id;
                                        };

                                        if (['CHAT_MESSAGE', 'CONVERSATION_CREATE', 'CONVERSATION_DELETE'].includes(log.action)) {
                                            return details?.conversationId || log.id;
                                        }
                                        if (log.action === 'CONVERSATION_SELECT') {
                                            return details?.conversationTitle || details?.conversationId || log.id;
                                        }
                                        if (['FILE_UPLOAD', 'FILE_DELETE', 'FILE_VIEW', 'FILE_DOWNLOAD', 'FILE_CREATE', 'FILE_EDIT'].includes(log.action)) {
                                            return getFilePath();
                                        }
                                        if (log.action === 'FILE_RENAME') {
                                            const path = details?.path || '';
                                            if (details?.oldName && details?.newName) {
                                                const prefix = path ? `/${path}/` : '/';
                                                return `${prefix}${details.oldName} → ${details.newName}`.replace(/\/+/g, '/');
                                            }
                                            return getFilePath();
                                        }
                                        if (log.action === 'FOLDER_CREATE') {
                                            const path = details?.path || '';
                                            const folderName = details?.folderName || '';
                                            if (path && folderName) return `/${path}/${folderName}/`.replace(/\/+/g, '/');
                                            if (folderName) return `/${folderName}/`;
                                            return log.id;
                                        }
                                        if (log.action === 'VIEW_FILES') {
                                            return '/files';
                                        }
                                        if (log.action === 'SETTINGS_UPDATE') {
                                            return details?.setting || 'Settings';
                                        }
                                        return log.id;
                                    };

                                    return (
                                        <tr key={log.id} className="border-b border-gray-100 dark:border-[#1a1a19]">
                                            <td className="py-3 text-gray-600 dark:text-gray-400 text-xs">
                                                {formatTime(log.timestamp)}
                                            </td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionBadge(log.action)}`}>
                                                    {translateAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-700 dark:text-gray-300">
                                                {getDisplayResource(log.resource, log.action)}
                                            </td>
                                            <td className="py-3 text-gray-500 text-xs max-w-[200px] truncate">
                                                {getDisplayDetails(log)}
                                            </td>
                                        </tr>
                                    );
                                })}
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
