'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiOpenaiFill, RiClaudeFill } from 'react-icons/ri';
import { SiGooglegemini } from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';
import { DeepSeek } from '@lobehub/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AiModel {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    isActive: boolean;
}

interface ApiKeyInfo {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    dailyUsed: number;
    dailyLimit: number | null;
    minuteLimit: number | null;
    minuteUsed: number;
    dailyTokenLimit: number | null;
    dailyTokenUsed: number;
    minuteTokenLimit: number | null;
    minuteTokenUsed: number;
    isRateLimited: boolean;
    maskedKey?: string;
    createdAt: string;
    lastUsedAt?: string;
}

interface Provider {
    id: string;
    name: string;
    displayName: string;
    icon: string;
    color: string;
    docsUrl: string | null;
    isActive: boolean;
    priority: number;
    apiKeys: ApiKeyInfo[];
    models: AiModel[];
    _count: { apiKeys: number; models: number };
}

const getProviderIcon = (name: string, size = 24) => {
    const icons: Record<string, React.ReactNode> = {
        gemini: <SiGooglegemini size={size} />,
        openai: <RiOpenaiFill size={size} />,
        anthropic: <RiClaudeFill size={size} />,
        xai: <FaXTwitter size={size} className="dark:text-white text-black" />,
        deepseek: <DeepSeek.Color size={size} />,
    };
    return icons[name] || <span className="font-bold">{name[0].toUpperCase()}</span>;
};

const PRESET_PROVIDERS = [
    {
        name: 'gemini',
        displayName: 'Google Gemini',
        color: '#4285f4',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        models: ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-pro-preview-05-06', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
    },
    {
        name: 'openai',
        displayName: 'OpenAI',
        color: '#10a37f',
        docsUrl: 'https://platform.openai.com/api-keys',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    {
        name: 'anthropic',
        displayName: 'Claude (Anthropic)',
        color: '#d97706',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        models: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
    },
    {
        name: 'xai',
        displayName: 'xAI Grok',
        color: '#000000',
        docsUrl: 'https://console.x.ai/',
        models: ['grok-3', 'grok-3-mini', 'grok-2', 'grok-2-mini']
    },
    {
        name: 'deepseek',
        displayName: 'DeepSeek',
        color: '#6366f1',
        docsUrl: 'https://platform.deepseek.com/api_keys',
        models: ['deepseek-chat', 'deepseek-reasoner']
    },
];

export function AdminProvidersTab() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'models'>('overview');
    const [showAddKeyModal, setShowAddKeyModal] = useState(false);
    const [showEditKeyModal, setShowEditKeyModal] = useState(false);
    const [showAddModelModal, setShowAddModelModal] = useState(false);
    const [showEditModelModal, setShowEditModelModal] = useState(false);
    const [showAddProviderModal, setShowAddProviderModal] = useState(false);
    const [keyForm, setKeyForm] = useState({ name: '', description: '', apiKey: '', dailyLimit: '', minuteLimit: '', dailyTokenLimit: '', minuteTokenLimit: '' });
    const [editKeyForm, setEditKeyForm] = useState<{ id: string; name: string; dailyLimit: string; minuteLimit: string; dailyTokenLimit: string; minuteTokenLimit: string }>({ id: '', name: '', dailyLimit: '', minuteLimit: '', dailyTokenLimit: '', minuteTokenLimit: '' });
    const [modelForm, setModelForm] = useState({ name: '', displayName: '', description: '' });
    const [editModelForm, setEditModelForm] = useState<{ id: string; name: string; displayName: string; description: string }>({ id: '', name: '', displayName: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [addingProvider, setAddingProvider] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning';
        onConfirm: () => void;
    }>({ show: false, title: '', message: '', type: 'danger', onConfirm: () => { } });
    const [confirming, setConfirming] = useState(false);
    const [keysPage, setKeysPage] = useState(1);
    const KEYS_PER_PAGE = 5;

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'danger') => {
        setConfirmModal({ show: true, title, message, type, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmModal({ ...confirmModal, show: false });
        setConfirming(false);
    };

    const handleConfirm = async () => {
        setConfirming(true);
        await confirmModal.onConfirm();
        setConfirming(false);
    };

    const fetchProviders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/providers');
            const data = await res.json();
            setProviders(data.providers || []);
        } catch {
            console.error('Fetch providers error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleQuickAddProvider = async (preset: typeof PRESET_PROVIDERS[0]) => {
        setAddingProvider(preset.name);
        try {
            const res = await fetch('/api/admin/providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: preset.name,
                    displayName: preset.displayName,
                    icon: 'smart_toy',
                    color: preset.color,
                    docsUrl: preset.docsUrl,
                    models: preset.models.map(m => ({ name: m, displayName: m }))
                })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed');
            }
            setShowAddProviderModal(false);
            fetchProviders();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setAddingProvider(null);
        }
    };

    const existingProviderNames = providers.map(p => p.name);

    const handleToggleProvider = async (provider: Provider) => {
        try {
            await fetch(`/api/admin/providers/${provider.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !provider.isActive })
            });
            fetchProviders();
        } catch {
            console.error('Toggle error');
        }
    };

    const handleToggleKey = async (keyId: string) => {
        if (!selectedProvider) return;
        const key = selectedProvider.apiKeys.find(k => k.id === keyId);
        if (!key) return;
        try {
            await fetch(`/api/admin/api-keys/${keyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !key.isActive })
            });
            fetchProviders();
        } catch {
            console.error('Toggle key error');
        }
    };

    const handleDeleteProvider = (id: string, name: string) => {
        showConfirm(
            'ลบ Provider',
            `ต้องการลบ "${name}"? API Keys และ Models ที่เกี่ยวข้องจะถูกลบด้วย`,
            async () => {
                try {
                    await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
                    fetchProviders();
                } catch {
                    console.error('Delete error');
                }
                closeConfirm();
            }
        );
    };

    const handleEditKey = (key: ApiKeyInfo) => {
        setEditKeyForm({
            id: key.id,
            name: key.name,
            dailyLimit: key.dailyLimit?.toString() || '',
            minuteLimit: key.minuteLimit?.toString() || '',
            dailyTokenLimit: key.dailyTokenLimit?.toString() || '',
            minuteTokenLimit: key.minuteTokenLimit?.toString() || '',
        });
        setShowEditKeyModal(true);
    };

    const handleSaveEditKey = async () => {
        if (!editKeyForm.id) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/api-keys/${editKeyForm.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editKeyForm.name,
                    dailyLimit: editKeyForm.dailyLimit ? parseInt(editKeyForm.dailyLimit) : null,
                    minuteLimit: editKeyForm.minuteLimit ? parseInt(editKeyForm.minuteLimit) : null,
                    dailyTokenLimit: editKeyForm.dailyTokenLimit ? parseInt(editKeyForm.dailyTokenLimit) : null,
                    minuteTokenLimit: editKeyForm.minuteTokenLimit ? parseInt(editKeyForm.minuteTokenLimit) : null,
                })
            });
            if (!res.ok) throw new Error('Failed to update');
            setShowEditKeyModal(false);
            fetchProviders();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSaving(false);
        }
    };

    const openProviderDetail = (provider: Provider) => {
        setSelectedProvider(provider);
        setViewMode('detail');
        setActiveTab('keys');
    };

    const handleAddKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProvider) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/providers/${selectedProvider.id}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keyForm)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed');
            }
            setShowAddKeyModal(false);
            setKeyForm({ name: '', description: '', apiKey: '', dailyLimit: '', minuteLimit: '', dailyTokenLimit: '', minuteTokenLimit: '' });
            fetchProviders();
            const updated = providers.find(p => p.id === selectedProvider.id);
            if (updated) setSelectedProvider(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteKey = (keyId: string, keyName: string) => {
        if (!selectedProvider) return;
        showConfirm(
            'ลบ API Key',
            `ต้องการลบ API Key "${keyName}"?`,
            async () => {
                try {
                    await fetch(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
                    fetchProviders();
                } catch {
                    console.error('Delete key error');
                }
                closeConfirm();
            },
            'warning'
        );
    };

    const handleToggleModel = async (model: AiModel) => {
        if (!selectedProvider) return;
        try {
            await fetch(`/api/admin/providers/${selectedProvider.id}/models`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId: model.id, isActive: !model.isActive })
            });
            fetchProviders();
        } catch {
            console.error('Toggle model error');
        }
    };

    const handleAddModel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProvider) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/providers/${selectedProvider.id}/models`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modelForm)
            });
            if (!res.ok) throw new Error('Failed');
            setShowAddModelModal(false);
            setModelForm({ name: '', displayName: '', description: '' });
            fetchProviders();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteModel = (modelId: string, modelName: string) => {
        if (!selectedProvider) return;
        showConfirm(
            'ลบ Model',
            `ต้องการลบ Model "${modelName}"?`,
            async () => {
                try {
                    await fetch(`/api/admin/providers/${selectedProvider.id}/models?modelId=${modelId}`, {
                        method: 'DELETE'
                    });
                    fetchProviders();
                } catch {
                    console.error('Delete model error');
                }
                closeConfirm();
            },
            'warning'
        );
    };

    const currentProvider = providers.find(p => p.id === selectedProvider?.id);

    return (
        <div className="space-y-6">
            {viewMode === 'list' && (
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ผู้ให้บริการ AI</h2>
                        <p className="text-sm text-gray-500 mt-1">จัดการ Provider และ Models</p>
                    </div>
                    <button
                        onClick={() => setShowAddProviderModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        เพิ่ม Provider
                    </button>
                </div>
            )}

            {viewMode === 'list' && (
                loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6 animate-pulse">
                                <div className="h-10 w-10 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg mb-4" />
                                <div className="h-5 w-24 bg-gray-200 dark:bg-[#2a2a2a] rounded mb-2" />
                                <div className="h-4 w-32 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                            </div>
                        ))}
                    </div>
                ) : providers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-2xl border-dashed">
                        <div
                            className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center"
                            style={{ animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
                        >
                            <span className="material-symbols-outlined text-[40px] text-gray-600 dark:text-gray-300">
                                psychology
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            ยังไม่มี AI Provider
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                            เริ่มต้นเพิ่ม AI Provider เพื่อใช้งาน AI Models ต่างๆ<br />
                            เช่น Gemini, OpenAI, Claude และอื่นๆ
                        </p>
                        <button
                            onClick={() => setShowAddProviderModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 font-medium shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            เพิ่ม Provider ตัวแรก
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {providers.map((provider, index) => (
                            <div
                                key={provider.id}
                                className={`bg-gray-50 dark:bg-[#161615] border rounded-xl p-6 transition-all hover:shadow-lg hover:scale-[1.02] ${provider.isActive
                                    ? 'border-gray-200 dark:border-[#272726]'
                                    : 'border-gray-200 dark:border-[#272726] opacity-50'
                                    }`}
                                style={{ animation: `scaleIn 0.3s ease-out ${index * 0.05}s both` }}
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                                    >
                                        {getProviderIcon(provider.name, 28)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleProvider(provider)}
                                            className={`p-1.5 rounded-lg transition-colors ${provider.isActive
                                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {provider.isActive ? 'toggle_on' : 'toggle_off'}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProvider(provider.id, provider.displayName)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>

                                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                                    {provider.displayName}
                                </h3>

                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">key</span>
                                        {provider._count.apiKeys} keys
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">model_training</span>
                                        {provider._count.models} models
                                    </span>
                                </div>

                                <button
                                    onClick={() => openProviderDetail(provider)}
                                    className="mt-4 w-full px-4 py-2 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-sm font-medium"
                                >
                                    จัดการ
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {viewMode === 'detail' && currentProvider && (
                <div className="space-y-6" style={{ animation: 'slideInRight 0.35s ease-out' }}>
                    <div className="flex items-center gap-4" style={{ animation: 'fadeInUp 0.4s ease-out 0.1s both' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${currentProvider.color}20`, color: currentProvider.color }}
                        >
                            {getProviderIcon(currentProvider.name, 28)}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {currentProvider.displayName}
                            </h3>
                            <p className="text-sm text-gray-500">{currentProvider.name}</p>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-200 dark:border-[#272726]" style={{ animation: 'fadeInUp 0.4s ease-out 0.15s both' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'overview'
                                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('keys')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'keys'
                                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            API Keys ({currentProvider.apiKeys.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('models')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'models'
                                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Models ({currentProvider.models.length})
                        </button>
                    </div>

                    <div style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
                        {activeTab === 'overview' && currentProvider && (() => {
                            const totalKeys = currentProvider.apiKeys.length;
                            const activeKeys = currentProvider.apiKeys.filter(k => k.isActive && !k.isRateLimited).length;
                            const rateLimitedKeys = currentProvider.apiKeys.filter(k => k.isRateLimited).length;
                            const totalDailyUsed = currentProvider.apiKeys.reduce((sum, k) => sum + (k.dailyUsed || 0), 0);
                            const totalDailyLimit = currentProvider.apiKeys.reduce((sum, k) => sum + (k.dailyLimit || 0), 0);
                            const totalMinuteUsed = currentProvider.apiKeys.reduce((sum, k) => sum + (k.minuteUsed || 0), 0);
                            const totalMinuteLimit = currentProvider.apiKeys.reduce((sum, k) => sum + (k.minuteLimit || 0), 0);
                            const totalTokenUsed = currentProvider.apiKeys.reduce((sum, k) => sum + (k.dailyTokenUsed || 0), 0);
                            const totalTokenLimit = currentProvider.apiKeys.reduce((sum, k) => sum + (k.dailyTokenLimit || 0), 0);
                            const totalMinuteTokenUsed = currentProvider.apiKeys.reduce((sum, k) => sum + (k.minuteTokenUsed || 0), 0);
                            const totalMinuteTokenLimit = currentProvider.apiKeys.reduce((sum, k) => sum + (k.minuteTokenLimit || 0), 0);
                            const rpdPercent = totalDailyLimit > 0 ? Math.min(100, (totalDailyUsed / totalDailyLimit) * 100) : 0;
                            const rpmPercent = totalMinuteLimit > 0 ? Math.min(100, (totalMinuteUsed / totalMinuteLimit) * 100) : 0;
                            const tpdPercent = totalTokenLimit > 0 ? Math.min(100, (totalTokenUsed / totalTokenLimit) * 100) : 0;
                            const tpmPercent = totalMinuteTokenLimit > 0 ? Math.min(100, (totalMinuteTokenUsed / totalMinuteTokenLimit) * 100) : 0;

                            return (
                                <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalKeys}</div>
                                            <div className="text-xs text-gray-500">API Keys ทั้งหมด</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                                            <div className="text-2xl font-bold text-green-600">{activeKeys}</div>
                                            <div className="text-xs text-gray-500">พร้อมใช้งาน</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                                            <div className="text-2xl font-bold text-red-500">{rateLimitedKeys}</div>
                                            <div className="text-xs text-gray-500">ถูกจำกัด</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentProvider.models.length}</div>
                                            <div className="text-xs text-gray-500">Models</div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4 space-y-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">การใช้งานรวมวันนี้</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">RPD (Requests Per Day)</span>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {totalDailyUsed.toLocaleString()} / {totalDailyLimit > 0 ? totalDailyLimit.toLocaleString() : '∞'}
                                                        {totalDailyLimit > 0 && <span className="text-gray-400 ml-1">(เหลือ {(totalDailyLimit - totalDailyUsed).toLocaleString()})</span>}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${rpdPercent > 80 ? 'bg-red-500' : rpdPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${rpdPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">RPM (Requests Per Minute)</span>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {totalMinuteUsed.toLocaleString()} / {totalMinuteLimit > 0 ? totalMinuteLimit.toLocaleString() : '∞'}
                                                        {totalMinuteLimit > 0 && <span className="text-gray-400 ml-1">(เหลือ {(totalMinuteLimit - totalMinuteUsed).toLocaleString()})</span>}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${rpmPercent > 80 ? 'bg-red-500' : rpmPercent > 50 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                                                        style={{ width: `${rpmPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">TPD (Tokens Per Day)</span>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {totalTokenUsed.toLocaleString()} / {totalTokenLimit > 0 ? totalTokenLimit.toLocaleString() : '∞'}
                                                        {totalTokenLimit > 0 && <span className="text-gray-400 ml-1">(เหลือ {(totalTokenLimit - totalTokenUsed).toLocaleString()})</span>}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${tpdPercent > 80 ? 'bg-red-500' : tpdPercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${tpdPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">TPM (Tokens Per Minute)</span>
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {totalMinuteTokenUsed.toLocaleString()} / {totalMinuteTokenLimit > 0 ? totalMinuteTokenLimit.toLocaleString() : '∞'}
                                                        {totalMinuteTokenLimit > 0 && <span className="text-gray-400 ml-1">(เหลือ {(totalMinuteTokenLimit - totalMinuteTokenUsed).toLocaleString()})</span>}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${tpmPercent > 80 ? 'bg-red-500' : tpmPercent > 50 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                                                        style={{ width: `${tpmPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-4">สัดส่วนการใช้งาน</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { name: 'RPD', used: totalDailyUsed, limit: totalDailyLimit, color: '#22c55e' },
                                                { name: 'RPM', used: totalMinuteUsed, limit: totalMinuteLimit, color: '#06b6d4' },
                                                { name: 'TPD', used: totalTokenUsed, limit: totalTokenLimit, color: '#3b82f6' },
                                                { name: 'TPM', used: totalMinuteTokenUsed, limit: totalMinuteTokenLimit, color: '#a855f7' },
                                            ].map((item) => {
                                                const remaining = item.limit > 0 ? item.limit - item.used : 0;
                                                const chartData = item.limit > 0
                                                    ? [{ name: 'ใช้แล้ว', value: item.used }, { name: 'เหลือ', value: remaining }]
                                                    : [{ name: 'ใช้แล้ว', value: item.used || 1 }];
                                                const percent = item.limit > 0 ? Math.round((item.used / item.limit) * 100) : 0;
                                                return (
                                                    <div key={item.name} className="flex flex-col items-center">
                                                        <div className="w-20 h-20 relative">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={chartData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={22}
                                                                        outerRadius={35}
                                                                        paddingAngle={2}
                                                                        dataKey="value"
                                                                        startAngle={90}
                                                                        endAngle={-270}
                                                                    >
                                                                        <Cell fill={item.color} />
                                                                        {chartData.length > 1 && <Cell fill="#374151" />}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                                                                        itemStyle={{ color: '#fff' }}
                                                                        formatter={(value: number) => value.toLocaleString()}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                    {item.limit > 0 ? `${percent}%` : '∞'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{item.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab === 'keys' && (
                            <div className="space-y-3" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <button
                                    onClick={() => setShowAddKeyModal(true)}
                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-[#333] text-gray-500 rounded-xl hover:border-gray-400 dark:hover:border-[#444] hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    เพิ่ม API Key
                                </button>

                                {currentProvider.apiKeys.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        ยังไม่มี API Key
                                    </div>
                                ) : (
                                    currentProvider.apiKeys.slice((keysPage - 1) * KEYS_PER_PAGE, keysPage * KEYS_PER_PAGE).map(key => {
                                        const rpdPercent = key.dailyLimit ? Math.min(100, ((key.dailyUsed || 0) / key.dailyLimit) * 100) : 0;
                                        return (
                                            <div key={key.id} className={`bg-gray-50 dark:bg-[#161615] border rounded-xl p-4 ${key.isRateLimited ? 'border-red-300 dark:border-red-800' : key.isActive ? 'border-gray-200 dark:border-[#272726]' : 'border-gray-200 dark:border-[#272726] opacity-50'}`}>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${key.isRateLimited ? 'bg-red-500' : key.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                                <h4 className="font-medium text-gray-900 dark:text-white text-base">{key.name}</h4>
                                                            </div>
                                                            {key.maskedKey && (
                                                                <code className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#1e1e1d] px-2 py-1 rounded font-mono">
                                                                    {key.maskedKey}
                                                                </code>
                                                            )}
                                                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-gray-400">RPD</span>
                                                                    <span className="font-medium">{(key.dailyUsed || 0).toLocaleString()}/{key.dailyLimit?.toLocaleString() || '∞'}</span>
                                                                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full transition-all ${rpdPercent > 80 ? 'bg-red-500' : rpdPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${rpdPercent}%` }} />
                                                                    </div>
                                                                </div>
                                                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                                                                <span><span className="text-gray-400">RPM</span> {key.minuteLimit?.toLocaleString() || '∞'}</span>
                                                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                                                                <span><span className="text-gray-400">TPM</span> {key.minuteTokenLimit?.toLocaleString() || '∞'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <div className="relative group">
                                                            <button
                                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                                title="ข้อมูลเพิ่มเติม"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">info</span>
                                                            </button>
                                                            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#1e1e1d] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                                <div className="space-y-2 text-xs">
                                                                    {key.description && (
                                                                        <div>
                                                                            <span className="text-gray-400">คำอธิบาย:</span>
                                                                            <p className="text-gray-700 dark:text-gray-300">{key.description}</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">สร้างเมื่อ:</span>
                                                                        <span className="text-gray-700 dark:text-gray-300">{new Date(key.createdAt).toLocaleString('th-TH')}</span>
                                                                    </div>
                                                                    {key.lastUsedAt && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-400">ใช้ล่าสุด:</span>
                                                                            <span className="text-gray-700 dark:text-gray-300">{new Date(key.lastUsedAt).toLocaleString('th-TH')}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">TPD:</span>
                                                                        <span className="text-gray-700 dark:text-gray-300">{(key.dailyTokenUsed || 0).toLocaleString()}/{key.dailyTokenLimit?.toLocaleString() || '∞'}</span>
                                                                    </div>
                                                                    {!key.description && !key.lastUsedAt && (
                                                                        <p className="text-gray-400 italic">ไม่มีข้อมูลเพิ่มเติม</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEditKey(key)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleKey(key.id)}
                                                            className={`p-2 rounded-lg transition-colors ${key.isActive ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
                                                            title={key.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                {key.isActive ? 'toggle_on' : 'toggle_off'}
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteKey(key.id, key.name)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                {currentProvider.apiKeys.length > KEYS_PER_PAGE && (
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs text-gray-500">
                                            แสดง {Math.min(keysPage * KEYS_PER_PAGE, currentProvider.apiKeys.length)} จาก {currentProvider.apiKeys.length} รายการ
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setKeysPage(p => Math.max(1, p - 1))}
                                                disabled={keysPage === 1}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                            </button>
                                            <span className="text-xs text-gray-500 px-2">
                                                {keysPage} / {Math.ceil(currentProvider.apiKeys.length / KEYS_PER_PAGE)}
                                            </span>
                                            <button
                                                onClick={() => setKeysPage(p => Math.min(Math.ceil(currentProvider.apiKeys.length / KEYS_PER_PAGE), p + 1))}
                                                disabled={keysPage >= Math.ceil(currentProvider.apiKeys.length / KEYS_PER_PAGE)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'models' && (
                            <div className="space-y-3" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <button
                                    onClick={() => setShowAddModelModal(true)}
                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-[#333] text-gray-500 rounded-xl hover:border-gray-400 dark:hover:border-[#444] hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    เพิ่ม Model
                                </button>

                                {currentProvider.models.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        ยังไม่มี Model
                                    </div>
                                ) : (
                                    currentProvider.models.map(model => (
                                        <div key={model.id} className={`bg-gray-50 dark:bg-[#161615] border rounded-xl p-4 ${model.isActive ? 'border-gray-200 dark:border-[#272726]' : 'border-gray-200 dark:border-[#272726] opacity-50'}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{model.displayName}</h4>
                                                        {!model.isActive && (
                                                            <span className="px-1.5 py-0.5 text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">ปิด</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{model.name}</p>
                                                    {model.description && (
                                                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{model.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditModelForm({
                                                                id: model.id,
                                                                name: model.name,
                                                                displayName: model.displayName,
                                                                description: model.description || ''
                                                            });
                                                            setShowEditModelModal(true);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleModel(model)}
                                                        className={`p-1.5 rounded-lg transition-colors ${model.isActive
                                                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {model.isActive ? 'toggle_on' : 'toggle_off'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteModel(model.id, model.displayName || model.name)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAddKeyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#272726]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">เพิ่ม API Key</h3>
                            <button onClick={() => setShowAddKeyModal(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddKey} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ Key</label>
                                <input type="text" value={keyForm.name} onChange={e => setKeyForm({ ...keyForm, name: e.target.value })} required placeholder="Production Key" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label>
                                <input type="text" value={keyForm.description} onChange={e => setKeyForm({ ...keyForm, description: e.target.value })} placeholder="สำหรับใช้งานหลัก" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                                <input type="password" value={keyForm.apiKey} onChange={e => setKeyForm({ ...keyForm, apiKey: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white font-mono" />
                                {currentProvider?.docsUrl && (
                                    <p className="mt-1 text-xs text-gray-500">ดู <a href={currentProvider.docsUrl} target="_blank" className="underline">เอกสาร</a></p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate Limits (ไม่บังคับ)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" value={keyForm.dailyLimit} onChange={e => setKeyForm({ ...keyForm, dailyLimit: e.target.value })} placeholder="RPD (ครั้ง/วัน)" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white text-sm" />
                                    <input type="number" value={keyForm.minuteLimit} onChange={e => setKeyForm({ ...keyForm, minuteLimit: e.target.value })} placeholder="RPM (ครั้ง/นาที)" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white text-sm" />
                                    <input type="number" value={keyForm.dailyTokenLimit} onChange={e => setKeyForm({ ...keyForm, dailyTokenLimit: e.target.value })} placeholder="TPD (tokens/วัน)" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white text-sm" />
                                    <input type="number" value={keyForm.minuteTokenLimit} onChange={e => setKeyForm({ ...keyForm, minuteTokenLimit: e.target.value })} placeholder="TPM (tokens/นาที)" className="w-full px-3 py-2 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white text-sm" />
                                </div>
                                <p className="mt-1 text-xs text-gray-400">ถ้าไม่กรอกจะใช้ค่าเริ่มต้น</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddKeyModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] font-medium">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'เพิ่ม'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddModelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#272726]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">เพิ่ม Model</h3>
                            <button onClick={() => setShowAddModelModal(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddModel} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model ID</label>
                                <input type="text" value={modelForm.name} onChange={e => setModelForm({ ...modelForm, name: e.target.value })} required placeholder="gpt-4o" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อแสดง</label>
                                <input type="text" value={modelForm.displayName} onChange={e => setModelForm({ ...modelForm, displayName: e.target.value })} required placeholder="GPT-4o" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label>
                                <input type="text" value={modelForm.description} onChange={e => setModelForm({ ...modelForm, description: e.target.value })} placeholder="โมเดลล่าสุด" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModelModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] font-medium">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'เพิ่ม'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#272726]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">แก้ไข Model</h3>
                            <button onClick={() => setShowEditModelModal(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setSaving(true);
                            setError('');
                            try {
                                const res = await fetch(`/api/admin/models/${editModelForm.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: editModelForm.name,
                                        displayName: editModelForm.displayName,
                                        description: editModelForm.description
                                    })
                                });
                                if (!res.ok) throw new Error('Failed to update model');
                                await fetchProviders();
                                setShowEditModelModal(false);
                            } catch {
                                setError('ไม่สามารถแก้ไข Model ได้');
                            } finally {
                                setSaving(false);
                            }
                        }} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model ID</label>
                                <input type="text" value={editModelForm.name} onChange={e => setEditModelForm({ ...editModelForm, name: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อแสดง</label>
                                <input type="text" value={editModelForm.displayName} onChange={e => setEditModelForm({ ...editModelForm, displayName: e.target.value })} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">คำอธิบาย</label>
                                <input type="text" value={editModelForm.description} onChange={e => setEditModelForm({ ...editModelForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModelModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] font-medium">ยกเลิก</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddProviderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#272726]">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">เพิ่ม AI Provider</h3>
                                <p className="text-sm text-gray-500 mt-0.5">เลือก Provider ที่ต้องการเพิ่ม</p>
                            </div>
                            <button onClick={() => { setShowAddProviderModal(false); setError(''); }} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            {error && <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}
                            <div className="grid grid-cols-2 gap-3">
                                {PRESET_PROVIDERS.map(preset => {
                                    const exists = existingProviderNames.includes(preset.name);
                                    const isAdding = addingProvider === preset.name;
                                    const isAvailable = preset.name === 'gemini' || preset.name === 'openai';
                                    const isDisabled = exists || isAdding || !isAvailable;
                                    return (
                                        <button
                                            key={preset.name}
                                            onClick={() => !isDisabled && handleQuickAddProvider(preset)}
                                            disabled={isDisabled}
                                            className={`p-4 rounded-xl border text-left transition-all ${isDisabled
                                                ? 'border-gray-200 dark:border-[#272726] opacity-50 cursor-not-allowed'
                                                : 'border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#555] hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: `${preset.color}15`,
                                                        color: preset.color
                                                    }}
                                                >
                                                    {getProviderIcon(preset.name, 22)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                        {preset.displayName}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {isAdding ? 'กำลังเพิ่ม...' : exists ? 'เพิ่มแล้ว' : !isAvailable ? 'เร็วๆนี้' : `${preset.models.length} models`}
                                                    </p>
                                                </div>
                                                {exists && (
                                                    <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                                )}
                                                {!isAvailable && !exists && (
                                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">schedule</span>
                                                )}
                                                {isAdding && (
                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.show && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                    onClick={!confirming ? closeConfirm : undefined}
                >
                    <div
                        className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-sm mx-4 shadow-2xl"
                        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"
                                style={{ animation: 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.1s both' }}
                            >
                                <span className="material-symbols-outlined text-[32px] text-red-500">
                                    delete_forever
                                </span>
                            </div>
                            <h3
                                className="text-xl font-bold text-gray-900 dark:text-white mb-2"
                                style={{ animation: 'fadeInUp 0.3s ease-out 0.15s both' }}
                            >
                                {confirmModal.title}
                            </h3>
                            <p
                                className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed"
                                style={{ animation: 'fadeInUp 0.3s ease-out 0.2s both' }}
                            >
                                {confirmModal.message}
                            </p>
                            <div
                                className="flex gap-3"
                                style={{ animation: 'fadeInUp 0.3s ease-out 0.25s both' }}
                            >
                                <button
                                    onClick={closeConfirm}
                                    disabled={confirming}
                                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] font-medium transition-all disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={confirming}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium transition-all bg-red-500 hover:bg-red-600 text-white disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {confirming ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            กำลังลบ...
                                        </>
                                    ) : (
                                        'ลบ'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showEditKeyModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                    onClick={() => setShowEditKeyModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 shadow-2xl"
                        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                แก้ไข API Key
                            </h3>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ</label>
                                    <input
                                        type="text"
                                        value={editKeyForm.name}
                                        onChange={(e) => setEditKeyForm({ ...editKeyForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1e1e1d] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RPD (ครั้ง/วัน)</label>
                                        <input
                                            type="number"
                                            value={editKeyForm.dailyLimit}
                                            onChange={(e) => setEditKeyForm({ ...editKeyForm, dailyLimit: e.target.value })}
                                            placeholder="∞"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1e1e1d] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RPM (ครั้ง/นาที)</label>
                                        <input
                                            type="number"
                                            value={editKeyForm.minuteLimit}
                                            onChange={(e) => setEditKeyForm({ ...editKeyForm, minuteLimit: e.target.value })}
                                            placeholder="∞"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1e1e1d] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">TPD (tokens/วัน)</label>
                                        <input
                                            type="number"
                                            value={editKeyForm.dailyTokenLimit}
                                            onChange={(e) => setEditKeyForm({ ...editKeyForm, dailyTokenLimit: e.target.value })}
                                            placeholder="∞"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1e1e1d] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">TPM (tokens/นาที)</label>
                                        <input
                                            type="number"
                                            value={editKeyForm.minuteTokenLimit}
                                            onChange={(e) => setEditKeyForm({ ...editKeyForm, minuteTokenLimit: e.target.value })}
                                            placeholder="∞"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#1e1e1d] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowEditKeyModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a2a] font-medium transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleSaveEditKey}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                                >
                                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
