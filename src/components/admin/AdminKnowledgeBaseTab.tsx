'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

interface KBDocument {
    id: string;
    filename: string;
    size: number;
    isIndexed: boolean;
    indexedAt: string | null;
    createdAt: string;
}

export function AdminKnowledgeBaseTab() {
    const [documents, setDocuments] = useState<KBDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [indexing, setIndexing] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [totalChunks, setTotalChunks] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileType, setNewFileType] = useState<'.txt' | '.md'>('.txt');
    const [newFileContent, setNewFileContent] = useState('');
    const [creating, setCreating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; doc: KBDocument | null }>({ show: false, doc: null });
    const [preview, setPreview] = useState<{ show: boolean; doc: KBDocument | null; content: string; loading: boolean }>({ show: false, doc: null, content: '', loading: false });

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/knowledge-base');
            const data = await res.json();
            setDocuments(data.documents || []);
            setTotalChunks(data.totalChunks || 0);
        } catch (error) {
            console.error('Fetch documents error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                await fetch('/api/admin/knowledge-base', {
                    method: 'POST',
                    body: formData,
                });
            }
            fetchDocuments();
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName.trim() || !newFileContent.trim()) return;

        setCreating(true);
        try {
            const filename = newFileName.endsWith(newFileType) ? newFileName : `${newFileName}${newFileType}`;
            const blob = new Blob([newFileContent], { type: 'text/plain' });
            const file = new File([blob], filename, { type: 'text/plain' });

            const formData = new FormData();
            formData.append('file', file);
            await fetch('/api/admin/knowledge-base', {
                method: 'POST',
                body: formData,
            });

            setShowCreateModal(false);
            setNewFileName('');
            setNewFileContent('');
            fetchDocuments();
        } catch (error) {
            console.error('Create file error:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleIndex = async (docId: string) => {
        setIndexing(docId);
        try {
            await fetch('/api/admin/knowledge-base/index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docId }),
            });
            fetchDocuments();
        } catch (error) {
            console.error('Index error:', error);
        } finally {
            setIndexing(null);
        }
    };

    const handleDelete = async (docId: string) => {
        setDeleteConfirm({ show: false, doc: null });
        setIndexing(docId);
        try {
            await fetch(`/api/admin/knowledge-base?id=${docId}`, { method: 'DELETE' });
            fetchDocuments();
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setIndexing(null);
        }
    };

    const confirmDelete = (doc: KBDocument) => {
        setDeleteConfirm({ show: true, doc });
    };

    const handlePreview = async (doc: KBDocument) => {
        setPreview({ show: true, doc, content: '', loading: true });
        try {
            const res = await fetch(`/api/admin/knowledge-base/preview?id=${doc.id}`);
            const data = await res.json();
            setPreview(p => ({ ...p, content: data.content || '', loading: false }));
        } catch {
            setPreview(p => ({ ...p, content: 'ไม่สามารถโหลดเนื้อหาได้', loading: false }));
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const indexedCount = documents.filter(d => d.isIndexed).length;
    const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE);
    const paginatedDocs = documents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">คลังความรู้</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        จัดการเอกสารสำหรับ RAG ({indexedCount}/{documents.length} indexed, {totalChunks} chunks)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.pdf,.doc,.docx"
                        multiple
                        onChange={handleUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        สร้างไฟล์
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${uploading ? 'animate-spin' : ''}`}>
                            {uploading ? 'progress_activity' : 'upload_file'}
                        </span>
                        {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดเอกสาร'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">description</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
                            <p className="text-xs text-gray-500">เอกสารทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">check_circle</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{indexedCount}</p>
                            <p className="text-xs text-gray-500">Indexed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">data_array</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalChunks}</p>
                            <p className="text-xs text-gray-500">Chunks</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#2a2a2a]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                    <div className="h-3 w-1/4 bg-gray-200 dark:bg-[#2a2a2a] rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl">
                    <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600">folder_off</span>
                    <p className="text-gray-500 mt-2">ยังไม่มีเอกสาร</p>
                    <p className="text-sm text-gray-400 mt-1">คลิกปุ่ม &quot;อัพโหลดเอกสาร&quot; หรือ &quot;สร้างไฟล์&quot; เพื่อเริ่มต้น</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginatedDocs.map(doc => (
                        <div key={doc.id} className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-xl p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a]">
                                    <span className={`material-symbols-outlined ${doc.isIndexed ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        {doc.isIndexed ? 'check_circle' : 'description'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{doc.filename}</h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span>{formatSize(doc.size)}</span>
                                        {doc.isIndexed && doc.indexedAt && (
                                            <>
                                                <span>•</span>
                                                <span>Indexed: {formatDate(doc.indexedAt)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {doc.isIndexed ? (
                                        <button
                                            onClick={() => handleIndex(doc.id)}
                                            disabled={indexing === doc.id}
                                            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
                                        >
                                            {indexing === doc.id ? 'กำลัง...' : 'Re-index'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleIndex(doc.id)}
                                            disabled={indexing === doc.id}
                                            className="px-3 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {indexing === doc.id ? (
                                                <>
                                                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                                    กำลัง Index...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                                                    Index
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handlePreview(doc)}
                                        className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                        ดู
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(doc)}
                                        disabled={indexing === doc.id}
                                        className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#272726]">
                            <p className="text-sm text-gray-500">
                                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, documents.length)} จาก {documents.length} รายการ
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                        .map((page, idx, arr) => (
                                            <>
                                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                    <span key={`ellipsis-${page}`} className="px-1 text-gray-400">...</span>
                                                )}
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                        : 'hover:bg-gray-100 dark:hover:bg-[#262626] text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            </>
                                        ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mounted && showCreateModal && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            สร้างไฟล์ใหม่
                        </h3>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">ชื่อไฟล์</label>
                                    <input
                                        type="text"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        placeholder="เช่น company-info"
                                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">ประเภท</label>
                                    <select
                                        value={newFileType}
                                        onChange={(e) => setNewFileType(e.target.value as '.txt' | '.md')}
                                        className="w-full px-3 py-2.5 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                    >
                                        <option value=".txt">.txt</option>
                                        <option value=".md">.md</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">เนื้อหา</label>
                                <textarea
                                    value={newFileContent}
                                    onChange={(e) => setNewFileContent(e.target.value)}
                                    placeholder="พิมพ์เนื้อหาที่นี่..."
                                    rows={10}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewFileName('');
                                    setNewFileContent('');
                                }}
                                className="flex-1 py-3 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleCreateFile}
                                disabled={creating || !newFileName.trim() || !newFileContent.trim()}
                                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'กำลังสร้าง...' : 'สร้างไฟล์'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && deleteConfirm.show && deleteConfirm.doc && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[24px]">delete_forever</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ยืนยันการลบ</h3>
                                <p className="text-sm text-gray-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#262626] rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-400">description</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{deleteConfirm.doc.filename}</p>
                                    <p className="text-xs text-gray-500">{formatSize(deleteConfirm.doc.size)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, doc: null })}
                                className="flex-1 py-3 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.doc!.id)}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                ลบไฟล์
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && preview.show && preview.doc && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#262626] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">description</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{preview.doc.filename}</h3>
                                    <p className="text-xs text-gray-500">{formatSize(preview.doc.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreview({ show: false, doc: null, content: '', loading: false })}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors"
                            >
                                <span className="material-symbols-outlined text-gray-500">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {preview.loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-[#0d0d0d] rounded-xl p-4 overflow-auto max-h-[60vh]">
                                    {preview.content}
                                </pre>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-[#333]">
                            <button
                                onClick={() => setPreview({ show: false, doc: null, content: '', loading: false })}
                                className="w-full py-3 bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
