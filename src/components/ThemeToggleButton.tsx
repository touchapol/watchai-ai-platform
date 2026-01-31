'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggleButton() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-5 right-5 w-9 h-9 rounded-full bg-gray-200 dark:bg-[#303030] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center z-50 border border-gray-300 dark:border-[#404040]"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <span className="material-symbols-outlined text-[18px] text-gray-300">light_mode</span>
            ) : (
                <span className="material-symbols-outlined text-[18px] text-gray-600">dark_mode</span>
            )}
        </button>
    );
}
