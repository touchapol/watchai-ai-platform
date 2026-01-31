"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import {
    FileItem,
    FolderItem,
    SortBy,
    SortOrder,
    ViewMode,
    formatFileSize,
    isTextFile,
} from "@/components/files/types";
import {
    DeleteConfirmModal,
    BulkDeleteModal,
    RenameModal,
    NewFolderModal,
    NewFileModal,
    DeleteFolderModal,
    ErrorModal,
    FileEditorModal,
    FilePreviewModal,
} from "@/components/files/FileModals";
import {
    MobileFileActionMenu,
    MobileFolderActionMenu,
    MobileInfoPanel,
    DesktopInfoPanel,
} from "@/components/files/FilePanels";
import {
    FileGrid,
    FileList,
    LoadingSkeleton,
    EmptyState,
    DragOverlay,
} from "@/components/files/FileViews";
import {
    FileHeader,
    FileToolbar,
    FileActions,
    Breadcrumb,
    MobileHeader,
} from "@/components/files/FileToolbar";

export default function FilesPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [currentPath, setCurrentPath] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<SortBy>("date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [renameFile, setRenameFile] = useState<FileItem | null>(null);
    const [newFileName, setNewFileName] = useState("");
    const [renaming, setRenaming] = useState(false);
    const [infoPanel, setInfoPanel] = useState<FileItem | null>(null);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [newFolderModal, setNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFileModal, setNewFileModal] = useState(false);
    const [newFileContent, setNewFileContent] = useState("");
    const [editorFile, setEditorFile] = useState<FileItem | null>(null);
    const [editorContent, setEditorContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<FolderItem | null>(null);
    const [deletingFolder, setDeletingFolder] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileActionMenu, setMobileActionMenu] = useState<FileItem | null>(null);
    const [mobileFolderMenu, setMobileFolderMenu] = useState<FolderItem | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    const fetchFiles = useCallback(async () => {
        try {
            const res = await fetch("/api/files");
            const data = await res.json();
            setFiles(data.files || []);
        } catch {
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFolders = useCallback(async (path: string = "") => {
        try {
            const res = await fetch(`/api/folders?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            setFolders(data.folders || []);
        } catch {
            setFolders([]);
        }
    }, []);

    const navigateToFolder = useCallback((path: string) => {
        setFolders([]);
        setCurrentPath(path);
    }, []);

    useEffect(() => {
        fetchFiles();
        fetchFolders(currentPath);
        fetch('/api/logs/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'VIEW_FILES', resource: '/files', details: {} })
        }).catch(() => { });
    }, [fetchFiles, fetchFolders, currentPath]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setShowSortMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredFolders = useMemo(() => {
        if (!searchQuery) return folders;
        return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [folders, searchQuery]);

    const filteredAndSortedFiles = useMemo(() => {
        let result = files;

        if (currentPath) {
            result = files.filter(f => {
                if (!f.storagePath) return false;
                const parts = f.storagePath.split('/');
                const relativePath = parts.slice(1).join('/');
                const fileDir = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : '';
                return fileDir === currentPath;
            });
        } else {
            result = files.filter(f => {
                if (!f.storagePath) return true;
                const parts = f.storagePath.split('/');
                return parts.length <= 2;
            });
        }

        if (searchQuery) {
            result = result.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return [...result].sort((a, b) => {
            let cmp = 0;
            if (sortBy === "name") cmp = a.filename.localeCompare(b.filename);
            else if (sortBy === "date") cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            else if (sortBy === "size") cmp = b.size - a.size;
            else if (sortBy === "type") cmp = a.mimeType.localeCompare(b.mimeType);
            return sortOrder === "asc" ? -cmp : cmp;
        });
    }, [files, currentPath, searchQuery, sortBy, sortOrder]);

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(fileList)) {
                const formData = new FormData();
                formData.append("file", file);
                if (currentPath) formData.append("path", currentPath);
                await fetch("/api/files/upload", { method: "POST", body: formData });
            }
            await fetchFiles();
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await fetch(`/api/files/${deleteConfirm.id}`, { method: "DELETE" });
            await fetchFiles();
            setDeleteConfirm(null);
            if (infoPanel?.id === deleteConfirm.id) setInfoPanel(null);
        } finally {
            setDeleting(false);
        }
    };

    const confirmBulkDelete = async () => {
        setBulkDeleting(true);
        try {
            await Promise.all(Array.from(selectedFiles).map(id => fetch(`/api/files/${id}`, { method: "DELETE" })));
            await fetchFiles();
            setSelectedFiles(new Set());
            setBulkDeleteConfirm(false);
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleRename = async () => {
        if (!renameFile || !newFileName.trim()) return;
        setRenaming(true);
        try {
            await fetch(`/api/files/${renameFile.id}/rename`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: newFileName.trim() }),
            });
            await fetchFiles();
            setRenameFile(null);
        } finally {
            setRenaming(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        handleUpload(e.dataTransfer.files);
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedFiles(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedFiles.size === filteredAndSortedFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(filteredAndSortedFiles.map(f => f.id)));
        }
    };

    const handleDownload = async (file: FileItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const res = await fetch(`/api/files/${file.id}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const res = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newFolderName.trim(), parentPath: currentPath }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.error || "ไม่สามารถสร้างโฟลเดอร์ได้");
                return;
            }
            await fetchFolders(currentPath);
            setNewFolderModal(false);
            setNewFolderName("");
        } catch {
            setErrorMessage("เกิดข้อผิดพลาดในการสร้างโฟลเดอร์");
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName.trim()) return;
        try {
            const res = await fetch("/api/files/create-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: newFileName.trim(), content: newFileContent, path: currentPath }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.error || "ไม่สามารถสร้างไฟล์ได้");
                return;
            }
            await fetchFiles();
            setNewFileModal(false);
            setNewFileName("");
            setNewFileContent("");
        } catch {
            setErrorMessage("เกิดข้อผิดพลาดในการสร้างไฟล์");
        }
    };

    const handleOpenEditor = async (file: FileItem) => {
        try {
            const res = await fetch(`/api/files/${file.id}`);
            const text = await res.text();
            setEditorContent(text);
            setEditorFile(file);
        } catch {
            setErrorMessage("ไม่สามารถเปิดไฟล์ได้");
        }
    };

    const handleSaveFile = async () => {
        if (!editorFile) return;
        setSaving(true);
        try {
            await fetch(`/api/files/${editorFile.id}/content`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editorContent }),
            });
            await fetchFiles();
            setEditorFile(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFolder = async () => {
        if (!deleteFolderConfirm) return;
        setDeletingFolder(true);
        try {
            await fetch(`/api/folders?path=${encodeURIComponent(deleteFolderConfirm.path)}`, { method: 'DELETE' });
            await fetchFolders(currentPath);
            await fetchFiles();
            setDeleteFolderConfirm(null);
        } finally {
            setDeletingFolder(false);
        }
    };

    const handleFileClick = (file: FileItem) => {
        isTextFile(file.mimeType) ? handleOpenEditor(file) : setPreviewFile(file);
    };

    const handleStartRename = (file: FileItem) => {
        setRenameFile(file);
        setNewFileName(file.filename);
        setInfoPanel(null);
    };

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-hidden">
            <ChatSidebar
                agents={[]}
                searchQuery=""
                onSearchChange={() => { }}
                activePage="files"
                isMobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />

                <div className="m-4 space-y-2">
                    <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#262626] rounded-xl px-6 py-4">
                        <div className="flex items-center justify-between">
                            <FileHeader
                                fileCount={files.length}
                                totalSize={formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                                selectedCount={selectedFiles.size}
                            />
                            <FileActions
                                onNewFolder={() => setNewFolderModal(true)}
                                onNewFile={() => { setNewFileModal(true); setNewFileName("untitled.txt"); }}
                                onUpload={handleUpload}
                            />
                        </div>
                    </div>

                    <FileToolbar
                        selectedCount={selectedFiles.size}
                        totalCount={filteredAndSortedFiles.length}
                        searchQuery={searchQuery}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        viewMode={viewMode}
                        showSortMenu={showSortMenu}
                        onSelectAll={selectAll}
                        onBulkDelete={() => setBulkDeleteConfirm(true)}
                        onSearchChange={setSearchQuery}
                        onSortClick={() => setShowSortMenu(!showSortMenu)}
                        onSortByChange={(s) => { setSortBy(s); setShowSortMenu(false); }}
                        onSortOrderToggle={() => { setSortOrder(o => o === "asc" ? "desc" : "asc"); setShowSortMenu(false); }}
                        onViewModeChange={setViewMode}
                        sortMenuRef={sortMenuRef as React.RefObject<HTMLDivElement>}
                    />
                </div>

                <div
                    className="flex-1 overflow-y-auto p-6"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <Breadcrumb currentPath={currentPath} onNavigate={navigateToFolder} />

                    {dragActive && <DragOverlay />}

                    {loading ? (
                        <LoadingSkeleton />
                    ) : filteredFolders.length === 0 && filteredAndSortedFiles.length === 0 ? (
                        <EmptyState searchQuery={searchQuery} onUpload={handleUpload} />
                    ) : viewMode === "grid" ? (
                        <FileGrid
                            folders={filteredFolders}
                            files={filteredAndSortedFiles}
                            selectedFiles={selectedFiles}
                            onFolderClick={(f) => navigateToFolder(f.path)}
                            onFolderDelete={setDeleteFolderConfirm}
                            onFolderMobileMenu={setMobileFolderMenu}
                            onFileClick={handleFileClick}
                            onFileSelect={toggleSelect}
                            onFileContextMenu={() => { }}
                            onFileRename={handleStartRename}
                            onFileInfo={setInfoPanel}
                            onFileDelete={setDeleteConfirm}
                            onFileMobileMenu={setMobileActionMenu}
                        />
                    ) : (
                        <FileList
                            folders={filteredFolders}
                            files={filteredAndSortedFiles}
                            selectedFiles={selectedFiles}
                            onSelectAll={selectAll}
                            onFolderClick={(f) => navigateToFolder(f.path)}
                            onFileClick={handleFileClick}
                            onFileSelect={toggleSelect}
                            onFileInfo={setInfoPanel}
                            onFileDownload={handleDownload}
                            onFileDelete={setDeleteConfirm}
                        />
                    )}
                </div>

                {infoPanel && (
                    <MobileInfoPanel
                        file={infoPanel}
                        onDownload={handleDownload}
                        onClose={() => setInfoPanel(null)}
                    />
                )}
            </main>

            {infoPanel && (
                <DesktopInfoPanel
                    file={infoPanel}
                    onDownload={handleDownload}
                    onRename={handleStartRename}
                    onDelete={setDeleteConfirm}
                    onClose={() => setInfoPanel(null)}
                />
            )}

            <DeleteConfirmModal file={deleteConfirm} deleting={deleting} onConfirm={handleConfirmDelete} onClose={() => setDeleteConfirm(null)} />
            <BulkDeleteModal isOpen={bulkDeleteConfirm} count={selectedFiles.size} deleting={bulkDeleting} onConfirm={confirmBulkDelete} onClose={() => setBulkDeleteConfirm(false)} />
            <RenameModal file={renameFile} newFileName={newFileName} renaming={renaming} onFileNameChange={setNewFileName} onConfirm={handleRename} onClose={() => setRenameFile(null)} />
            <NewFolderModal isOpen={newFolderModal} folderName={newFolderName} onFolderNameChange={setNewFolderName} onConfirm={handleCreateFolder} onClose={() => { setNewFolderModal(false); setNewFolderName(""); }} />
            <NewFileModal isOpen={newFileModal} fileName={newFileName} fileContent={newFileContent} onFileNameChange={setNewFileName} onFileContentChange={setNewFileContent} onConfirm={handleCreateFile} onClose={() => { setNewFileModal(false); setNewFileName(""); setNewFileContent(""); }} />
            <DeleteFolderModal folder={deleteFolderConfirm} deleting={deletingFolder} onConfirm={handleDeleteFolder} onClose={() => setDeleteFolderConfirm(null)} />
            <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
            <FileEditorModal file={editorFile} content={editorContent} saving={saving} onContentChange={setEditorContent} onSave={handleSaveFile} onClose={() => setEditorFile(null)} />
            <FilePreviewModal file={previewFile} onDownload={handleDownload} onClose={() => setPreviewFile(null)} />
            <MobileFileActionMenu file={mobileActionMenu} onViewInfo={setInfoPanel} onRename={handleStartRename} onDownload={handleDownload} onDelete={setDeleteConfirm} onClose={() => setMobileActionMenu(null)} />
            <MobileFolderActionMenu folder={mobileFolderMenu} onOpen={(f) => navigateToFolder(f.path)} onDelete={setDeleteFolderConfirm} onClose={() => setMobileFolderMenu(null)} />
        </div>
    );
}
