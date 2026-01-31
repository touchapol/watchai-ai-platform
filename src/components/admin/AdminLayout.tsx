'use client';

import { ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

interface AdminContentAreaProps {
    sidebar: ReactNode;
    content: ReactNode;
}

export function AdminPageLayout({ children }: AdminLayoutProps) {
    return (
        <div className="bg-white dark:bg-[#0d0d0c] text-gray-900 dark:text-gray-200 min-h-screen flex flex-col font-sans antialiased">
            {children}
        </div>
    );
}

export function AdminContentArea({ sidebar, content }: AdminContentAreaProps) {
    return (
        <div className="flex flex-1 justify-center px-4 md:px-0">
            <div className="flex flex-col md:flex-row w-full max-w-6xl gap-6 md:items-start md:pt-[15vh]">
                {sidebar}
                <main className="flex-1 overflow-y-auto pb-24 md:pb-7 md:px-6 md:self-start flex-shrink-0 flex flex-col">
                    {content}
                </main>
            </div>
        </div>
    );
}
