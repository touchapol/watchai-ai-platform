'use client';

import { SortBy, SORT_LABELS } from './types';

interface FileHeaderProps {
    fileCount: number;
    totalSize: string;
    selectedCount: number;
}

export function FileHeader({ fileCount, totalSize, selectedCount }: FileHeaderProps) {
    return (
        <div>
            <h1 className="text-xl font-semibold">ไฟล์ของฉัน</h1>
            <p className="text-sm text-gray-500">
                {fileCount} ไฟล์ · {totalSize}
                {selectedCount > 0 && ` · เลือก ${selectedCount}`}
            </p>
        </div>
    );
}

interface FileToolbarProps {
    selectedCount: number;
    totalCount: number;
    searchQuery: string;
    sortBy: SortBy;
    sortOrder: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
    showSortMenu: boolean;
    onSelectAll: () => void;
    onBulkDelete: () => void;
    onSearchChange: (query: string) => void;
    onSortClick: () => void;
    onSortByChange: (sortBy: SortBy) => void;
    onSortOrderToggle: () => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    sortMenuRef: React.RefObject<HTMLDivElement>;
}

export function FileToolbar({
    selectedCount,
    totalCount,
    searchQuery,
    sortBy,
    sortOrder,
    viewMode,
    showSortMenu,
    onSelectAll,
    onBulkDelete,
    onSearchChange,
    onSortClick,
    onSortByChange,
    onSortOrderToggle,
    onViewModeChange,
    sortMenuRef,
}: FileToolbarProps) {
    return (
        <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#262626] rounded-xl px-3 md:px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={onSelectAll}
                        className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg"
                        title="เลือกทั้งหมด"
                    >
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedCount === totalCount && totalCount > 0 ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white" : "border-gray-400"}`}>
                            {selectedCount === totalCount && totalCount > 0 && <span className="material-symbols-outlined text-[14px] text-white dark:text-gray-900">check</span>}
                        </span>
                        <span className="hidden md:inline">เลือกทั้งหมด</span>
                    </button>
                    {selectedCount > 0 && (
                        <button
                            onClick={onBulkDelete}
                            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="ลบที่เลือก"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            <span className="hidden md:inline">ลบที่เลือก</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative hidden md:block">
                        <span className="material-symbols-outlined text-[18px] text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-40 pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-[#262626] border-0 rounded-lg outline-none"
                        />
                    </div>
                    <div className="relative" ref={sortMenuRef}>
                        <button
                            onClick={onSortClick}
                            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg"
                            title="เรียงลำดับ"
                        >
                            <span className="material-symbols-outlined text-[18px]">sort</span>
                            <span className="hidden md:inline">{SORT_LABELS[sortBy]}</span>
                            <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                                {(["name", "date", "size", "type"] as SortBy[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => onSortByChange(s)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#262626] ${sortBy === s ? "font-medium" : "text-gray-600 dark:text-gray-400"}`}
                                    >
                                        {SORT_LABELS[s]}
                                    </button>
                                ))}
                                <div className="border-t border-gray-200 dark:border-[#333] my-1" />
                                <button
                                    onClick={onSortOrderToggle}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626]"
                                >
                                    {sortOrder === "asc" ? "มาก → น้อย" : "น้อย → มาก"}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center bg-gray-100 dark:bg-[#262626] rounded-lg p-0.5">
                        <button
                            onClick={() => onViewModeChange("grid")}
                            className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-white dark:bg-[#333] shadow-sm" : ""}`}
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">grid_view</span>
                        </button>
                        <button
                            onClick={() => onViewModeChange("list")}
                            className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-white dark:bg-[#333] shadow-sm" : ""}`}
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">view_list</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FileActionsProps {
    onNewFolder: () => void;
    onNewFile: () => void;
    onUpload: (files: FileList | null) => void;
}

export function FileActions({ onNewFolder, onNewFile, onUpload }: FileActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onNewFolder}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-[#333] text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626]"
                title="โฟลเดอร์ใหม่"
            >
                <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
            </button>
            <button
                onClick={onNewFile}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-[#333] text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626]"
                title="ไฟล์ข้อความใหม่"
            >
                <span className="material-symbols-outlined text-[18px]">note_add</span>
            </button>
            <label className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-100">
                <span className="material-symbols-outlined text-[18px]">upload</span>
                <span className="hidden md:inline">อัพโหลด</span>
                <input type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
            </label>
        </div>
    );
}

interface BreadcrumbProps {
    currentPath: string;
    onNavigate: (path: string) => void;
}

export function Breadcrumb({ currentPath, onNavigate }: BreadcrumbProps) {
    if (!currentPath) return null;

    return (
        <div className="flex items-center gap-2 mb-4">
            <button
                onClick={() => onNavigate(currentPath.split("/").slice(0, -1).join("/"))}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg"
            >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                ย้อนกลับ
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium">{currentPath.split("/").pop()}</span>
        </div>
    );
}

interface MobileHeaderProps {
    onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
    return (
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-gray-200 dark:border-[#262626] bg-white dark:bg-[#161616]">
            <button onClick={onOpenSidebar} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors">
                <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <span className="text-lg font-semibold">ไฟล์ของฉัน</span>
        </div>
    );
}
