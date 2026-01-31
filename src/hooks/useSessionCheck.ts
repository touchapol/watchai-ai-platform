'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const publicPaths = ['/login', '/register', '/terms', '/setup'];

export function useSessionCheck(intervalMs: number = 30000) {
    const router = useRouter();
    const pathname = usePathname();
    const [isValid, setIsValid] = useState(true);

    const checkSession = useCallback(async () => {
        if (publicPaths.includes(pathname)) return;

        try {
            const res = await fetch('/api/auth/validate-session', {
                method: 'GET',
                credentials: 'include',
            });
            if (!res.ok) {
                setIsValid(false);
                router.push('/login');
            }
        } catch {

        }
    }, [router, pathname]);

    useEffect(() => {
        if (publicPaths.includes(pathname)) return;

        checkSession();
        const interval = setInterval(checkSession, intervalMs);
        return () => clearInterval(interval);
    }, [checkSession, intervalMs, pathname]);

    return isValid;
}
