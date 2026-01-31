'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
}

export function ImageWithFallback({ src, alt }: ImageWithFallbackProps) {
    const [error, setError] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    if (error) {
        return (
            <div className="my-3 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 aspect-video max-w-md">
                <div className="text-center">
                    <span className="material-symbols-outlined text-[48px] text-gray-400 dark:text-gray-500 mb-2 block">image_not_supported</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ไม่สามารถโหลดรูปภาพได้</p>
                    {alt && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{alt}</p>}
                </div>
            </div>
        );
    }

    return (
        <>
            <img
                src={src}
                alt={alt}
                onError={() => setError(true)}
                onClick={() => setShowPopup(true)}
                className="my-3 max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            />
            {showPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowPopup(false)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPopup(false);
                        }}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">close</span>
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
