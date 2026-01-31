'use client';

import { useState, useEffect, memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Folder } from './types';

interface CodeBlockProps {
    language: string;
    code: string;
    isStreaming?: boolean;
}

const EXTENSION_MAP: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py', java: 'java', cpp: 'cpp', c: 'c',
    html: 'html', css: 'css', json: 'json', markdown: 'md', sql: 'sql', bash: 'sh',
    shell: 'sh', yaml: 'yml', xml: 'xml', php: 'php', ruby: 'rb', go: 'go', rust: 'rs',
    swift: 'swift', kotlin: 'kt', jsx: 'jsx', tsx: 'tsx'
};

export const CodeBlock = memo(function CodeBlock({ language, code, isStreaming }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savePath, setSavePath] = useState('');
    const [saveFolders, setSaveFolders] = useState<Folder[]>([]);
    const [saveFilename, setSaveFilename] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return true;
    });

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));

        if (!isStreaming) {
            const observer = new MutationObserver(() => {
                setIsDarkMode(document.documentElement.classList.contains('dark'));
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            return () => observer.disconnect();
        }
    }, [isStreaming]);

    const getExtension = (lang: string) => EXTENSION_MAP[lang.toLowerCase()] || 'txt';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fetchFolders = async (path = '') => {
        try {
            setLoadingFolders(true);
            const res = await fetch(`/api/folders?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            setSaveFolders(data.folders || []);
        } catch (error) {
            console.error('Error fetching folders:', error);
        } finally {
            setLoadingFolders(false);
        }
    };

    const handleOpenSaveModal = () => {
        setSavePath('');
        setSaveFilename(`code.${getExtension(language)}`);
        setShowSaveModal(true);
        fetchFolders('');
    };

    const handleNavigateFolder = (path: string) => {
        setSavePath(path);
        fetchFolders(path);
    };

    const handleSaveFile = async () => {
        if (!saveFilename.trim()) return;
        try {
            setSaving(true);
            const res = await fetch('/api/files/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: saveFilename.trim(), content: code, path: savePath }),
            });
            if (res.ok) setShowSaveModal(false);
        } catch (error) {
            console.error('Save file error:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333]">
                <CodeBlockHeader
                    language={language}
                    copied={copied}
                    onCopy={copyToClipboard}
                    onSave={handleOpenSaveModal}
                />
                <div className="bg-[#fafafa] dark:bg-[#282c34]">
                    {isStreaming ? (
                        <pre className="p-4 text-sm leading-relaxed overflow-x-auto text-[#383a42] dark:text-[#abb2bf]">
                            <code>{code}</code>
                        </pre>
                    ) : (
                        <SyntaxHighlighter
                            language={language}
                            style={isDarkMode ? oneDark : oneLight}
                            customStyle={{
                                margin: 0,
                                padding: '1rem',
                                fontSize: '0.875rem',
                                lineHeight: '1.6',
                                background: 'transparent',
                            }}
                            showLineNumbers={code.split('\n').length > 5}
                            lineNumberStyle={{ color: isDarkMode ? '#636d83' : '#999', fontSize: '0.75rem' }}
                        >
                            {code}
                        </SyntaxHighlighter>
                    )}
                </div>
            </div>

            {showSaveModal && (
                <SaveFileModal
                    savePath={savePath}
                    saveFilename={saveFilename}
                    saveFolders={saveFolders}
                    saving={saving}
                    loadingFolders={loadingFolders}
                    onFilenameChange={setSaveFilename}
                    onNavigateFolder={handleNavigateFolder}
                    onSave={handleSaveFile}
                    onClose={() => setShowSaveModal(false)}
                />
            )}
        </>
    );
});

function CodeBlockHeader({ language, copied, onCopy, onSave }: {
    language: string;
    copied: boolean;
    onCopy: () => void;
    onSave: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-[#2d2d2d] text-gray-600 dark:text-gray-300">
            <span className="text-xs font-medium">{language}</span>
            <div className="flex items-center gap-3">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    บันทึก
                </button>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">
                        {copied ? 'check' : 'content_copy'}
                    </span>
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
            </div>
        </div>
    );
}

function SaveFileModal({ savePath, saveFilename, saveFolders, saving, loadingFolders, onFilenameChange, onNavigateFolder, onSave, onClose }: {
    savePath: string;
    saveFilename: string;
    saveFolders: Folder[];
    saving: boolean;
    loadingFolders: boolean;
    onFilenameChange: (name: string) => void;
    onNavigateFolder: (path: string) => void;
    onSave: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#262626]">
                    <div className="flex items-center gap-2">
                        {savePath && (
                            <button
                                onClick={() => onNavigateFolder(savePath.split('/').slice(0, -1).join('/'))}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-lg"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            </button>
                        )}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">บันทึกไฟล์</h3>
                            <p className="text-xs text-gray-500">/{savePath || 'ไฟล์ของฉัน'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-4">
                    <input
                        type="text"
                        value={saveFilename}
                        onChange={(e) => onFilenameChange(e.target.value)}
                        placeholder="ชื่อไฟล์"
                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#262626] border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                        {loadingFolders ? (
                            <div className="flex items-center justify-center py-4">
                                <span className="material-symbols-outlined text-[24px] text-gray-400 animate-spin">progress_activity</span>
                            </div>
                        ) : saveFolders.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">ไม่มีโฟลเดอร์ย่อย</p>
                        ) : (
                            saveFolders.map(folder => (
                                <button
                                    key={folder.path}
                                    onClick={() => onNavigateFolder(folder.path)}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-yellow-500">folder</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{folder.name}</span>
                                    <span className="material-symbols-outlined text-[16px] text-gray-400 ml-auto">chevron_right</span>
                                </button>
                            ))
                        )}
                    </div>
                    <button
                        onClick={onSave}
                        disabled={saving || !saveFilename.trim()}
                        className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                บันทึกที่นี่
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
