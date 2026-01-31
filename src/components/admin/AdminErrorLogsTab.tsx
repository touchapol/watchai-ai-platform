'use client';

import { useState, useEffect } from 'react';

interface ErrorLog {
    id: string;
    source: string;
    errorType: string;
    message: string;
    details: string | null;
    userId: string | null;
    apiKeyId: string | null;
    modelId: string | null;
    createdAt: string;
}

const ERROR_TYPE_COLORS: Record<string, string> = {
    RATE_LIMIT: 'text-amber-500',
    STREAMING_ERROR: 'text-red-500',
    FETCH_MODELS_ERROR: 'text-orange-500',
    GENERAL_ERROR: 'text-red-600',
};

const ERROR_TYPE_ICONS: Record<string, string> = {
    RATE_LIMIT: 'speed',
    STREAMING_ERROR: 'error',
    FETCH_MODELS_ERROR: 'warning',
    GENERAL_ERROR: 'dangerous',
};

export function AdminErrorLogsTab() {
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [clearing, setClearing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/error-logs?page=${page}&limit=20`);
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Fetch error logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const handleClearAll = async () => {
        setShowConfirmModal(false);
        setClearing(true);
        try {
            await fetch('/api/admin/error-logs?clearAll=true', { method: 'DELETE' });
            fetchLogs();
        } catch (error) {
            console.error('Clear logs error:', error);
        } finally {
            setClearing(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/admin/error-logs?id=${id}`, { method: 'DELETE' });
            setLogs(logs.filter(l => l.id !== id));
            setTotal(t => t - 1);
        } catch (error) {
            console.error('Delete log error:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">รายการข้อผิดพลาด</h2>
                    <p className="text-sm text-gray-500 mt-1">บันทึกข้อผิดพลาดจากระบบ Chat ({total} รายการ)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors text-sm font-medium disabled:opacity-50"
                        title="รีเฟรช"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                    {logs.length > 0 && (
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={clearing}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            ล้างทั้งหมด
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4 animate-pulse">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-green-500 mb-4">check_circle</span>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">ไม่มี Error Logs</h3>
                    <p className="text-sm text-gray-500">ระบบทำงานปกติ ไม่มีข้อผิดพลาด</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {logs.map(log => (
                        <div key={log.id} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a] ${ERROR_TYPE_COLORS[log.errorType] || 'text-gray-500'}`}>
                                    <span className="material-symbols-outlined">
                                        {ERROR_TYPE_ICONS[log.errorType] || 'error'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-sm font-semibold ${ERROR_TYPE_COLORS[log.errorType] || 'text-gray-700 dark:text-gray-300'}`}>
                                            {log.errorType}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-[#2a2a2a] rounded text-gray-600 dark:text-gray-400">
                                            {log.source}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                                        {log.message}
                                    </p>
                                    {log.details && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                                รายละเอียดเพิ่มเติม
                                            </summary>
                                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-[#1a1a1a] rounded text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap break-all">
                                                {log.details}
                                            </pre>
                                        </details>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                        {log.modelId && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                                {log.modelId}
                                            </span>
                                        )}
                                        {log.apiKeyId && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">key</span>
                                                {log.apiKeyId.slice(0, 8)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(log.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="ลบ"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 text-sm"
                    >
                        ก่อนหน้า
                    </button>
                    <span className="text-sm text-gray-500">
                        หน้า {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 text-sm"
                    >
                        ถัดไป
                    </button>
                </div>
            )}

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">ยืนยันการลบ</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">ต้องการลบ Error Logs ทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                            >
                                ลบทั้งหมด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
