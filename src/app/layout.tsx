import type { Metadata } from 'next';
import { Inter, Kanit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { SessionProvider } from '@/context/SessionContext';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const kanit = Kanit({
    weight: ['300', '400', '500', '600'],
    subsets: ['latin', 'thai'],
    variable: '--font-kanit',
});

export const metadata: Metadata = {
    title: 'WatchAI',
    description: 'WatchAI Platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body
                className={`${inter.variable} ${kanit.variable} font-sans bg-[#F5F5F5] dark:bg-[#0A0A0A] text-slate-900 dark:text-white antialiased`}
            >
                <ThemeProvider>
                    <SessionProvider>
                        {children}
                    </SessionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
