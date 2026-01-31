'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';

export function SettingsTab() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [showTokens, setShowTokens] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chat_showTokens') !== 'false';
        }
        return true;
    });

    const [logoutLoading, setLogoutLoading] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleShowTokensChange = (show: boolean) => {
        setShowTokens(show);
        localStorage.setItem('chat_showTokens', String(show));
        fetch('/api/logs/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'SETTINGS_UPDATE',
                resource: '/dashboard/settings',
                details: { setting: 'showTokens', value: show }
            })
        }).catch(() => { });
    };

    const handleLogoutAll = async () => {
        setLogoutLoading(true);
        try {
            await fetch('/api/logs/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'LOGOUT_ALL', resource: '/dashboard/settings' })
            });
            const res = await fetch('/api/auth/logout-all', { method: 'POST' });
            if (res.ok) {
                window.location.href = '/login';
            }
        } catch {
            alert('เกิดข้อผิดพลาด');
        } finally {
            setLogoutLoading(false);
            setShowLogoutModal(false);
        }
    };

    return (
        <div className="space-y-8">

            {/* Appearance Section */}
            <section className="bg-white dark:bg-[#161616] rounded-xl border border-gray-200 dark:border-[#262626] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">palette</span>
                    ธีมและการแสดงผล
                </h2>
                <div className="space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">โหมดมืด</p>
                            <p className="text-xs text-gray-500">เปลี่ยนธีมระหว่าง Light และ Dark</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-5' : ''}`}>
                                <span className="material-symbols-outlined text-gray-600" style={{ fontSize: '14px' }}>
                                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                </span>
                            </span>
                        </button>
                    </div>



                    {/* Show Tokens */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">แสดง Token</p>
                            <p className="text-xs text-gray-500">แสดงจำนวน Token ที่ใช้ในแต่ละข้อความ</p>
                        </div>
                        <button
                            onClick={() => handleShowTokensChange(!showTokens)}
                            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${showTokens ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${showTokens ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="bg-white dark:bg-[#161616] rounded-xl border border-gray-200 dark:border-[#262626] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">security</span>
                    ความปลอดภัย
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">ออกจากระบบทุกอุปกรณ์</p>
                        <p className="text-xs text-gray-500">ออกจากระบบจากทุกอุปกรณ์ที่เข้าสู่ระบบอยู่</p>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        disabled={logoutLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        ออกจากระบบทั้งหมด
                    </button>
                </div>
            </section>

            {mounted && showLogoutModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
                    <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-[scaleIn_0.2s_ease-out]">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <span className="material-symbols-outlined text-[24px] text-red-600 dark:text-red-400">logout</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                            ออกจากระบบทุกอุปกรณ์?
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-5">
                            การดำเนินการนี้จะออกจากระบบทุกอุปกรณ์ที่เชื่อมต่ออยู่ รวมถึงอุปกรณ์นี้ด้วย คุณจะต้องเข้าสู่ระบบใหม่
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleLogoutAll}
                                disabled={logoutLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {logoutLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        ยืนยัน
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
