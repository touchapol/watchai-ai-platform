'use client';

import { FileItem, FolderItem, formatFileSize, getFileIcon, getFileColor, isTextFile } from './types';

interface FileGridProps {
    folders: FolderItem[];
    files: FileItem[];
    selectedFiles: Set<string>;
    onFolderClick: (folder: FolderItem) => void;
    onFolderDelete: (folder: FolderItem) => void;
    onFolderMobileMenu: (folder: FolderItem) => void;
    onFileClick: (file: FileItem) => void;
    onFileSelect: (id: string, e?: React.MouseEvent) => void;
    onFileContextMenu: (e: React.MouseEvent, file: FileItem) => void;
    onFileRename: (file: FileItem) => void;
    onFileInfo: (file: FileItem) => void;
    onFileDelete: (file: FileItem) => void;
    onFileMobileMenu: (file: FileItem) => void;
}

export function FileGrid({
    folders,
    files,
    selectedFiles,
    onFolderClick,
    onFolderDelete,
    onFolderMobileMenu,
    onFileClick,
    onFileSelect,
    onFileContextMenu,
    onFileRename,
    onFileInfo,
    onFileDelete,
    onFileMobileMenu,
}: FileGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
                <div
                    key={folder.path}
                    className="group relative bg-white dark:bg-[#161616] rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg border-2 border-transparent hover:border-gray-200 dark:hover:border-[#333]"
                    onClick={() => onFolderClick(folder)}
                >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30">
                        <span className="material-symbols-outlined text-[28px]">folder</span>
                    </div>
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{folder.fileCount} ไฟล์ · {folder.folderCount} โฟลเดอร์</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); onFolderMobileMenu(folder); }}
                        className="md:hidden absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-gray-900/80 dark:bg-white/80 rounded-full"
                    >
                        <span className="material-symbols-outlined text-[16px] text-white dark:text-gray-900">more_vert</span>
                    </button>
                    <div className="hidden md:flex absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); onFolderDelete(folder); }}
                            className="w-7 h-7 flex items-center justify-center bg-red-500/80 rounded-full"
                        >
                            <span className="material-symbols-outlined text-[16px] text-white">delete</span>
                        </button>
                    </div>
                </div>
            ))}
            {files.map((file) => (
                <div
                    key={file.id}
                    className={`group relative bg-white dark:bg-[#161616] rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${selectedFiles.has(file.id) ? "border-gray-900 dark:border-white" : "border-transparent hover:border-gray-200 dark:hover:border-[#333]"}`}
                    onClick={() => onFileClick(file)}
                    onContextMenu={(e) => onFileContextMenu(e, file)}
                    onDoubleClick={() => onFileRename(file)}
                >
                    <button
                        onClick={(e) => onFileSelect(file.id, e)}
                        className={`absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-md ${selectedFiles.has(file.id) ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white opacity-100" : "border-gray-300 bg-white dark:bg-[#262626] dark:border-gray-600 opacity-0 group-hover:opacity-100"}`}
                    >
                        {selectedFiles.has(file.id) && <span className="material-symbols-outlined text-[14px] text-white dark:text-gray-900">check</span>}
                    </button>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${getFileColor(file.mimeType)}`}>
                        {file.mimeType.startsWith("image/") ? (
                            <img src={`/api/files/${file.id}`} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <span className="material-symbols-outlined text-[28px]">{getFileIcon(file.mimeType)}</span>
                        )}
                    </div>
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); onFileMobileMenu(file); }}
                        className="md:hidden absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-gray-900/80 dark:bg-white/80 rounded-full"
                    >
                        <span className="material-symbols-outlined text-[16px] text-white dark:text-gray-900">more_vert</span>
                    </button>
                    <div className="hidden md:flex absolute top-2 right-2 opacity-0 group-hover:opacity-100 gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onFileInfo(file); }}
                            className="w-7 h-7 flex items-center justify-center bg-gray-900/80 dark:bg-white/80 rounded-full"
                        >
                            <span className="material-symbols-outlined text-[16px] text-white dark:text-gray-900">info</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onFileDelete(file); }}
                            className="w-7 h-7 flex items-center justify-center bg-red-500/80 rounded-full"
                        >
                            <span className="material-symbols-outlined text-[16px] text-white">delete</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface FileListProps {
    folders: FolderItem[];
    files: FileItem[];
    selectedFiles: Set<string>;
    onSelectAll: () => void;
    onFolderClick: (folder: FolderItem) => void;
    onFileClick: (file: FileItem) => void;
    onFileSelect: (id: string, e?: React.MouseEvent) => void;
    onFileInfo: (file: FileItem) => void;
    onFileDownload: (file: FileItem, e?: React.MouseEvent) => void;
    onFileDelete: (file: FileItem) => void;
}

export function FileList({
    folders,
    files,
    selectedFiles,
    onSelectAll,
    onFolderClick,
    onFileClick,
    onFileSelect,
    onFileInfo,
    onFileDownload,
    onFileDelete,
}: FileListProps) {
    return (
        <div className="bg-white dark:bg-[#161616] rounded-xl overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-[#262626]">
                        <th className="w-10 px-4 py-3">
                            <button onClick={onSelectAll}>
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFiles.size === files.length && files.length > 0 ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white" : "border-gray-400"}`}>
                                    {selectedFiles.size === files.length && files.length > 0 && <span className="material-symbols-outlined text-[14px] text-white dark:text-gray-900">check</span>}
                                </span>
                            </button>
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 py-3">ชื่อ</th>
                        <th className="text-left text-xs font-medium text-gray-500 py-3 hidden md:table-cell">ขนาด</th>
                        <th className="w-32"></th>
                    </tr>
                </thead>
                <tbody>
                    {folders.map((folder) => (
                        <tr
                            key={folder.path}
                            className="border-b border-gray-100 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                            onClick={() => onFolderClick(folder)}
                        >
                            <td className="px-4 py-3"></td>
                            <td className="py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30">
                                        <span className="material-symbols-outlined text-[20px]">folder</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{folder.name}</p>
                                        <p className="text-xs text-gray-500">{folder.fileCount} ไฟล์</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 text-sm text-gray-500 hidden md:table-cell">-</td>
                            <td></td>
                        </tr>
                    ))}
                    {files.map((file) => (
                        <tr
                            key={file.id}
                            className={`border-b border-gray-100 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] ${selectedFiles.has(file.id) ? "bg-gray-50 dark:bg-[#1a1a1a]" : ""}`}
                        >
                            <td className="px-4 py-3">
                                <button onClick={(e) => onFileSelect(file.id, e)}>
                                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFiles.has(file.id) ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white" : "border-gray-400"}`}>
                                        {selectedFiles.has(file.id) && <span className="material-symbols-outlined text-[14px] text-white dark:text-gray-900">check</span>}
                                    </span>
                                </button>
                            </td>
                            <td className="py-3 cursor-pointer" onClick={() => onFileClick(file)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(file.mimeType)}`}>
                                        {file.mimeType.startsWith("image/") ? (
                                            <img src={`/api/files/${file.id}`} alt="" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px]">{getFileIcon(file.mimeType)}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{file.filename}</span>
                                </div>
                            </td>
                            <td className="py-3 text-sm text-gray-500 hidden md:table-cell">{formatFileSize(file.size)}</td>
                            <td className="py-3">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onFileInfo(file)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg">
                                        <span className="material-symbols-outlined text-[18px] text-gray-500">info</span>
                                    </button>
                                    <button onClick={(e) => onFileDownload(file, e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg">
                                        <span className="material-symbols-outlined text-[18px] text-gray-500">download</span>
                                    </button>
                                    <button onClick={() => onFileDelete(file)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg">
                                        <span className="material-symbols-outlined text-[18px] text-red-500">delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#161616] rounded-xl p-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-[#262626] rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-[#262626] rounded mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-[#262626] rounded w-2/3" />
                </div>
            ))}
        </div>
    );
}

interface EmptyStateProps {
    searchQuery: string;
    onUpload: (files: FileList | null) => void;
}

export function EmptyState({ searchQuery, onUpload }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600">
                    {searchQuery ? "search_off" : "folder_open"}
                </span>
            </div>
            <h3 className="text-lg font-medium mb-2">{searchQuery ? "ไม่พบไฟล์" : "ยังไม่มีไฟล์"}</h3>
            <p className="text-sm text-gray-500 mb-6">{searchQuery ? "ลองค้นหาด้วยคำอื่น" : "ลากไฟล์มาวางหรือกดปุ่มอัพโหลด"}</p>
            {!searchQuery && (
                <label className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                    อัพโหลดไฟล์
                    <input type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
                </label>
            )}
        </div>
    );
}

export function DragOverlay() {
    return (
        <div className="fixed inset-0 z-40 bg-gray-900/50 dark:bg-black/70 flex items-center justify-center">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-[64px] text-gray-400 mb-4">cloud_upload</span>
                <p className="text-lg font-medium">วางไฟล์เพื่ออัพโหลด</p>
            </div>
        </div>
    );
}
