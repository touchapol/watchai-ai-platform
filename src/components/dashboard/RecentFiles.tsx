'use client';

import { RecentFile } from '@/types/dashboard';

interface Props {
    files: RecentFile[];
}

export default function RecentFiles({ files }: Props) {
    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-6 mt-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">ไฟล์ล่าสุด</h2>
            {files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a19] rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-400">description</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">ยังไม่มีไฟล์</p>
            )}
        </div>
    );
}
