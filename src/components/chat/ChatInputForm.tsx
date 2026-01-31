'use client';

import { RefObject } from 'react';
import { UserFile, UploadingFile, Model, formatFileSize } from './types';
import { ModelSelector } from './ModelSelector';

interface ChatInputFormProps {
    message: string;
    onMessageChange: (value: string) => void;
    selectedFiles: UserFile[];
    uploadingFiles: UploadingFile[];
    availableModels: Model[];
    loadingModels: boolean;
    selectedModel: string;
    showModelDropdown: boolean;
    sending: boolean;
    checkingQuota: boolean;
    quotaError: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => void;
    onSelectModel: (model: string) => void;
    onToggleModelDropdown: () => void;
    onOpenSettings: () => void;
    onOpenFileModal: () => void;
    onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (fileId: string) => void;
    onRemoveUploadingFile: (tempId: string, localUrl: string) => void;
    onPreviewImage: (src: string) => void;
    onFileClick: (file: UserFile) => void;
    onDismissQuotaError: () => void;
}

export function ChatInputForm({
    message,
    onMessageChange,
    selectedFiles,
    uploadingFiles,
    availableModels,
    loadingModels,
    selectedModel,
    showModelDropdown,
    sending,
    checkingQuota,
    quotaError,
    fileInputRef,
    onSubmit,
    onSelectModel,
    onToggleModelDropdown,
    onOpenSettings,
    onOpenFileModal,
    onUploadFile,
    onRemoveFile,
    onRemoveUploadingFile,
    onPreviewImage,
    onFileClick,
    onDismissQuotaError
}: ChatInputFormProps) {
    return (
        <>
            {quotaError && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                    <span className="text-sm text-red-600 dark:text-red-400">{quotaError}</span>
                    <button
                        type="button"
                        onClick={onDismissQuotaError}
                        className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}
            <form onSubmit={onSubmit} className="w-full">
                <div className="w-full bg-[#F5F5F5] dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#262626] rounded-[20px] p-4 shadow-sm relative transition-all duration-200 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-700">
                    {(selectedFiles.length > 0 || uploadingFiles.length > 0) && (
                        <div className="mb-3">
                            <div className="flex items-start gap-2 flex-wrap">
                                {selectedFiles.map((file) => (
                                    <div key={file.id} className="relative group w-24 h-24">
                                        {file.type === 'IMAGE' ? (
                                            <img
                                                src={`/api/files/${file.id}`}
                                                alt={file.filename}
                                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => onPreviewImage(`/api/files/${file.id}`)}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="w-24 h-24 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                                onClick={() => onFileClick(file)}
                                            >
                                                <span className="material-symbols-outlined text-[40px] text-gray-400">description</span>
                                                <span className="text-[12px] text-gray-500 dark:text-gray-300 truncate max-w-[88px] mt-0.5 px-1 text-center leading-tight font-medium">
                                                    {file.filename.length > 10 ? file.filename.slice(0, 8) + '...' : file.filename}
                                                </span>
                                                <span className="text-[11px] text-gray-400">{formatFileSize(file.size)}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveFile(file.id);
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                ))}
                                {uploadingFiles.map((file) => (
                                    file.mimeType.startsWith('image/') ? (
                                        <div key={file.tempId} className="relative group w-24 h-24">
                                            <img
                                                src={file.localUrl}
                                                alt={file.filename}
                                                className={`w-24 h-24 object-cover rounded-lg ${file.status === 'error' ? 'opacity-50' : ''}`}
                                            />
                                            {file.status === 'uploading' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                                    <svg className="w-10 h-10" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="3" />
                                                        <circle
                                                            cx="18" cy="18" r="16" fill="none" stroke="#fff" strokeWidth="3"
                                                            strokeDasharray={`${file.progress} 100`}
                                                            strokeLinecap="round"
                                                            transform="rotate(-90 18 18)"
                                                        />
                                                    </svg>
                                                    <span className="absolute text-white text-xs font-medium">{file.progress}%</span>
                                                </div>
                                            )}
                                            {file.status === 'error' && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg" title={file.errorMessage}>
                                                    <span className="material-symbols-outlined text-[24px] text-red-500">warning</span>
                                                    <span className="text-[10px] text-white text-center px-1 mt-1 leading-tight line-clamp-2">{file.errorMessage}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => onRemoveUploadingFile(file.tempId, file.localUrl)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div key={file.tempId} className="relative group w-24 h-24 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-[40px] text-gray-400">description</span>
                                            <span className="text-[12px] text-gray-500 dark:text-gray-300 truncate max-w-[88px] mt-0.5 font-medium">{file.filename.length > 10 ? file.filename.slice(0, 8) + '...' : file.filename}</span>
                                            {file.status === 'uploading' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                                    <svg className="w-10 h-10" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#374151" strokeWidth="3" />
                                                        <circle
                                                            cx="18" cy="18" r="16" fill="none" stroke="#fff" strokeWidth="3"
                                                            strokeDasharray={`${file.progress} 100`}
                                                            strokeLinecap="round"
                                                            transform="rotate(-90 18 18)"
                                                        />
                                                    </svg>
                                                    <span className="absolute text-white text-xs font-medium">{file.progress}%</span>
                                                </div>
                                            )}
                                            {file.status === 'error' && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg" title={file.errorMessage}>
                                                    <span className="material-symbols-outlined text-[24px] text-red-500">warning</span>
                                                    <span className="text-[10px] text-white text-center px-1 mt-1 leading-tight line-clamp-2">{file.errorMessage}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => onRemoveUploadingFile(file.tempId, file.localUrl)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                    <textarea
                        className="w-full h-16 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-0"
                        placeholder="พิมพ์ข้อความถึง AI..."
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSubmit(e);
                            }
                        }}
                        disabled={sending}
                    />
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                            <ModelSelector
                                models={availableModels}
                                loading={loadingModels}
                                selectedModel={selectedModel}
                                onSelectModel={onSelectModel}
                                showDropdown={showModelDropdown}
                                onToggleDropdown={onToggleModelDropdown}
                            />
                            <button
                                type="button"
                                onClick={onOpenSettings}
                                className="flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                                title="ตั้งค่า"
                            >
                                <span className="material-symbols-outlined text-[18px]">settings</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onUploadFile}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="อัปโหลดไฟล์"
                            >
                                <span className="material-symbols-outlined text-[20px]">upload</span>
                            </button>
                            <button
                                type="button"
                                onClick={onOpenFileModal}
                                className="flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="เลือกจากไฟล์ของฉัน"
                            >
                                <span className="material-symbols-outlined text-[20px]">folder_open</span>
                            </button>
                            <button
                                type="submit"
                                disabled={sending || checkingQuota || !message.trim()}
                                className="bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-50"
                            >
                                {checkingQuota ? (
                                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
