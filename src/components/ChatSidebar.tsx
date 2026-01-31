'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Agent {
    id: string;
    name: string;
    lastMessage?: string;
}

interface ChatSidebarProps {
    agents: Agent[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onNewChat?: () => void;
    onSelectConversation?: (id: string) => void;
    onDeleteConversation?: (id: string) => void;
    onRenameConversation?: (id: string, newName: string) => void;
    currentConversationId?: string | null;
    loading?: boolean;
    activePage?: 'chat' | 'files' | 'usage' | 'dashboard';
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

export default function ChatSidebar({
    agents,
    searchQuery,
    onSearchChange,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onRenameConversation,
    currentConversationId,
    loading = false,
    activePage = 'chat',
    isMobileOpen = false,
    onMobileClose,
}: ChatSidebarProps) {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
    const [newName, setNewName] = useState('');
    const [internalConversations, setInternalConversations] = useState<Agent[]>([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Agent[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const shouldFetchInternally = agents.length === 0;
    const conversations = shouldFetchInternally ? internalConversations : agents;
    const isLoading = shouldFetchInternally ? (internalLoading && internalConversations.length === 0) : loading;
    const effectiveSearchQuery = shouldFetchInternally ? internalSearchQuery : searchQuery;

    useEffect(() => {
        setHasMounted(true);
        if (shouldFetchInternally) {
            const cached = localStorage.getItem('chatConversations');
            if (cached) {
                try {
                    setInternalConversations(JSON.parse(cached));
                } catch { }
            }
        }
    }, [shouldFetchInternally]);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (shouldFetchInternally) {
            setInternalLoading(true);
            fetch('/api/conversations')
                .then(res => res.json())
                .then(data => {
                    if (data.conversations) {
                        const mapped = data.conversations.map((c: { id: string; title: string }) => ({
                            id: c.id,
                            name: c.title,
                        }));
                        setInternalConversations(mapped);
                        localStorage.setItem('chatConversations', JSON.stringify(mapped));
                    }
                })
                .catch(console.error)
                .finally(() => setInternalLoading(false));
        }
    }, [shouldFetchInternally]);

    const searchFromAPI = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/api/conversations?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.conversations) {
                setSearchResults(data.conversations.map((c: { id: string; title: string }) => ({ id: c.id, name: c.title })));
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleInternalSearchChange = useCallback((query: string) => {
        setInternalSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        searchTimeoutRef.current = setTimeout(() => searchFromAPI(query), 300);
    }, [searchFromAPI]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const handleNewChatInternal = () => {
        if (onNewChat) {
            onNewChat();
        } else {
            router.push('/chat');
        }
    };

    const handleSelectInternal = (id: string) => {
        if (onSelectConversation) {
            onSelectConversation(id);
        } else {
            router.push(`/chat/${id}`);
        }
    };

    const handleDeleteInternal = async (id: string) => {
        if (onDeleteConversation) {
            onDeleteConversation(id);
        } else {
            try {
                const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setInternalConversations(prev => {
                        const updated = prev.filter(c => c.id !== id);
                        localStorage.setItem('chatConversations', JSON.stringify(updated));
                        return updated;
                    });
                }
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    };

    const handleRenameInternal = async (id: string, name: string) => {
        if (onRenameConversation) {
            onRenameConversation(id, name);
        } else {
            try {
                const res = await fetch(`/api/conversations/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: name }),
                });
                if (res.ok) {
                    setInternalConversations(prev => {
                        const updated = prev.map(c => c.id === id ? { ...c, name } : c);
                        localStorage.setItem('chatConversations', JSON.stringify(updated));
                        return updated;
                    });
                }
            } catch (error) {
                console.error('Rename error:', error);
            }
        }
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteConfirm({ id, name });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await handleDeleteInternal(deleteConfirm.id);
        } finally {
            setTimeout(() => {
                setDeleting(false);
                setDeleteConfirm(null);
            }, 300);
        }
    };

    const handleRenameClick = (id: string, name: string) => {
        setRenameModal({ id, name });
        setNewName(name);
    };

    const handleConfirmRename = async () => {
        if (!renameModal || !newName.trim()) return;
        await handleRenameInternal(renameModal.id, newName.trim());
        setRenameModal(null);
        setNewName('');
    };

    const filteredAgents = searchResults !== null
        ? searchResults
        : conversations.filter(agent => agent.name.toLowerCase().includes(effectiveSearchQuery.toLowerCase()));

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onMobileClose}
                />
            )}
            <aside
                className={`
                    ${collapsed ? 'w-16' : 'w-72'}
                    border-r border-gray-200 dark:border-[#262626]
                    flex flex-col bg-[#F5F5F5] dark:bg-[#0A0A0A]
                    transition-all duration-300
                    fixed md:relative inset-y-0 left-0 z-50
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-4 border-b border-gray-200 dark:border-[#262626]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <Logo />
                            {!collapsed && (
                                <span className="text-lg font-semibold whitespace-nowrap">WatchAI</span>
                            )}
                        </div>
                        <button
                            onClick={onMobileClose}
                            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#161616]"
                            title="ปิด Sidebar"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#161616]"
                            title={collapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {collapsed ? 'chevron_right' : 'chevron_left'}
                            </span>
                        </button>
                    </div>
                </div>

                {!collapsed && (
                    <div className="p-3 space-y-3">
                        <NewAgentButton onClick={handleNewChatInternal} />
                        <SearchInput
                            value={shouldFetchInternally ? internalSearchQuery : searchQuery}
                            onChange={shouldFetchInternally ? handleInternalSearchChange : onSearchChange}
                            loading={searching}
                        />
                    </div>
                )}

                {/* Icon Buttons - Collapsed */}
                {collapsed && (
                    <div className="p-2 space-y-2">
                        <IconButton icon="add" title="แชทใหม่" onClick={handleNewChatInternal} />
                        <IconButton icon="search" title="ค้นหา" />
                    </div>
                )}

                {/* Conversation List */}
                <ConversationList
                    conversations={filteredAgents}
                    collapsed={collapsed}
                    currentId={currentConversationId}
                    onSelect={handleSelectInternal}
                    onDelete={handleDeleteClick}
                    onRename={handleRenameClick}
                    loading={isLoading}
                />

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <DeleteConfirmModal
                        chatName={deleteConfirm.name}
                        deleting={deleting}
                        onConfirm={handleConfirmDelete}
                        onCancel={() => setDeleteConfirm(null)}
                    />
                )}

                {/* Rename Modal */}
                {renameModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 w-80 shadow-xl">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                เปลี่ยนชื่อแชท
                            </h3>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmRename();
                                    if (e.key === 'Escape') setRenameModal(null);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setRenameModal(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262626]"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleConfirmRename}
                                    disabled={!newName.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Navigation Links */}
                {!collapsed && (
                    <div className="px-2 pb-2 space-y-1">
                        <Link href="/files" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${activePage === 'files' ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-[#2a2a2a]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#161616]'}`}>
                            <span className="material-symbols-outlined text-[22px]">folder</span>
                            ไฟล์ของฉัน
                        </Link>
                        <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${activePage === 'dashboard' ? 'text-gray-900 dark:text-white bg-gray-200 dark:bg-[#2a2a2a]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#161616]'}`}>
                            <span className="material-symbols-outlined text-[22px]">dashboard</span>
                            แดชบอร์ด
                        </Link>
                        {user?.role === 'ADMIN' && (
                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#161616]">
                                <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
                                จัดการระบบ
                            </Link>
                        )}
                    </div>
                )}

                <UserSection collapsed={collapsed} onLogout={handleLogout} user={user} />
            </aside>
        </>
    );
}


function Logo() {
    return (
        <div className="text-gray-900 dark:text-white w-7 h-7 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" opacity="0.7" />
                <path d="M2 7V17L12 22V12L2 7Z" opacity="0.7" />
                <path d="M22 7V17L12 22V12L22 7Z" opacity="0.7" />
            </svg>
        </div>
    );
}

function SearchInput({ value, onChange, loading }: { value: string; onChange: (v: string) => void; loading?: boolean }) {
    return (
        <div className="relative">
            <input
                className="w-full bg-gray-100 dark:bg-[#161616] border border-gray-200 dark:border-[#262626] rounded-3xl text-sm px-4 py-2.5 text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all"
                placeholder="ค้นหาแชท..."
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <span className="absolute right-3 top-2.5">
                <span className={`material-symbols-outlined text-[18px] text-gray-400 ${loading ? 'animate-spin' : ''}`}>
                    {loading ? 'progress_activity' : 'search'}
                </span>
            </span>
        </div>
    );
}

function NewAgentButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full py-2 text-sm font-medium border border-gray-200 dark:border-[#262626] rounded-3xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161616] transition-colors flex items-center justify-center gap-2"
        >
            <span className="material-symbols-outlined text-[18px]">add</span>
            แชทใหม่
        </button>
    );
}

function IconButton({ icon, title, onClick }: { icon: string; title: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#161616] hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center"
            title={title}
        >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </button>
    );
}

function ConversationList({
    conversations,
    collapsed,
    currentId,
    onSelect,
    onDelete,
    onRename,
    loading,
}: {
    conversations: Agent[];
    collapsed: boolean;
    currentId?: string | null;
    onSelect?: (id: string) => void;
    onDelete?: (id: string, name: string) => void;
    onRename?: (id: string, name: string) => void;
    loading?: boolean;
}) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [displayCount, setDisplayCount] = useState(20);
    const [loadingMore, setLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const displayedConversations = conversations.slice(0, displayCount);
    const hasMore = displayCount < conversations.length;

    useEffect(() => {
        if (!loadMoreRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    setLoadingMore(true);
                    setTimeout(() => {
                        setDisplayCount(prev => prev + 20);
                        setLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, displayCount]);

    const SkeletonItem = () => (
        <div className="px-3 py-2 mb-0.5 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-3/4"></div>
        </div>
    );

    if (collapsed) {
        return (
            <div className="flex-1 overflow-y-auto py-2">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect?.(conv.id)}
                        className={`mx-2 mb-1 p-2 rounded-xl cursor-pointer flex items-center justify-center ${conv.id === currentId
                            ? 'bg-gray-200 dark:bg-[#262626]'
                            : 'hover:bg-gray-100 dark:hover:bg-[#161616]'
                            }`}
                        title={conv.name}
                    >
                        <span className="material-symbols-outlined text-[18px] text-gray-500 dark:text-gray-400">chat_bubble</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 relative">
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#F5F5F5] dark:from-[#0A0A0A] to-transparent z-10" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#F5F5F5] dark:from-[#0A0A0A] to-transparent z-10" />
            {loading ? (
                <>
                    <div className="px-3 py-3 mb-2">
                        <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="px-3 py-4 rounded-lg mb-1">
                        <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-[85%] animate-pulse"></div>
                    </div>
                    <div className="px-3 py-4 rounded-lg mb-1">
                        <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-[60%] animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    </div>
                    <div className="px-3 py-4 rounded-lg mb-1">
                        <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded w-[70%] animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </>
            ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-5">
                        <span className="material-symbols-outlined text-[40px] text-gray-300 dark:text-gray-600">
                            chat_bubble_outline
                        </span>
                    </div>
                    <p className="text-base text-gray-400 dark:text-gray-500">ยังไม่มีประวัติแชท</p>
                    <p className="text-sm text-gray-300 dark:text-gray-600 mt-2">เริ่มแชทใหม่เลย!</p>
                </div>
            ) : (
                <>
                    <div className="px-2 py-1 mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-white-600">แชตของคุณ</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    {displayedConversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => {
                                if (openMenuId !== conv.id) {
                                    onSelect?.(conv.id);
                                }
                            }}
                            className={`px-3 py-1 rounded-lg cursor-pointer mb-0 group relative transition-colors ${conv.id === currentId
                                ? 'bg-gray-300 dark:bg-[#2a2a2a]'
                                : 'hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{conv.name}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-all p-1 rounded hover:bg-gray-300 dark:hover:bg-[#333] flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[18px] leading-none">more_vert</span>
                                </button>
                            </div>
                            {/* Dropdown Menu */}
                            {openMenuId === conv.id && (
                                <div
                                    className="absolute right-2 top-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => {
                                            onRename?.(conv.id, conv.name);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262626] flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                        เปลี่ยนชื่อ
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete?.(conv.id, conv.name);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-[#262626] flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        ลบ
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Load More Indicator */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="py-3 flex justify-center">
                            {loadingMore ? (
                                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs">กำลังโหลด...</span>
                                </div>
                            ) : (
                                <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function UserSection({ collapsed, onLogout, user }: { collapsed: boolean; onLogout: () => void; user: User | null }) {
    const router = useRouter();
    const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

    const handleProfileClick = () => {
        router.push('/dashboard?tab=profile');
    };

    return (
        <div className="p-3 border-t border-gray-200 dark:border-[#262626]">
            {collapsed ? (
                <div className="flex flex-col items-center space-y-2">
                    {user ? (
                        <button onClick={handleProfileClick} title="โปรไฟล์">
                            <UserAvatar initials={initials} />
                        </button>
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                    )}
                    <IconButton icon="logout" title="ออกจากระบบ" onClick={onLogout} />
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    {user ? (
                        <button
                            onClick={handleProfileClick}
                            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#161616] transition-colors flex-1"
                        >
                            <UserAvatar initials={initials} />
                            <div className="text-left">
                                <p className="text-sm font-medium">{user.username || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'Unknown'}</p>
                            </div>
                        </button>
                    ) : (
                        <div className="flex items-center space-x-3 p-2 flex-1 animate-pulse">
                            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-800" />
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800 rounded" />
                                <div className="h-2 w-28 bg-gray-200 dark:bg-zinc-800 rounded" />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
                        title="ออกจากระบบ"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function UserAvatar({ initials }: { initials: string }) {
    return (
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {initials}
        </div>
    );
}

function DeleteConfirmModal({
    chatName,
    deleting,
    onConfirm,
    onCancel,
}: {
    chatName: string;
    deleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
            />

            {/* Modal */}
            <div
                className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-[#262626]"
                style={{ animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with icon */}
                <div className="p-6 pb-4 text-center">
                    <div
                        className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4"
                        style={{ animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
                    >
                        <span className="material-symbols-outlined text-[28px] text-red-500 dark:text-red-400">
                            delete_forever
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        ลบการสนทนา?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        คุณต้องการลบ &quot;<span className="font-medium text-gray-700 dark:text-gray-300">{chatName}</span>&quot; หรือไม่?
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        การดำเนินการนี้ไม่สามารถเลิกทำได้
                    </p>
                </div>

                {/* Actions */}
                <div className="p-4 pt-2 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-[#333] rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <span
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                    style={{ animation: 'spin 0.6s linear infinite' }}
                                />
                                กำลังลบ...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                ลบ
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.9) translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                }
                @keyframes bounceIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.5); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1); 
                    }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
