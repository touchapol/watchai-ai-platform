'use client';

import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SessionContextType {
    isValid: boolean;
    checkSession: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType>({
    isValid: true,
    checkSession: async () => true,
});

const publicPaths = ['/login', '/register', '/terms', '/setup'];

export function SessionProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isValid, setIsValid] = useState(true);

    const checkSession = useCallback(async () => {
        if (publicPaths.includes(pathname)) return true;

        try {
            const res = await fetch('/api/auth/validate-session', {
                method: 'GET',
                credentials: 'include',
            });

            if (!res.ok) {
                setIsValid(false);
                router.push('/login');
                return false;
            }
            setIsValid(true);
            return true;
        } catch {
            return true;
        }
    }, [router, pathname]);

    useEffect(() => {
        checkSession();
    }, [pathname, checkSession]);

    useEffect(() => {
        if (publicPaths.includes(pathname)) return;

        const interval = setInterval(checkSession, 30000);
        return () => clearInterval(interval);
    }, [checkSession, pathname]);

    return (
        <SessionContext.Provider value={{ isValid, checkSession }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => useContext(SessionContext);
