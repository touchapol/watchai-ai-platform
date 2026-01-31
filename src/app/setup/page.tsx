'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

interface FormFieldProps {
    id: string;
    name: string;
    type: string;
    label: string;
    placeholder: string;
    value: string;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FormField({ id, name, type, label, placeholder, value, error, onChange }: FormFieldProps) {
    const baseClass = "w-full px-4 py-3 bg-white dark:bg-[#1E1E1E] border rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-gray-900 dark:focus:border-gray-600 transition-all";
    const inputClass = error
        ? `${baseClass} border-red-500 focus:ring-red-500/50`
        : `${baseClass} border-gray-200 dark:border-[#262626] focus:ring-gray-900/20 dark:focus:ring-gray-600`;

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-semibold text-gray-900 dark:text-white font-display">
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={inputClass}
            />
            {error && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                </p>
            )}
        </div>
    );
}

function validateFormData(formData: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!formData.username.trim()) {
        errors.username = 'กรุณากรอกชื่อผู้ใช้';
    } else if (formData.username.length < 3) {
        errors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    }

    if (!formData.email.trim()) {
        errors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.password) {
        errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 8) {
        errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    if (!formData.confirmPassword) {
        errors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    return errors;
}

export default function SetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alreadySetup, setAlreadySetup] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem('setup-redirect');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        fetch('/api/setup/check')
            .then(res => res.json())
            .then(data => {
                if (!data.needsSetup) {
                    setAlreadySetup(true);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateFormData(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ general: data.error || 'Setup ไม่สำเร็จ' });
                setIsSubmitting(false);
                return;
            }

            router.push('/login?setup=true');
        } catch {
            setErrors({ general: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] dark:bg-[#0A0A0A]">
                <span className="material-symbols-outlined text-[48px] text-gray-400 animate-spin">progress_activity</span>
            </div>
        );
    }

    if (alreadySetup) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F5] dark:bg-[#0A0A0A]">
                <div className="w-full max-w-[480px] bg-white dark:bg-[#161616] rounded-[32px] shadow-2xl p-8 md:p-12 text-center">
                    <span className="material-symbols-outlined text-[64px] text-green-500 mb-4">check_circle</span>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">ระบบพร้อมใช้งานแล้ว</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">บัญชีแอดมินถูกสร้างเรียบร้อยแล้ว</p>
                    <a
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">login</span>
                        ไปหน้าเข้าสู่ระบบ
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F5] dark:bg-[#0A0A0A]">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#161616] rounded-[32px] shadow-2xl p-8 md:p-12">
                <header className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-[32px] text-gray-900 dark:text-white font-bold">admin_panel_settings</span>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-display">
                            ยินดีต้อนรับ
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        สร้างบัญชีแอดมินเพื่อเริ่มต้นใช้งาน <span className="text-gray-900 dark:text-white font-medium">WatchAI</span>
                    </p>
                </header>

                {errors.general && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-red-600 dark:text-red-400 text-sm text-center">{errors.general}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField id="username" name="username" type="text" label="ชื่อผู้ใช้ (Admin)" placeholder="admin" value={formData.username} error={errors.username} onChange={handleChange} />
                    <FormField id="email" name="email" type="email" label="อีเมล" placeholder="admin@example.com" value={formData.email} error={errors.email} onChange={handleChange} />
                    <FormField id="password" name="password" type="password" label="รหัสผ่าน" placeholder="••••••••" value={formData.password} error={errors.password} onChange={handleChange} />
                    <FormField id="confirmPassword" name="confirmPassword" type="password" label="ยืนยันรหัสผ่าน" placeholder="••••••••" value={formData.confirmPassword} error={errors.confirmPassword} onChange={handleChange} />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg hover:shadow-gray-900/30 dark:hover:shadow-white/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-display"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                กำลังดำเนินการ...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                                สร้างบัญชีแอดมิน
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#262626]">
                    <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5">info</span>
                        <p>บัญชีนี้จะเป็นบัญชีแอดมินหลักที่มีสิทธิ์สูงสุดในระบบ สามารถจัดการผู้ใช้และตั้งค่าต่างๆ ได้ทั้งหมด</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
