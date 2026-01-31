'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    _count: {
        conversations: number;
        files: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function AdminUsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchUsers = async (page = 1, searchQuery = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.users || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(1, search);
    };

    const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                setEditingUser(null);
            }
        } catch (error) {
            console.error('Update role error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                setDeleteConfirm(null);
            }
        } catch (error) {
            console.error('Delete user error:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาผู้ใช้..."
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-300"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium"
                >
                    ค้นหา
                </button>
            </form>

            <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-[#272726] text-left text-xs text-gray-500 uppercase">
                            <th className="px-4 py-3">ผู้ใช้</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">สถิติ</th>
                            <th className="px-4 py-3">เข้าร่วม</th>
                            <th className="px-4 py-3 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-200 dark:border-[#272726] animate-pulse">
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-32" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-16" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-20" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-24" /></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-12 ml-auto" /></td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    ไม่พบผู้ใช้
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-200 dark:border-[#272726] last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center text-xs font-medium">
                                                {user.username.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'ADMIN'
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {user._count.conversations} แชท, {user._count.files} ไฟล์
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                                                title="แก้ไข Role"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(user)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                                                title="ลบผู้ใช้"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        แสดง {users.length} จาก {pagination.total} ผู้ใช้
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchUsers(pagination.page - 1, search)}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded-lg disabled:opacity-50"
                        >
                            ก่อนหน้า
                        </button>
                        <button
                            onClick={() => fetchUsers(pagination.page + 1, search)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded-lg disabled:opacity-50"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 w-80 shadow-xl">
                        <h3 className="text-lg font-medium mb-4">แก้ไข Role</h3>
                        <p className="text-sm text-gray-500 mb-4">ผู้ใช้: {editingUser.username}</p>
                        <div className="space-y-2 mb-4">
                            {(['USER', 'ADMIN'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleChange(editingUser.id, role)}
                                    disabled={saving}
                                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${editingUser.role === role
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                        : 'border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setEditingUser(null)}
                            className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 w-80 shadow-xl">
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[24px] text-red-500">warning</span>
                            </div>
                            <h3 className="text-lg font-medium">ลบผู้ใช้?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                ต้องการลบ &quot;{deleteConfirm.username}&quot; หรือไม่?
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={saving}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                            >
                                {saving ? 'กำลังลบ...' : 'ลบ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
