'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    router.replace('/chat');
                } else {
                    router.replace('/login');
                }
            })
            .catch(() => {
                router.replace('/login');
            })
            .finally(() => setChecking(false));
    }, [router]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0d0c]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
            </div>
        );
    }

    return null;
}
