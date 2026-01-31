'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

export function ProfileTab() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState<1 | 2 | 3>(1);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetch('/api/auth/me').then(res => res.json())
            .then((authData) => {
                if (authData.user) {
                    setUser(authData.user);
                }
                setLoading(false);
            }).catch(() => setLoading(false));

        fetch('/api/logs/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'VIEW_PROFILE', resource: '/dashboard/profile' })
        }).catch(() => { });
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const resetPasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordStep(1);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordSuccess(false);
    };

    const handleNextStep = async () => {
        setPasswordError('');

        if (passwordStep === 1) {
            if (!currentPassword) {
                setPasswordError('กรุณากรอกรหัสผ่านปัจจุบัน');
                return;
            }
            setPasswordStep(2);
        } else if (passwordStep === 2) {
            if (!newPassword) {
                setPasswordError('กรุณากรอกรหัสผ่านใหม่');
                return;
            }
            if (newPassword.length < 6) {
                setPasswordError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
                return;
            }
            setPasswordStep(3);
        } else if (passwordStep === 3) {
            if (!confirmPassword) {
                setPasswordError('กรุณายืนยันรหัสผ่านใหม่');
                return;
            }
            if (newPassword !== confirmPassword) {
                setPasswordError('รหัสผ่านใหม่ไม่ตรงกัน');
                return;
            }

            setSaving(true);
            try {
                const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();

                if (res.ok) {
                    setPasswordSuccess(true);
                } else {
                    setPasswordError(data.error || 'เกิดข้อผิดพลาด');
                }
            } catch {
                setPasswordError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            } finally {
                setSaving(false);
            }
        }
    };

    const getStepTitle = () => {
        if (passwordSuccess) return 'สำเร็จ';
        switch (passwordStep) {
            case 1: return 'ขั้นตอนที่ 1/3';
            case 2: return 'ขั้นตอนที่ 2/3';
            case 3: return 'ขั้นตอนที่ 3/3';
        }
    };

    const getStepDescription = () => {
        if (passwordSuccess) return 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว';
        switch (passwordStep) {
            case 1: return 'กรอกรหัสผ่านปัจจุบัน';
            case 2: return 'กรอกรหัสผ่านใหม่';
            case 3: return 'ยืนยันรหัสผ่านใหม่';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-32 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center text-gray-700 dark:text-white font-bold text-2xl flex-shrink-0">
                        {user?.username?.slice(0, 2).toUpperCase() || 'US'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                            {user?.username}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                        <p className="text-sm text-gray-400 mt-2">
                            <span className="material-symbols-outlined text-[14px] align-middle mr-1">calendar_today</span>
                            เข้าร่วมเมื่อ {user?.createdAt ? formatDate(user.createdAt) : 'ไม่ทราบ'}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">ข้อมูลบัญชี</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-[#272726]">
                        <span className="text-gray-600 dark:text-gray-400">User ID</span>
                        <span className="text-gray-900 dark:text-white font-mono text-sm">{user?.id}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-[#272726]">
                        <span className="text-gray-600 dark:text-gray-400">อีเมล</span>
                        <span className="text-gray-900 dark:text-white">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-[#272726]">
                        <span className="text-gray-600 dark:text-gray-400">เข้าร่วมเมื่อ</span>
                        <span className="text-gray-900 dark:text-white">
                            {user?.createdAt ? formatDate(user.createdAt) : 'ไม่ทราบ'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 dark:text-gray-400">รหัสผ่าน</span>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-[#333] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">lock</span>
                            เปลี่ยนรหัสผ่าน
                        </button>
                    </div>
                </div>
            </section>

            {mounted && showPasswordModal && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            {passwordSuccess ? (
                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-[32px] text-green-500">check</span>
                                </div>
                            ) : (
                                <div className="flex justify-center gap-2 mb-4">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className={`w-3 h-3 rounded-full ${s === passwordStep
                                                ? 'bg-gray-900 dark:bg-white'
                                                : s < passwordStep
                                                    ? 'bg-gray-400 dark:bg-gray-500'
                                                    : 'bg-gray-200 dark:bg-[#333]'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {getStepTitle()}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {getStepDescription()}
                            </p>
                        </div>

                        {!passwordSuccess && (
                            <div className="mb-6">
                                {passwordStep === 1 && (
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="รหัสผ่านปัจจุบัน"
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                        autoFocus
                                    />
                                )}
                                {passwordStep === 2 && (
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="รหัสผ่านใหม่"
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                        autoFocus
                                    />
                                )}
                                {passwordStep === 3 && (
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="ยืนยันรหัสผ่านใหม่"
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                        autoFocus
                                    />
                                )}

                                {passwordError && (
                                    <p className="text-sm text-red-500 mt-2">{passwordError}</p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            {passwordSuccess ? (
                                <button
                                    onClick={resetPasswordModal}
                                    className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                                >
                                    ปิด
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={passwordStep === 1 ? resetPasswordModal : () => setPasswordStep((prev) => (prev - 1) as 1 | 2 | 3)}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                    >
                                        {passwordStep === 1 ? 'ยกเลิก' : 'ย้อนกลับ'}
                                    </button>
                                    <button
                                        onClick={handleNextStep}
                                        disabled={saving}
                                        className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'กำลังบันทึก...' : passwordStep === 3 ? 'เปลี่ยนรหัส' : 'ถัดไป'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
