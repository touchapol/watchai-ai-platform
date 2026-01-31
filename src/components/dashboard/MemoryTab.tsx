'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Memory {
    _id: string;
    type: 'fact' | 'preference' | 'instruction' | 'context';
    content: string;
    source: 'extracted' | 'manual';
    createdAt: string;
    isActive: boolean;
}

const TYPE_LABELS: Record<Memory['type'], { label: string; icon: string; color: string }> = {
    fact: { label: 'ข้อเท็จจริง', icon: 'person', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    preference: { label: 'ความชอบ', icon: 'favorite', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    instruction: { label: 'คำสั่ง', icon: 'assignment', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    context: { label: 'บริบท', icon: 'history', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

export function MemoryTab() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newType, setNewType] = useState<Memory['type']>('fact');
    const [newContent, setNewContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const res = await fetch('/api/memories');
            const data = await res.json();
            setMemories(data.memories || []);
            setCount(data.count || 0);
        } catch {
            console.error('Failed to fetch memories');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newContent.trim()) {
            setError('กรุณากรอกข้อมูล');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: newType, content: newContent.trim() }),
            });

            if (res.ok) {
                setShowAddModal(false);
                setNewContent('');
                setNewType('fact');
                fetchMemories();
            } else {
                const data = await res.json();
                setError(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/memories?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                setDeleteId(null);
                fetchMemories();
            }
        } catch {
            console.error('Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
                <div className="h-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">psychology</span>
                            Memory Layer
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            AI จะจดจำข้อมูลเหล่านี้และใช้ในทุกการสนทนา
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        เพิ่ม Memory
                    </button>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">database</span>
                        {count} รายการ
                    </div>
                </div>
            </section>

            {memories.length === 0 ? (
                <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-4">psychology</span>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">ยังไม่มี Memory</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        เพิ่ม Memory เพื่อให้ AI จดจำข้อมูลเกี่ยวกับคุณ
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-[#333] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        เพิ่ม Memory แรก
                    </button>
                </section>
            ) : (
                <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl divide-y divide-gray-200 dark:divide-[#272726]">
                    {memories.map((memory) => {
                        const typeInfo = TYPE_LABELS[memory.type];
                        return (
                            <div key={memory._id} className="p-4 flex items-start gap-4 group">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                                    <span className="material-symbols-outlined text-[18px]">{typeInfo.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                            {typeInfo.label}
                                        </span>
                                        {memory.source === 'extracted' && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                                สกัดอัตโนมัติ
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-900 dark:text-white">{memory.content}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(memory.createdAt)}</p>
                                </div>
                                <button
                                    onClick={() => setDeleteId(memory._id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        );
                    })}
                </section>
            )}

            {mounted && showAddModal && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            เพิ่ม Memory
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">ประเภท</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(TYPE_LABELS) as Memory['type'][]).map((type) => {
                                        const info = TYPE_LABELS[type];
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setNewType(type)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${newType === type
                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                    : 'bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">{info.icon}</span>
                                                {info.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">เนื้อหา</label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="เช่น ชื่อฉันคือ สมชาย"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none"
                                />
                            </div>

                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewContent('');
                                    setError('');
                                }}
                                className="flex-1 py-3 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && deleteId && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[32px] text-red-500">delete</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ลบ Memory?</h3>
                        <p className="text-sm text-gray-500 mb-6">การลบนี้ไม่สามารถเรียกคืนได้</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'กำลังลบ...' : 'ลบ'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
