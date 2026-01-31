'use client';

import { FileItem, FolderItem, formatFileSize, formatDate, getFileIcon, getFileColor } from './types';

interface MobileFileActionMenuProps {
    file: FileItem | null;
    onViewInfo: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onDownload: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
    onClose: () => void;
}

export function MobileFileActionMenu({ file, onViewInfo, onRename, onDownload, onDelete, onClose }: MobileFileActionMenuProps) {
    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 md:hidden" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl w-full max-w-lg p-4 pb-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
                <p className="text-center font-medium mb-4 truncate px-4">{file.filename}</p>
                <div className="space-y-2">
                    <button onClick={() => { onViewInfo(file); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl">
                        <span className="material-symbols-outlined text-[22px] text-gray-600 dark:text-gray-400">info</span>
                        <span>ดูรายละเอียด</span>
                    </button>
                    <button onClick={() => { onRename(file); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl">
                        <span className="material-symbols-outlined text-[22px] text-gray-600 dark:text-gray-400">edit</span>
                        <span>เปลี่ยนชื่อ</span>
                    </button>
                    <button onClick={() => { onDownload(file); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl">
                        <span className="material-symbols-outlined text-[22px] text-gray-600 dark:text-gray-400">download</span>
                        <span>ดาวน์โหลด</span>
                    </button>
                    <button onClick={() => { onDelete(file); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                        <span className="material-symbols-outlined text-[22px]">delete</span>
                        <span>ลบไฟล์</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

interface MobileFolderActionMenuProps {
    folder: FolderItem | null;
    onOpen: (folder: FolderItem) => void;
    onDelete: (folder: FolderItem) => void;
    onClose: () => void;
}

export function MobileFolderActionMenu({ folder, onOpen, onDelete, onClose }: MobileFolderActionMenuProps) {
    if (!folder) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 md:hidden" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl w-full max-w-lg p-4 pb-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-center gap-2 mb-4 px-4">
                    <span className="material-symbols-outlined text-[24px] text-yellow-500">folder</span>
                    <p className="font-medium truncate">{folder.name}</p>
                </div>
                <div className="space-y-2">
                    <button onClick={() => { onOpen(folder); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl">
                        <span className="material-symbols-outlined text-[22px] text-gray-600 dark:text-gray-400">folder_open</span>
                        <span>เปิดโฟลเดอร์</span>
                    </button>
                    <button onClick={() => { onDelete(folder); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                        <span className="material-symbols-outlined text-[22px]">delete</span>
                        <span>ลบโฟลเดอร์</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

interface MobileInfoPanelProps {
    file: FileItem | null;
    onDownload: (file: FileItem) => void;
    onClose: () => void;
}

export function MobileInfoPanel({ file, onDownload, onClose }: MobileInfoPanelProps) {
    if (!file) return null;

    return (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-2" />
                <div className="p-4">
                    <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-3 ${getFileColor(file.mimeType)}`}>
                        {file.mimeType.startsWith("image/") ? (
                            <img src={`/api/files/${file.id}`} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <span className="material-symbols-outlined text-[32px]">{getFileIcon(file.mimeType)}</span>
                        )}
                    </div>
                    <h4 className="font-medium text-center mb-3 break-all text-sm">{file.filename}</h4>
                    <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-[#262626]">
                            <span className="text-gray-500">ขนาด</span>
                            <span className="font-medium">{formatFileSize(file.size)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-[#262626]">
                            <span className="text-gray-500">ประเภท</span>
                            <span className="font-medium">{file.type === "IMAGE" ? "รูปภาพ" : "เอกสาร"}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">อัพโหลด</span>
                            <span className="font-medium">{formatDate(file.createdAt)}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 px-4">
                        <button onClick={() => onDownload(file)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            ดาวน์โหลด
                        </button>
                        <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                            ปิด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface DesktopInfoPanelProps {
    file: FileItem | null;
    onDownload: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
    onClose: () => void;
}

export function DesktopInfoPanel({ file, onDownload, onRename, onDelete, onClose }: DesktopInfoPanelProps) {
    if (!file) return null;

    return (
        <aside className="hidden md:flex w-80 border-l border-gray-200 dark:border-[#262626] bg-white dark:bg-[#161616] flex-shrink-0 overflow-y-auto flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-[#262626] flex items-center justify-between">
                <h3 className="font-medium">รายละเอียด</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
            <div className="p-4">
                <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4 ${getFileColor(file.mimeType)}`}>
                    {file.mimeType.startsWith("image/") ? (
                        <img src={`/api/files/${file.id}`} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                        <span className="material-symbols-outlined text-[48px]">{getFileIcon(file.mimeType)}</span>
                    )}
                </div>
                <h4 className="font-medium text-center mb-4 break-all">{file.filename}</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">ขนาด</span>
                        <span className="font-medium">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">ประเภท</span>
                        <span className="font-medium">{file.type === "IMAGE" ? "รูปภาพ" : "เอกสาร"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">อัพโหลด</span>
                        <span className="font-medium">{formatDate(file.createdAt)}</span>
                    </div>
                </div>
                <div className="mt-6 space-y-2">
                    <button onClick={() => onDownload(file)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        ดาวน์โหลด
                    </button>
                    <button onClick={() => onRename(file)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        เปลี่ยนชื่อ
                    </button>
                    <button onClick={() => onDelete(file)} className="flex items-center justify-center gap-2 w-full py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium text-sm">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        ลบ
                    </button>
                </div>
            </div>
        </aside>
    );
}
