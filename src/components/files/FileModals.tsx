'use client';

import { useRef, useEffect } from 'react';
import { FileItem, FolderItem, formatFileSize, formatDate, getFileIcon, getFileColor } from './types';

interface DeleteConfirmModalProps {
    file: FileItem | null;
    deleting: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function DeleteConfirmModal({ file, deleting, onConfirm, onClose }: DeleteConfirmModalProps) {
    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <span className="material-symbols-outlined text-[32px] text-red-500">delete_forever</span>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">ลบไฟล์</h3>
                <p className="text-sm text-gray-500 text-center mb-6">&quot;{file.filename}&quot; จะถูกลบอย่างถาวร</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                กำลังลบ...
                            </>
                        ) : "ลบ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface BulkDeleteModalProps {
    isOpen: boolean;
    count: number;
    deleting: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function BulkDeleteModal({ isOpen, count, deleting, onConfirm, onClose }: BulkDeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <span className="material-symbols-outlined text-[32px] text-red-500">delete_sweep</span>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">ลบไฟล์ที่เลือก</h3>
                <p className="text-sm text-gray-500 text-center mb-6">{count} ไฟล์จะถูกลบอย่างถาวร</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                กำลังลบ...
                            </>
                        ) : "ลบทั้งหมด"}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface RenameModalProps {
    file: FileItem | null;
    newFileName: string;
    renaming: boolean;
    onFileNameChange: (name: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function RenameModal({ file, newFileName, renaming, onFileNameChange, onConfirm, onClose }: RenameModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (file && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [file]);

    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">เปลี่ยนชื่อไฟล์</h3>
                <input
                    ref={inputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => onFileNameChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#262626] rounded-xl text-sm outline-none mb-4"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={renaming || !newFileName.trim()}
                        className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm disabled:opacity-50"
                    >
                        {renaming ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface NewFolderModalProps {
    isOpen: boolean;
    folderName: string;
    onFolderNameChange: (name: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function NewFolderModal({ isOpen, folderName, onFolderNameChange, onConfirm, onClose }: NewFolderModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30">
                        <span className="material-symbols-outlined text-[20px]">create_new_folder</span>
                    </div>
                    <h3 className="text-lg font-semibold">สร้างโฟลเดอร์ใหม่</h3>
                </div>
                <input
                    type="text"
                    placeholder="ชื่อโฟลเดอร์"
                    value={folderName}
                    onChange={(e) => onFolderNameChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#262626] rounded-xl text-sm outline-none mb-4"
                    autoFocus
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!folderName.trim()}
                        className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm disabled:opacity-50"
                    >
                        สร้าง
                    </button>
                </div>
            </div>
        </div>
    );
}

interface NewFileModalProps {
    isOpen: boolean;
    fileName: string;
    fileContent: string;
    onFileNameChange: (name: string) => void;
    onFileContentChange: (content: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function NewFileModal({ isOpen, fileName, fileContent, onFileNameChange, onFileContentChange, onConfirm, onClose }: NewFileModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-500 bg-blue-100 dark:bg-blue-900/30">
                        <span className="material-symbols-outlined text-[20px]">note_add</span>
                    </div>
                    <h3 className="text-lg font-semibold">สร้างไฟล์ใหม่</h3>
                </div>
                <input
                    type="text"
                    placeholder="ชื่อไฟล์ (เช่น notes.txt)"
                    value={fileName}
                    onChange={(e) => onFileNameChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#262626] rounded-xl text-sm outline-none mb-3"
                    autoFocus
                />
                <textarea
                    placeholder="เนื้อหาไฟล์ (ไม่จำเป็น)"
                    value={fileContent}
                    onChange={(e) => onFileContentChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#262626] rounded-xl text-sm outline-none resize-none h-32 mb-4"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!fileName.trim()}
                        className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm disabled:opacity-50"
                    >
                        สร้าง
                    </button>
                </div>
            </div>
        </div>
    );
}

interface DeleteFolderModalProps {
    folder: FolderItem | null;
    deleting: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function DeleteFolderModal({ folder, deleting, onConfirm, onClose }: DeleteFolderModalProps) {
    if (!folder) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <span className="material-symbols-outlined text-[32px] text-red-500">folder_delete</span>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">ลบโฟลเดอร์</h3>
                <p className="text-sm text-gray-500 text-center mb-2">&quot;{folder.name}&quot;</p>
                <p className="text-xs text-gray-400 text-center mb-4">
                    {folder.fileCount > 0 || folder.folderCount > 0
                        ? `มี ${folder.fileCount} ไฟล์ และ ${folder.folderCount} โฟลเดอร์ภายใน จะถูกลบทั้งหมด`
                        : "โฟลเดอร์นี้ว่างเปล่า"}
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#262626] rounded-xl font-medium text-sm">
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                กำลังลบ...
                            </>
                        ) : "ลบโฟลเดอร์"}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ErrorModalProps {
    message: string | null;
    onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <span className="material-symbols-outlined text-[32px] text-orange-500">warning</span>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">แจ้งเตือน</h3>
                <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
                <button onClick={onClose} className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm">
                    ตกลง
                </button>
            </div>
        </div>
    );
}

interface FileEditorModalProps {
    file: FileItem | null;
    content: string;
    saving: boolean;
    onContentChange: (content: string) => void;
    onSave: () => void;
    onClose: () => void;
}

export function FileEditorModal({ file, content, saving, onContentChange, onSave, onClose }: FileEditorModalProps) {
    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#161616] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#262626]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-500 bg-blue-100 dark:bg-blue-900/30">
                            <span className="material-symbols-outlined text-[20px]">edit_document</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">{file.filename}</h3>
                            <p className="text-xs text-gray-500">แก้ไขไฟล์</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    บันทึก
                                </>
                            )}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    className="flex-1 w-full p-4 bg-gray-50 dark:bg-[#0a0a0a] font-mono text-sm resize-none outline-none min-h-[60vh]"
                    spellCheck={false}
                />
            </div>
        </div>
    );
}

interface FilePreviewModalProps {
    file: FileItem | null;
    onDownload: (file: FileItem) => void;
    onClose: () => void;
}

export function FilePreviewModal({ file, onDownload, onClose }: FilePreviewModalProps) {
    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#161616] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#262626]">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(file.mimeType)}`}>
                            <span className="material-symbols-outlined text-[20px]">{getFileIcon(file.mimeType)}</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">{file.filename}</h3>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDownload(file)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            ดาวน์โหลด
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    {file.mimeType.startsWith("image/") ? (
                        <img src={`/api/files/${file.id}`} alt={file.filename} className="max-w-full max-h-[65vh] mx-auto object-contain rounded-lg" />
                    ) : file.mimeType === "application/pdf" ? (
                        <iframe src={`/api/files/${file.id}`} className="w-full h-[65vh] rounded-lg" />
                    ) : (
                        <div className="text-center py-16">
                            <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-4 ${getFileColor(file.mimeType)}`}>
                                <span className="material-symbols-outlined text-[48px]">{getFileIcon(file.mimeType)}</span>
                            </div>
                            <p className="text-gray-500 mb-4">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
                            <button
                                onClick={() => onDownload(file)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                ดาวน์โหลด
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
