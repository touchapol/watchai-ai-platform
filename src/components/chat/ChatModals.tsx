'use client';

import { formatFileSize, UserFile } from './types';

interface FileSelectionModalProps {
    pickerPath: string;
    pickerFolders: { name: string; path: string; fileCount: number; folderCount: number }[];
    userFiles: UserFile[];
    loadingFiles: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    onSelectFile: (file: UserFile) => void;
}

export function FileSelectionModal({
    pickerPath,
    pickerFolders,
    userFiles,
    loadingFiles,
    onClose,
    onNavigate,
    onSelectFile
}: FileSelectionModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#161616] rounded-2xl w-full max-w-lg mx-4 max-h-[70vh] overflow-hidden animate-[scaleIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#262626]">
                    <div className="flex items-center gap-2">
                        {pickerPath && (
                            <button
                                onClick={() => onNavigate(pickerPath.split('/').slice(0, -1).join('/'))}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            </button>
                        )}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">เลือกไฟล์</h3>
                            {pickerPath && <p className="text-xs text-gray-500">/{pickerPath}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                    {loadingFiles ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="material-symbols-outlined text-[32px] text-gray-400 animate-spin">progress_activity</span>
                        </div>
                    ) : pickerFolders.length === 0 && userFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <span className="material-symbols-outlined text-[48px] mb-2">folder_off</span>
                            <p>โฟลเดอร์นี้ว่างเปล่า</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pickerFolders.map(folder => (
                                <button
                                    key={folder.path}
                                    onClick={() => onNavigate(folder.path)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-[24px] text-yellow-500">folder</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white truncate">{folder.name}</p>
                                        <p className="text-xs text-gray-400">{folder.fileCount} ไฟล์ · {folder.folderCount} โฟลเดอร์</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[20px] text-gray-400">chevron_right</span>
                                </button>
                            ))}
                            {userFiles.filter(file => file.mimeType !== 'image/svg+xml').map(file => (
                                <button
                                    key={file.id}
                                    onClick={() => onSelectFile(file)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-[24px] text-gray-400">
                                        {file.type === 'IMAGE' ? 'image' : 'description'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white truncate">{file.filename}</p>
                                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface SettingsModalProps {
    showTokens: boolean;
    messages: { tokens?: { total: number; prompt: number; completion: number } }[];
    onClose: () => void;
    onToggleTokens: () => void;
}

export function SettingsModal({ showTokens, messages, onClose, onToggleTokens }: SettingsModalProps) {
    const totalTokens = messages.reduce((sum, m) => sum + (m.tokens?.total || 0), 0);
    const promptTokens = messages.reduce((sum, m) => sum + (m.tokens?.prompt || 0), 0);
    const completionTokens = messages.reduce((sum, m) => sum + (m.tokens?.completion || 0), 0);

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#161616] rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-[scaleIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#262626]">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">ตั้งค่า</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">แสดง Token</p>
                            <p className="text-xs text-gray-500">แสดงจำนวน Token ที่ใช้ในแต่ละข้อความ</p>
                        </div>
                        <button
                            onClick={onToggleTokens}
                            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${showTokens ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${showTokens ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-[#262626]">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">สถิติการใช้งาน (แชทปัจจุบัน)</p>
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Token ทั้งหมด</span>
                                <span className="font-medium text-gray-900 dark:text-white">{totalTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Prompt Tokens</span>
                                <span className="text-gray-600 dark:text-gray-400">{promptTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Completion Tokens</span>
                                <span className="text-gray-600 dark:text-gray-400">{completionTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-[#262626]">
                                <span className="text-gray-500">จำนวนข้อความ</span>
                                <span className="text-gray-600 dark:text-gray-400">{messages.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ImagePreviewModalProps {
    src: string;
    onClose: () => void;
}

export function ImagePreviewModal({ src, onClose }: ImagePreviewModalProps) {
    return (
        <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-[90vh]">
                <img src={src} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
        </div>
    );
}

interface FileDetailModalProps {
    file: { id: string; filename: string; size: number };
    onClose: () => void;
}

export function FileDetailModal({ file, onClose }: FileDetailModalProps) {
    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">รายละเอียดไฟล์</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[40px] text-gray-400">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{file.filename}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/api/files/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-center text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        ดูไฟล์
                    </a>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
