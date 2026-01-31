'use client';

import { useState, useEffect } from 'react';

interface AiSettings {
    enableLongTermMemory: boolean;
    enableUserProfileMemory: boolean;
    enableRAG: boolean;
}

export function AiSettingsTab() {
    const [settings, setSettings] = useState<AiSettings>({
        enableLongTermMemory: true,
        enableUserProfileMemory: true,
        enableRAG: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch('/api/admin/ai-settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.settings) {
                    setSettings(data.settings);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleToggle = async (key: keyof AiSettings) => {
        const newValue = !settings[key];
        setSettings((prev) => ({ ...prev, [key]: newValue }));

        setSaving(true);
        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newValue }),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error('Failed to save:', err);
            setSettings((prev) => ({ ...prev, [key]: !newValue }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
                <div className="h-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
            </div>
        );
    }

    const settingsItems = [
        {
            key: 'enableLongTermMemory' as const,
            icon: 'psychology',
            title: 'Long-term Memory',
            description: 'AI จะจดจำข้อมูลสำคัญของผู้ใช้ข้าม conversations เช่น ชื่อ อาชีพ ความชอบ',
            color: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            key: 'enableUserProfileMemory' as const,
            icon: 'person',
            title: 'User Profile Memory',
            description: 'AI จะใช้ข้อมูลโปรไฟล์ผู้ใช้ในการตอบคำถาม เช่น ชื่อผู้ใช้ อีเมล',
            color: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            key: 'enableRAG' as const,
            icon: 'search',
            title: 'RAG (Retrieval-Augmented Generation)',
            description: 'AI จะค้นหาข้อมูลจาก Knowledge Base เพื่อตอบคำถาม',
            color: 'text-amber-500',
            bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        },
    ];

    return (
        <div className="space-y-4">
            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                            AI Settings
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">ตั้งค่าความสามารถของ AI ในระบบ</p>
                    </div>
                    {saved && (
                        <div className="flex items-center gap-2 text-green-500 text-sm">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            บันทึกแล้ว
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl divide-y divide-gray-200 dark:divide-[#272726]">
                {settingsItems.map((item) => (
                    <div key={item.key} className="p-5 flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.bgColor}`}>
                            <span className={`material-symbols-outlined text-[22px] ${item.color}`}>{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium text-gray-900 dark:text-white">{item.title}</h3>
                                <button
                                    onClick={() => handleToggle(item.key)}
                                    disabled={saving}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-[#161615] ${settings[item.key] ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${settings[item.key]
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-[#2a2a2a] dark:text-gray-500'
                                    }`}>
                                    {settings[item.key] ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5">info</span>
                    <div>
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">หมายเหตุ</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                            การเปลี่ยนแปลงจะมีผลทันทีกับการสนทนาใหม่ทั้งหมด
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
