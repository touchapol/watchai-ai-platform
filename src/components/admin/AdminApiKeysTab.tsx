'use client';

import { useState, useEffect } from 'react';

interface Provider {
    name: string;
    icon: string;
    color: string;
    keyPrefix: string;
    docsUrl: string;
}

interface ApiKey {
    id: string;
    name: string;
    description: string | null;
    provider: string;
    isActive: boolean;
    priority: number;
    dailyLimit: number | null;
    dailyUsed: number;
    minuteLimit: number | null;
    minuteUsed: number;
    lastUsedAt: string | null;
    isRateLimited: boolean;
    rateLimitedAt: string | null;
    createdAt: string;
}

const PROVIDER_COLORS: Record<string, string> = {
    gemini: '#4285f4',
    openai: '#10a37f',
    claude: '#d97706',
    grok: '#1da1f2',
    deepseek: '#6366f1',
};

const PROVIDER_ICONS: Record<string, string> = {
    gemini: 'auto_awesome',
    openai: 'smart_toy',
    claude: 'psychology',
    grok: 'bolt',
    deepseek: 'explore',
};

export function AdminApiKeysTab() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [providers, setProviders] = useState<Record<string, Provider>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', apiKey: '', provider: 'gemini' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [filterProvider, setFilterProvider] = useState<string>('all');

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/api-keys');
            const data = await res.json();
            setApiKeys(data.apiKeys || []);
            setProviders(data.providers || {});
        } catch {
            console.error('Fetch API keys error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const filteredKeys = filterProvider === 'all'
        ? apiKeys
        : apiKeys.filter(k => k.provider === filterProvider);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingKey) {
                const res = await fetch(`/api/admin/api-keys/${editingKey.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description
                    })
                });
                if (!res.ok) throw new Error('Failed to update');
            } else {
                const res = await fetch('/api/admin/api-keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to create');
                }
            }
            setShowModal(false);
            setFormData({ name: '', description: '', apiKey: '', provider: 'gemini' });
            setEditingKey(null);
            fetchKeys();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบ API key นี้?')) return;
        try {
            await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
            fetchKeys();
        } catch {
            console.error('Delete error');
        }
    };

    const handleToggle = async (key: ApiKey) => {
        try {
            await fetch(`/api/admin/api-keys/${key.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !key.isActive })
            });
            fetchKeys();
        } catch {
            console.error('Toggle error');
        }
    };

    const openEditModal = (key: ApiKey) => {
        setEditingKey(key);
        setFormData({
            name: key.name,
            description: key.description || '',
            apiKey: '',
            provider: key.provider
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingKey(null);
        setFormData({ name: '', description: '', apiKey: '', provider: 'gemini' });
        setShowModal(true);
    };

    const maskKey = (key: string) => {
        if (!key) return '';
        return key.slice(0, 8) + '...' + key.slice(-4);
    };

    const getProviderInfo = (provider: string) => ({
        name: providers[provider]?.name || provider,
        icon: PROVIDER_ICONS[provider] || 'key',
        color: PROVIDER_COLORS[provider] || '#666',
        docsUrl: providers[provider]?.docsUrl || '#'
    });

    const providerCounts = apiKeys.reduce((acc, k) => {
        acc[k.provider] = (acc[k.provider] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
                    <p className="text-sm text-gray-500 mt-1">จัดการ API keys สำหรับ AI providers ต่างๆ</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchKeys}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors text-sm font-medium disabled:opacity-50"
                        title="รีเฟรช"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        เพิ่ม API Key
                    </button>
                </div>
            </div>

            {!loading && apiKeys.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilterProvider('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterProvider === 'all'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                            }`}
                    >
                        ทั้งหมด ({apiKeys.length})
                    </button>
                    {Object.keys(providers).map(p => (
                        providerCounts[p] ? (
                            <button
                                key={p}
                                onClick={() => setFilterProvider(p)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filterProvider === p
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                                    }`}
                            >
                                <span
                                    className="material-symbols-outlined text-[16px]"
                                    style={{ color: filterProvider === p ? 'currentColor' : PROVIDER_COLORS[p] }}
                                >
                                    {PROVIDER_ICONS[p]}
                                </span>
                                {providers[p]?.name} ({providerCounts[p]})
                            </button>
                        ) : null
                    ))}
                </div>
            )}

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="h-5 w-32 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-4 w-48 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredKeys.length === 0 ? (
                <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600">key_off</span>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        {filterProvider === 'all' ? 'ยังไม่มี API Key' : `ยังไม่มี ${providers[filterProvider]?.name} API Key`}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">เพิ่ม API key เพื่อเริ่มใช้งาน AI</p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        เพิ่ม API Key
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredKeys.map(key => {
                        const providerInfo = getProviderInfo(key.provider);
                        return (
                            <div
                                key={key.id}
                                className={`bg-gray-50 dark:bg-[#161615] border rounded-xl p-6 transition-all ${key.isRateLimited
                                    ? 'border-red-300 dark:border-red-900'
                                    : key.isActive
                                        ? 'border-gray-200 dark:border-[#272726]'
                                        : 'border-gray-200 dark:border-[#272726] opacity-60'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="material-symbols-outlined text-[24px]"
                                                style={{ color: providerInfo.color }}
                                            >
                                                {providerInfo.icon}
                                            </span>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {key.name}
                                                </h3>
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: providerInfo.color }}
                                                >
                                                    {providerInfo.name}
                                                </span>
                                            </div>
                                            {key.isRateLimited && (
                                                <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                                                    Rate Limited
                                                </span>
                                            )}
                                            {!key.isActive && (
                                                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                                    ปิดใช้งาน
                                                </span>
                                            )}
                                            {key.isActive && !key.isRateLimited && (
                                                <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                                    ใช้งานอยู่
                                                </span>
                                            )}
                                        </div>
                                        {key.description && (
                                            <p className="mt-2 text-sm text-gray-500">{key.description}</p>
                                        )}
                                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                            <span className="font-mono bg-gray-100 dark:bg-[#1a1a1a] px-2 py-1 rounded">
                                                {maskKey(key.id)}
                                            </span>
                                            <span>Priority: {key.priority}</span>
                                            {key.lastUsedAt && (
                                                <span>ใช้ล่าสุด: {new Date(key.lastUsedAt).toLocaleString('th-TH')}</span>
                                            )}
                                        </div>

                                        {key.dailyLimit && (
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                    <span>Daily Usage</span>
                                                    <span>{key.dailyUsed} / {key.dailyLimit}</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, (key.dailyUsed / key.dailyLimit) * 100)}%`,
                                                            backgroundColor: key.dailyUsed / key.dailyLimit > 0.9
                                                                ? '#ef4444'
                                                                : key.dailyUsed / key.dailyLimit > 0.7
                                                                    ? '#eab308'
                                                                    : providerInfo.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleToggle(key)}
                                            className={`p-2 rounded-lg transition-colors ${key.isActive
                                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                                                }`}
                                            title={key.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {key.isActive ? 'toggle_on' : 'toggle_off'}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => openEditModal(key)}
                                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                                            title="แก้ไข"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(key.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="ลบ"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#272726]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingKey ? 'แก้ไข API Key' : 'เพิ่ม API Key'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {!editingKey && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Provider
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(providers).map(([key, info]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, provider: key })}
                                                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${formData.provider === key
                                                    ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-[#2a2a2a]'
                                                    : 'border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444]'
                                                    }`}
                                            >
                                                <span
                                                    className="material-symbols-outlined text-[20px]"
                                                    style={{ color: PROVIDER_COLORS[key] }}
                                                >
                                                    {PROVIDER_ICONS[key]}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {info.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ชื่อ Key
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Production Key"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#555]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    คำอธิบาย
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., สำหรับใช้งานหลัก"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#555]"
                                />
                            </div>

                            {!editingKey && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Key
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.apiKey}
                                        onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                        required
                                        placeholder={providers[formData.provider]?.keyPrefix || 'API key...'}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-[#555] font-mono"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        ไปที่{' '}
                                        <a
                                            href={providers[formData.provider]?.docsUrl || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline"
                                        >
                                            {providers[formData.provider]?.name || formData.provider}
                                        </a>{' '}
                                        เพื่อสร้าง key
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors font-medium"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                                >
                                    {saving ? 'กำลังตรวจสอบ...' : editingKey ? 'บันทึก' : 'เพิ่ม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
