'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
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

interface TermsCheckboxProps {
    checked: boolean;
    error?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function TermsCheckbox({ checked, error, onChange }: TermsCheckboxProps) {
    return (
        <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={checked}
                    onChange={onChange}
                    className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-[#262626] text-gray-900 dark:bg-[#1E1E1E] focus:ring-gray-900/20 dark:focus:ring-gray-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    ฉันยอมรับ{' '}
                    <Link href="/terms" className="text-gray-900 dark:text-white font-medium hover:underline">เงื่อนไขการใช้งาน</Link>
                    {' '}และ{' '}
                    <Link href="/terms" className="text-gray-900 dark:text-white font-medium hover:underline">นโยบายความเป็นส่วนตัว</Link>
                </span>
            </label>
            {error && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                </p>
            )}
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
            className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg hover:shadow-gray-900/30 dark:hover:shadow-white/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-display"
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
    message?: string;
}

function ErrorAlert({ message }: ErrorAlertProps) {
    if (!message) return null;
    return (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{message}</p>
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

    if (!formData.acceptTerms) {
        errors.acceptTerms = 'กรุณายอมรับเงื่อนไขการใช้งาน';
    }

    return errors;
}

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {
        fetch('/api/auth/csrf')
            .then(res => res.json())
            .then(data => setCsrfToken(data.csrfToken || ''))
            .catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    termsAccepted: formData.acceptTerms,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ general: data.error || 'สมัครสมาชิกไม่สำเร็จ' });
                setIsSubmitting(false);
                return;
            }

            router.push('/login?registered=true');
        } catch {
            setErrors({ general: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F5] dark:bg-[#0A0A0A]">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#161616] rounded-[32px] shadow-2xl p-8 md:p-12">
                <header className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-[32px] text-gray-900 dark:text-white font-bold">person_add</span>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-display">สมัครสมาชิก</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        สร้างบัญชีใหม่สำหรับ <span className="text-gray-900 dark:text-white font-medium">WatchAI</span>
                    </p>
                </header>

                <ErrorAlert message={errors.general} />

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField id="username" name="username" type="text" label="ชื่อผู้ใช้" placeholder="username" value={formData.username} error={errors.username} onChange={handleChange} />
                    <FormField id="email" name="email" type="email" label="อีเมล" placeholder="email@example.com" value={formData.email} error={errors.email} onChange={handleChange} />
                    <FormField id="password" name="password" type="password" label="รหัสผ่าน" placeholder="••••••••" value={formData.password} error={errors.password} onChange={handleChange} />
                    <FormField id="confirmPassword" name="confirmPassword" type="password" label="ยืนยันรหัสผ่าน" placeholder="••••••••" value={formData.confirmPassword} error={errors.confirmPassword} onChange={handleChange} />
                    <TermsCheckbox checked={formData.acceptTerms} error={errors.acceptTerms} onChange={handleChange} />
                    <SubmitButton loading={isSubmitting} text="สมัครสมาชิก" loadingText="กำลังดำเนินการ..." />
                </form>

                <footer className="pt-4 mt-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link href="/login" className="text-gray-900 dark:text-white font-medium hover:underline">เข้าสู่ระบบ</Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
