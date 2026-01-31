'use client';

import { useState, useEffect } from 'react';

interface Settings {
    id: string;
    sessionTimeoutHours: number;
    defaultModelId: string | null;
}

interface Model {
    id: string;
    name: string;
    displayName: string;
    provider: { name: string; displayName: string };
}

export function AuthSettingsTab() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(168);
    const [defaultModelId, setDefaultModelId] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setSettings(data.settings);
                    setSessionTimeout(data.settings.sessionTimeoutHours);
                    setDefaultModelId(data.settings.defaultModelId || '');
                }
                if (data.models) {
                    setModels(data.models);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionTimeoutHours: sessionTimeout }),
            });
            const data = await res.json();
            if (res.ok) {
                setSettings(data.settings);
                setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ' });
            } else {
                setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
            }
        } catch {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDefaultModel = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaultModelId: defaultModelId || null }),
            });
            const data = await res.json();
            if (res.ok) {
                setSettings(data.settings);
                setMessage({ type: 'success', text: 'บันทึก Default Model สำเร็จ' });
            } else {
                setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
            }
        } catch {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setSaving(false);
        }
    };

    const presets = [
        { label: '1 ชั่วโมง', value: 1 },
        { label: '6 ชั่วโมง', value: 6 },
        { label: '24 ชั่วโมง', value: 24 },
        { label: '3 วัน', value: 72 },
        { label: '7 วัน', value: 168 },
        { label: '30 วัน', value: 720 },
    ];

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
                <div className="h-32 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    Default Model
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    โมเดลที่จะใช้เป็นค่าเริ่มต้นเมื่อผู้ใช้เข้าใช้งาน Chat
                </p>

                {models.length === 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">warning</span>
                            ยังไม่มี Model ที่เปิดใช้งาน กรุณาเพิ่ม Model ก่อน
                        </p>
                    </div>
                ) : (
                    <>
                        <select
                            value={defaultModelId}
                            onChange={(e) => setDefaultModelId(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-900 dark:text-white mb-4"
                        >
                            <option value="">-- เลือก Model --</option>
                            {models.map((model) => (
                                <option key={model.id} value={model.name}>
                                    {model.displayName} ({model.provider.displayName})
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                ค่าปัจจุบัน: {settings?.defaultModelId ? models.find(m => m.name === settings.defaultModelId)?.displayName || settings.defaultModelId : 'ยังไม่ได้ตั้งค่า'}
                            </p>
                            <button
                                onClick={handleSaveDefaultModel}
                                disabled={saving || defaultModelId === (settings?.defaultModelId || '')}
                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </>
                )}
            </section>

            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                    ระยะเวลา Session
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    กำหนดระยะเวลาที่ผู้ใช้สามารถอยู่ในระบบได้ก่อนต้องเข้าสู่ระบบใหม่
                </p>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                    {presets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => setSessionTimeout(preset.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sessionTimeout === preset.value
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <label className="text-sm text-gray-600 dark:text-gray-400">หรือกำหนดเอง:</label>
                    <input
                        type="number"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(Math.max(1, Math.min(720, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={720}
                        className="w-24 px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-center"
                    />
                    <span className="text-sm text-gray-500">ชั่วโมง</span>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        ค่าปัจจุบัน: {settings?.sessionTimeoutHours || 168} ชั่วโมง
                        ({((settings?.sessionTimeoutHours || 168) / 24).toFixed(1)} วัน)
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving || sessionTimeout === settings?.sessionTimeoutHours}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </section>

            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    หมายเหตุ
                </h3>
                <ul className="text-sm text-gray-500 space-y-2">
                    <li>• การเปลี่ยนแปลง Session timeout จะมีผลกับการเข้าสู่ระบบครั้งถัดไป</li>
                    <li>• ผู้ใช้ที่ login อยู่แล้วจะยังคงใช้ค่า timeout เดิม</li>
                    <li>• ค่าต่ำสุดคือ 1 ชั่วโมง และสูงสุดคือ 720 ชั่วโมง (30 วัน)</li>
                </ul>
            </section>
        </div>
    );
}

