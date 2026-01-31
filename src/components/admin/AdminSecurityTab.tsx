'use client';

import { useState, useEffect } from 'react';
import { UserPicker } from './UserPicker';

interface SecurityLog {
    id: string;
    userId: string;
    username: string;
    email: string;
    action: string;
    level: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function AdminSecurityTab() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);

    const fetchLogs = async (page = 1, userId = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (userId) params.set('userId', userId);

            const res = await fetch(`/api/admin/logs/security?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setPagination(data.pagination);
        } catch {
            console.error('Fetch security logs error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    const getLevelDotColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-500';
            case 'WARNING': return 'bg-yellow-500';
            case 'INFO': return 'bg-blue-500';
            default: return 'bg-gray-400';
        }
    };

    const parseUserAgent = (ua: string) => {
        let browser = 'Unknown';
        let os = 'Unknown';

        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac OS')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        return `${browser} on ${os}`;
    };

    const translateAction = (action: string) => {
        const translations: Record<string, string> = {
            'LOGIN_SUCCESS': 'เข้าสู่ระบบสำเร็จ',
            'LOGIN_FAILED': 'เข้าสู่ระบบล้มเหลว',
            'PASSWORD_CHANGE': 'เปลี่ยนรหัสผ่าน',
            'LOGOUT': 'ออกจากระบบ',
            'SESSION_REVOKED': 'ยกเลิก Session',
            'ACCOUNT_LOCKED': 'บัญชีถูกล็อค',
            'UNAUTHORIZED_ACCESS': 'เข้าถึงโดยไม่ได้รับอนุญาต',
        };
        return translations[action] || action;
    };

    const colSpan = selectedUser ? 3 : 4;

    return (
        <div className="space-y-4">
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
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">รายละเอียด</th>
                            <th className="px-4 py-3">เวลา</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-200 dark:border-[#272726] animate-pulse">
                                    {!selectedUser && <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-24" /></td>}
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-28" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-32" /></td>
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
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${getLevelDotColor(log.level)}`} title={log.level} />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{translateAction(log.action)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Boolean(log.metadata?.ip) && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-[#252525] rounded text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="material-symbols-outlined text-[12px]">lan</span>
                                                    {String(log.metadata?.ip)}
                                                </span>
                                            )}
                                            {Boolean(log.metadata?.userAgent) && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-[#252525] rounded text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="material-symbols-outlined text-[12px]">devices</span>
                                                    {parseUserAgent(String(log.metadata?.userAgent))}
                                                </span>
                                            )}
                                            {!log.metadata?.ip && !log.metadata?.userAgent && (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
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
