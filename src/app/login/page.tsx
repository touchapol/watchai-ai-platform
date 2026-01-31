'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] dark:bg-[#0A0A0A]">
            <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">progress_activity</span>
        </div>
    );
}

interface FormInputProps {
    id: string;
    label: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}

function FormInput({ id, label, type, placeholder, value, onChange }: FormInputProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white font-display" htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#262626] rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-600 focus:border-gray-900 dark:focus:border-gray-600 transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
            />
        </div>
    );
}

interface SubmitButtonProps {
    loading: boolean;
    text: string;
    loadingText: string;
}

function SubmitButton({ loading, text, loadingText }: SubmitButtonProps) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg hover:shadow-gray-900/30 dark:hover:shadow-white/20 transform transition-all active:scale-[0.98] font-display disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    {loadingText}
                </span>
            ) : text}
        </button>
    );
}

interface ErrorAlertProps {
    message: string;
}

function ErrorAlert({ message }: ErrorAlertProps) {
    if (!message) return null;
    return (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{message}</p>
        </div>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/chat';

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            try {
                const alreadyRedirecting = sessionStorage.getItem('setup-redirect');
                if (alreadyRedirecting) {
                    sessionStorage.removeItem('setup-redirect');
                    setChecking(false);
                    return;
                }

                const setupRes = await fetch('/api/setup/check');
                const setupData = await setupRes.json();
                if (setupData.needsSetup) {
                    sessionStorage.setItem('setup-redirect', 'true');
                    window.location.href = '/setup';
                    return;
                }

                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    router.replace(redirect);
                    return;
                }
            } catch { }
            setChecking(false);
        };
        checkSession();
    }, [router, redirect]);

    useEffect(() => {
        fetch('/api/auth/csrf')
            .then(res => res.json())
            .then(data => setCsrfToken(data.csrfToken || ''))
            .catch(() => { });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
                setLoading(false);
                return;
            }

            router.push(redirect);
        } catch {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            setLoading(false);
        }
    };

    if (checking) return <LoadingSpinner />;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F5] dark:bg-[#0A0A0A]">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#161616] rounded-[32px] shadow-2xl p-8 md:p-12 relative overflow-hidden">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-[32px] text-gray-900 dark:text-white font-bold">lock</span>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-display">เข้าสู่ระบบ</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center font-sans">
                        ยินดีต้อนรับกลับสู่ <span className="text-gray-900 dark:text-white font-medium">WatchAI</span>
                    </p>
                </div>

                {searchParams.get('setup') === 'true' && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <p className="text-green-600 dark:text-green-400 text-sm text-center flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Setup สำเร็จ! กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินที่สร้างไว้
                        </p>
                    </div>
                )}

                <ErrorAlert message={error} />

                <form onSubmit={handleLogin} className="space-y-6">
                    <FormInput
                        id="identifier"
                        label="อีเมลหรือชื่อผู้ใช้"
                        type="text"
                        placeholder="email@example.com"
                        value={identifier}
                        onChange={setIdentifier}
                    />
                    <FormInput
                        id="password"
                        label="รหัสผ่าน"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                    />
                    <SubmitButton loading={loading} text="เข้าสู่ระบบ" loadingText="กำลังเข้าสู่ระบบ..." />
                </form>

                <div className="pt-4 mt-4 border-gray-100 dark:border-[#262626] text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        ยังไม่มีบัญชี?{' '}
                        <Link href="/register" className="text-gray-900 dark:text-white font-medium hover:underline">
                            สมัครสมาชิก
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <LoginContent />
        </Suspense>
    );
}
