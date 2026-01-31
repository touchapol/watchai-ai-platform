'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminUser, AdminTab, isValidTab } from './types';

export function useAdminAuth() {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();

                if (!data.user) {
                    router.push('/login');
                    return;
                }

                if (data.user.role !== 'ADMIN') {
                    router.push('/dashboard');
                    return;
                }

                setUser(data.user);
            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    return { user, loading };
}

export function useTabState() {
    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState<AdminTab>(() => {
        const tab = searchParams.get('tab');
        return isValidTab(tab) ? tab : 'overview';
    });

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (isValidTab(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    return { activeTab, setActiveTab };
}
