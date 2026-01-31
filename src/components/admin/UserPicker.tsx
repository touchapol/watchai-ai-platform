'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
}

interface UserPickerProps {
    selectedUser: { id: string; username: string } | null;
    onSelect: (user: { id: string; username: string } | null) => void;
}

export function UserPicker({ selectedUser, onSelect }: UserPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const fetchUsers = useCallback(async (searchQuery: string, pageNum: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: '10' });
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.users || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            console.error('Fetch users error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchUsers(search, page);
        }
    }, [isOpen, search, page, fetchUsers]);

    const handleOpen = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
        setIsOpen(true);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleSelect = (user: User | null) => {
        onSelect(user ? { id: user.id, username: user.username } : null);
        setIsOpen(false);
        setSearch('');
        setPage(1);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors"
            >
                <span className="material-symbols-outlined text-[18px] text-gray-500">person</span>
                <span className="text-gray-700 dark:text-gray-300">
                    {selectedUser ? selectedUser.username : 'ผู้ใช้ทั้งหมด'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-gray-400">expand_more</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl z-50 overflow-hidden"
                        style={{ top: position.top, left: position.left }}
                    >
                        <div className="p-3 border-b border-gray-200 dark:border-[#333]">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="ค้นหาผู้ใช้..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-[#252525] border-none rounded-lg text-sm outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            <button
                                onClick={() => handleSelect(null)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors ${!selectedUser ? 'bg-gray-100 dark:bg-[#252525]' : ''}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px] text-gray-500">group</span>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">ผู้ใช้ทั้งหมด</span>
                            </button>

                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2a2a2a]" />
                                        <div className="flex-1 space-y-1">
                                            <div className="h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded w-24" />
                                            <div className="h-2 bg-gray-200 dark:bg-[#2a2a2a] rounded w-32" />
                                        </div>
                                    </div>
                                ))
                            ) : users.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-gray-500">ไม่พบผู้ใช้</div>
                            ) : (
                                users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelect(user)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors ${selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-[#252525]' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                            {user.username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.username}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        {selectedUser?.id === user.id && (
                                            <span className="material-symbols-outlined text-[18px] text-green-500">check</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-[#333]">
                                <span className="text-xs text-gray-500">หน้า {page}/{totalPages}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#252525] disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#252525] disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
