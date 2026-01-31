'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ChatSidebar from '@/components/ChatSidebar';
import {
    Conversation,
    ChatMessage,
    UserFile,
    UploadingFile,
    Model,
    ChatMessageBubble,
    FileSelectionModal,
    SettingsModal,
    ImagePreviewModal,
    FileDetailModal,
    ChatInputForm
} from '@/components/chat';

export default function ChatWithIdPage() {
    const router = useRouter();
    const params = useParams();
    const conversationId = params?.id as string;

    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [userFiles, setUserFiles] = useState<UserFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<UserFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [pickerPath, setPickerPath] = useState('');
    const [pickerFolders, setPickerFolders] = useState<{ name: string; path: string; fileCount: number; folderCount: number }[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(!!conversationId);
    const [notFound, setNotFound] = useState(false);
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [loadingModels, setLoadingModels] = useState(true);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [fileDetailPopup, setFileDetailPopup] = useState<{ id: string; filename: string; size: number } | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showTokens, setShowTokens] = useState(true);
    const [quotaError, setQuotaError] = useState<string | null>(null);
    const [checkingQuota, setCheckingQuota] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const justSentNewMessage = useRef(false);

    const fetchConversations = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoadingConversations(true);
            const res = await fetch('/api/conversations');
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    const fetchMessages = useCallback(async (convId: string) => {
        try {
            setLoadingMessages(true);
            const res = await fetch(`/api/conversations/${convId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setNotFound(true);
                    setCurrentConversationId(null);
                    router.push('/chat');
                }
                return;
            }
            const data = await res.json();
            const fetchedMessages = data.conversation?.messages || data.messages || [];
            setMessages(fetchedMessages);
            if (fetchedMessages.length > 0) {
                const lastAiMessage = [...fetchedMessages].reverse().find((m: ChatMessage) => m.role === 'assistant' && m.model);
                if (lastAiMessage?.model) {
                    setSelectedModel(lastAiMessage.model);
                }
            }
            setNotFound(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    }, [router]);

    const fetchUserFiles = async (path = '') => {
        try {
            setLoadingFiles(true);
            const [filesRes, foldersRes] = await Promise.all([
                fetch('/api/files'),
                fetch(`/api/folders?path=${encodeURIComponent(path)}`)
            ]);
            const filesData = await filesRes.json();
            const foldersData = await foldersRes.json();

            const allFiles = filesData.files || [];
            const filteredFiles = allFiles.filter((f: UserFile) => {
                const filePath = f.storagePath?.split('/').slice(1, -1).join('/') || '';
                return filePath === path;
            });

            setUserFiles(filteredFiles);
            setPickerFolders(foldersData.folders || []);
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        fetch('/api/chat')
            .then(res => res.json())
            .then(data => {
                if (data.models && data.models.length > 0) {
                    const models = data.models.map((m: { id: string; displayName: string; description?: string }) => ({
                        id: m.id,
                        name: m.displayName,
                        description: m.description || '',
                    }));
                    setAvailableModels(models);
                    setSelectedModel(models[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingModels(false));
    }, [fetchConversations]);

    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId);
        }
    }, [conversationId, fetchMessages]);

    useEffect(() => {
        if (currentConversationId && currentConversationId !== conversationId) {
            if (justSentNewMessage.current) {
                justSentNewMessage.current = false;
                return;
            }
            fetchMessages(currentConversationId);
        }
    }, [currentConversationId, conversationId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || sending || checkingQuota) return;

        setQuotaError(null);
        setCheckingQuota(true);

        try {
            const quotaRes = await fetch(`/api/chat/check-quota?model=${encodeURIComponent(selectedModel || '')}`);
            const quotaData = await quotaRes.json();

            if (!quotaData.canSend) {
                setQuotaError(quotaData.message || 'โควต้าหมดแล้ว กรุณาลองใหม่ภายหลัง');
                setCheckingQuota(false);
                return;
            }
        } catch (error) {
            console.error('Quota check failed:', error);
        } finally {
            setCheckingQuota(false);
        }

        const userMessage = message.trim();
        setMessage('');
        setSelectedFiles([]);
        setSending(true);

        let activeConversationId = currentConversationId;

        try {
            if (!activeConversationId) {
                const createRes = await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
                    }),
                });

                if (!createRes.ok) throw new Error('Failed to create conversation');

                const createData = await createRes.json();
                activeConversationId = createData.conversation.id;
                justSentNewMessage.current = true;
                setCurrentConversationId(activeConversationId);
                router.push(`/chat/${activeConversationId}`);
                fetchConversations();
            }

            const tempUserMessage: ChatMessage = {
                id: `temp-user-${Date.now()}`,
                role: 'user',
                content: userMessage,
                createdAt: new Date().toISOString(),
                attachments: selectedFiles.length > 0 ? selectedFiles.map(f => f.id) : undefined,
                attachmentDetails: selectedFiles.length > 0 ? selectedFiles.map(f => ({ id: f.id, filename: f.filename, mimeType: f.mimeType, size: f.size })) : undefined,
            };

            const tempAssistantMessage: ChatMessage = {
                id: `temp-assistant-${Date.now()}`,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString(),
                isStreaming: true,
            };

            setMessages(prev => [...prev, tempUserMessage, tempAssistantMessage]);

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: userMessage,
                    conversationId: activeConversationId,
                    model: selectedModel,
                    attachments: selectedFiles.map(f => f.id),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let streamedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.type === 'chunk') {
                            streamedContent += data.content;
                            setMessages(prev => prev.map(m =>
                                m.id === tempAssistantMessage.id ? { ...m, content: streamedContent } : m
                            ));
                        } else if (data.type === 'error') {
                            streamedContent = data.error;
                            setMessages(prev => prev.map(m =>
                                m.id === tempAssistantMessage.id ? { ...m, content: streamedContent, isStreaming: false, isError: true } : m
                            ));
                            return;
                        }
                    } catch { }
                }
            }

            setMessages(prev => prev.map(m =>
                m.id === tempAssistantMessage.id ? { ...m, content: streamedContent, isStreaming: false, model: selectedModel } : m
            ));

        } catch (error) {
            console.error('Send error:', error);
            setMessages(prev => prev.map(m =>
                m.isStreaming ? { ...m, content: '⚠️ เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง', isStreaming: false, isError: true } : m
            ));
        } finally {
            setSending(false);
        }
    };

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([]);
        router.push('/chat');
        setSelectedFiles([]);
    };

    const handleSelectConversation = async (id: string) => {
        if (id === currentConversationId) return;
        setLoadingMessages(true);
        setMessages([]);
        setCurrentConversationId(id);
        setSelectedFiles([]);
        router.push(`/chat/${id}`);
    };

    const handleDeleteConversation = async (id: string) => {
        try {
            await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            fetchConversations();
            if (currentConversationId === id) handleNewChat();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleRenameConversation = async (id: string, newName: string) => {
        try {
            await fetch(`/api/conversations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newName }),
            });
            fetchConversations();
        } catch (error) {
            console.error('Rename error:', error);
        }
    };

    const handleFileSelect = (file: UserFile) => {
        if (selectedFiles.find(f => f.id === file.id)) {
            setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
        } else {
            setSelectedFiles(prev => [...prev, file]);
            setShowFileModal(false);
        }
    };

    const handleOpenFilePicker = () => {
        setShowFileModal(true);
        setPickerPath('');
        fetchUserFiles('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const tempId = `temp-${Date.now()}`;
        const localUrl = URL.createObjectURL(file);
        const newUpload: UploadingFile = {
            tempId,
            filename: file.name,
            localUrl,
            mimeType: file.type,
            status: 'uploading',
            progress: 0,
        };

        setUploadingFiles(prev => [...prev, newUpload]);

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setUploadingFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, progress } : f));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                setUploadingFiles(prev => prev.filter(f => f.tempId !== tempId));
                const uploadedFile: UserFile = response.file;
                setSelectedFiles(prev => [...prev, uploadedFile]);
                URL.revokeObjectURL(localUrl);
            } else {
                setUploadingFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, status: 'error', errorMessage: 'Upload failed' } : f));
            }
        };

        xhr.onerror = () => {
            setUploadingFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, status: 'error', errorMessage: 'Upload failed' } : f));
        };

        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveUploadingFile = (tempId: string, localUrl: string) => {
        setUploadingFiles(prev => prev.filter(f => f.tempId !== tempId));
        URL.revokeObjectURL(localUrl);
    };

    return (
        <div className="h-screen flex bg-white dark:bg-[#161616] text-gray-900 dark:text-gray-100 overflow-hidden">
            <ChatSidebar
                agents={conversations.map(c => ({ id: c.id, name: c.title }))}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNewChat={() => { handleNewChat(); setSidebarOpen(false); }}
                onSelectConversation={(id) => { handleSelectConversation(id); setSidebarOpen(false); }}
                onDeleteConversation={handleDeleteConversation}
                onRenameConversation={handleRenameConversation}
                currentConversationId={currentConversationId}
                loading={loadingConversations}
                isMobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col bg-white dark:bg-[#161616] overflow-hidden">
                <div className="md:hidden flex items-center gap-3 p-3 border-b border-gray-200 dark:border-[#262626]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">menu</span>
                    </button>
                    <span className="text-lg font-semibold">WatchAI</span>
                </div>
                {loading || loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-gray-400 animate-spin">progress_activity</span>
                    </div>
                ) : notFound ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                        <div className="text-center animate-fade-in">
                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 mb-4 block" style={{ fontSize: '96px' }}>forum</span>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">ไม่พบบทสนทนานี้</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">บทสนทนาที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่</p>
                            <button
                                onClick={() => { setNotFound(false); handleNewChat(); }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                เริ่มบทสนทนาใหม่
                            </button>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                        <div className="text-center mb-8">
                            <span className="material-symbols-outlined text-[64px] text-gray-300 dark:text-gray-600 mb-4">chat</span>
                            <p className="text-gray-500 dark:text-gray-400">พิมพ์ข้อความเพื่อเริ่มคุยกับ AI</p>
                        </div>
                        <div className="w-full max-w-3xl">
                            <ChatInputForm
                                message={message}
                                onMessageChange={setMessage}
                                selectedFiles={selectedFiles}
                                uploadingFiles={uploadingFiles}
                                availableModels={availableModels}
                                loadingModels={loadingModels}
                                selectedModel={selectedModel}
                                showModelDropdown={showModelDropdown}
                                sending={sending}
                                checkingQuota={checkingQuota}
                                quotaError={quotaError}
                                fileInputRef={fileInputRef}
                                onSubmit={handleSubmit}
                                onSelectModel={setSelectedModel}
                                onToggleModelDropdown={() => setShowModelDropdown(!showModelDropdown)}
                                onOpenSettings={() => setShowSettings(true)}
                                onOpenFileModal={handleOpenFilePicker}
                                onUploadFile={handleFileUpload}
                                onRemoveFile={(id) => setSelectedFiles(prev => prev.filter(f => f.id !== id))}
                                onRemoveUploadingFile={handleRemoveUploadingFile}
                                onPreviewImage={setPreviewImage}
                                onFileClick={setFileDetailPopup}
                                onDismissQuotaError={() => setQuotaError(null)}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-scroll px-4 py-6" style={{ scrollbarGutter: 'stable' }}>
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((msg, index) => (
                                    <ChatMessageBubble
                                        key={msg.id || index}
                                        message={msg}
                                        showTokens={showTokens}
                                        onPreviewImage={setPreviewImage}
                                        onFileClick={setFileDetailPopup}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                        <div className="pointer-events-none h-16 bg-gradient-to-t from-white dark:from-[#161616] to-transparent -mt-16 relative z-10"></div>
                        <div className="flex-shrink-0 px-4 pb-4 pr-[20px] bg-white dark:bg-[#161616] relative z-20">
                            <div className="max-w-3xl mx-auto">
                                <ChatInputForm
                                    message={message}
                                    onMessageChange={setMessage}
                                    selectedFiles={selectedFiles}
                                    uploadingFiles={uploadingFiles}
                                    availableModels={availableModels}
                                    loadingModels={loadingModels}
                                    selectedModel={selectedModel}
                                    showModelDropdown={showModelDropdown}
                                    sending={sending}
                                    checkingQuota={checkingQuota}
                                    quotaError={quotaError}
                                    fileInputRef={fileInputRef}
                                    onSubmit={handleSubmit}
                                    onSelectModel={setSelectedModel}
                                    onToggleModelDropdown={() => setShowModelDropdown(!showModelDropdown)}
                                    onOpenSettings={() => setShowSettings(true)}
                                    onOpenFileModal={handleOpenFilePicker}
                                    onUploadFile={handleFileUpload}
                                    onRemoveFile={(id) => setSelectedFiles(prev => prev.filter(f => f.id !== id))}
                                    onRemoveUploadingFile={handleRemoveUploadingFile}
                                    onPreviewImage={setPreviewImage}
                                    onFileClick={setFileDetailPopup}
                                    onDismissQuotaError={() => setQuotaError(null)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </main>
            {showFileModal && (
                <FileSelectionModal
                    pickerPath={pickerPath}
                    pickerFolders={pickerFolders}
                    userFiles={userFiles}
                    loadingFiles={loadingFiles}
                    onClose={() => setShowFileModal(false)}
                    onNavigate={(path) => { setPickerPath(path); fetchUserFiles(path); }}
                    onSelectFile={handleFileSelect}
                />
            )}
            {showSettings && (
                <SettingsModal
                    showTokens={showTokens}
                    messages={messages}
                    onClose={() => setShowSettings(false)}
                    onToggleTokens={() => setShowTokens(!showTokens)}
                />
            )}
            {previewImage && (
                <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
            )}
            {fileDetailPopup && (
                <FileDetailModal file={fileDetailPopup} onClose={() => setFileDetailPopup(null)} />
            )}
        </div>
    );
}
