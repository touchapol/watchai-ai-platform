'use client';

import { useState, memo, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, formatFileSize } from './types';
import { CodeBlock } from './CodeBlock';
import { ImageWithFallback } from './ImageWithFallback';

interface ChatMessageBubbleProps {
    message: ChatMessage;
    onPreviewImage?: (src: string) => void;
    onRetry?: () => void;
    onFileClick?: (file: { id: string; filename: string; size: number }) => void;
    showTokens?: boolean;
}

export const ChatMessageBubble = memo(function ChatMessageBubble({
    message,
    onPreviewImage,
    onRetry,
    onFileClick,
    showTokens = true
}: ChatMessageBubbleProps) {
    const isUser = message.role === 'user';
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    if (isUser) {
        return (
            <UserMessage
                message={message}
                failedImages={failedImages}
                setFailedImages={setFailedImages}
                onPreviewImage={onPreviewImage}
                onFileClick={onFileClick}
            />
        );
    }

    if (message.content.startsWith('⚠️')) {
        return <ErrorMessage message={message} onRetry={onRetry} />;
    }

    return <AIMessage message={message} showTokens={showTokens} />;
});

function UserMessage({
    message,
    failedImages,
    setFailedImages,
    onPreviewImage,
    onFileClick
}: {
    message: ChatMessage;
    failedImages: Set<string>;
    setFailedImages: React.Dispatch<React.SetStateAction<Set<string>>>;
    onPreviewImage?: (src: string) => void;
    onFileClick?: (file: { id: string; filename: string; size: number }) => void;
}) {
    return (
        <div className="flex flex-col items-end gap-2">
            {message.attachments && message.attachments.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-end max-w-[80%]">
                    {message.attachments.map((attachmentId) => (
                        <AttachmentItem
                            key={attachmentId}
                            attachmentId={attachmentId}
                            detail={message.attachmentDetails?.find(d => d.id === attachmentId)}
                            failedImages={failedImages}
                            setFailedImages={setFailedImages}
                            onPreviewImage={onPreviewImage}
                            onFileClick={onFileClick}
                        />
                    ))}
                </div>
            )}
            <div className="inline-block bg-gray-200 dark:bg-[#303030] text-gray-900 dark:text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
}

function AttachmentItem({
    attachmentId,
    detail,
    failedImages,
    setFailedImages,
    onPreviewImage,
    onFileClick
}: {
    attachmentId: string;
    detail?: { id: string; filename: string; mimeType: string; size: number };
    failedImages: Set<string>;
    setFailedImages: React.Dispatch<React.SetStateAction<Set<string>>>;
    onPreviewImage?: (src: string) => void;
    onFileClick?: (file: { id: string; filename: string; size: number }) => void;
}) {
    if (detail && !detail.mimeType?.startsWith('image/')) {
        return (
            <div
                onClick={() => onFileClick?.({ id: detail.id, filename: detail.filename, size: detail.size })}
                className="w-24 h-24 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
            >
                <span className="material-symbols-outlined text-[40px] text-gray-400">description</span>
                <span className="text-[12px] text-gray-500 dark:text-gray-300 truncate max-w-[88px] mt-0.5 px-1 text-center leading-tight font-medium">
                    {detail.filename.length > 10 ? detail.filename.slice(0, 8) + '...' : detail.filename}
                </span>
                <span className="text-[11px] text-gray-400">{formatFileSize(detail.size)}</span>
            </div>
        );
    }

    if (failedImages.has(attachmentId)) {
        return (
            <a
                href={`/api/files/${attachmentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-24 h-24 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
            >
                <span className="material-symbols-outlined text-[40px] text-gray-400">description</span>
                <span className="text-[12px] text-gray-500 dark:text-gray-300 mt-0.5 font-medium">ไฟล์แนบ</span>
            </a>
        );
    }

    return (
        <img
            src={`/api/files/${attachmentId}`}
            alt="attachment"
            className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onPreviewImage?.(`/api/files/${attachmentId}`)}
            onError={() => setFailedImages(prev => new Set(prev).add(attachmentId))}
        />
    );
}

function ErrorMessage({ message, onRetry }: { message: ChatMessage; onRetry?: () => void }) {
    return (
        <div className="w-full">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[24px] text-amber-500 flex-shrink-0">warning</span>
                    <div className="flex-1">
                        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                            {message.content.replace('⚠️ ', '')}
                        </p>
                        <button
                            onClick={onRetry}
                            className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AIMessage({ message, showTokens }: { message: ChatMessage; showTokens: boolean }) {
    const processCitations = (child: ReactNode): ReactNode => {
        if (typeof child === 'string') {
            const parts = child.split(/(\[\d+\])/g);
            return parts.map((part, idx) => {
                const match = part.match(/^\[(\d+)\]$/);
                if (match) {
                    const num = parseInt(match[1]);
                    const citation = message.citations?.[num - 1];
                    if (citation?.url) {
                        return (
                            <a
                                key={idx}
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors mx-0.5 no-underline align-super"
                                title={citation.source}
                            >
                                {num}
                            </a>
                        );
                    }
                    return (
                        <span
                            key={idx}
                            className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full mx-0.5 align-super"
                        >
                            {num}
                        </span>
                    );
                }
                return part;
            });
        }
        return child;
    };

    return (
        <div className="w-full">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:my-3 prose-p:leading-relaxed prose-pre:my-4 prose-pre:rounded-xl prose-pre:bg-[#1e1e1e] prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!match) {
                                return (
                                    <code className="bg-pink-100 dark:bg-pink-900/30 px-1.5 py-0.5 rounded text-sm text-pink-600 dark:text-pink-400 font-medium" {...props}>
                                        {children}
                                    </code>
                                );
                            }
                            return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} isStreaming={message.isStreaming} />;
                        },
                        pre: ({ children }) => <>{children}</>,
                        ul: ({ children }) => <ul className="list-disc ml-6 my-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-6 my-2 space-y-1">{children}</ol>,
                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{children}</a>,
                        blockquote: ({ children }) => <blockquote className="my-4">{children}</blockquote>,
                        hr: () => <hr className="my-6 border-gray-200 dark:border-gray-700" />,
                        table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">{children}</table></div>,
                        th: ({ children, style }) => <th style={style} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold">{children}</th>,
                        td: ({ children, style }) => <td style={style} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{children}</td>,
                        img: ({ src, alt }) => <ImageWithFallback src={typeof src === 'string' ? src : ''} alt={alt || ''} />,
                        p: ({ children }) => <p>{Array.isArray(children) ? children.map(processCitations) : processCitations(children)}</p>,
                        li: ({ children }) => <li>{Array.isArray(children) ? children.map(processCitations) : processCitations(children)}</li>,
                    }}
                >
                    {message.content}
                </ReactMarkdown>
                <StreamingIndicator message={message} />
            </div>
            {(() => {
                const tokenCount = message.tokens?.total || (message as { totalTokens?: number }).totalTokens;
                return showTokens && typeof tokenCount === 'number' && tokenCount > 0 && !message.isStreaming && (
                    <TokenCount tokens={tokenCount} />
                );
            })()}
            {message.citations && message.citations.length > 0 && !message.isStreaming && <Citations citations={message.citations} />}
        </div>
    );
}

function StreamingIndicator({ message }: { message: ChatMessage }) {
    if (message.isStreaming && !message.content) {
        return (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">กำลังประมวลผล...</span>
            </div>
        );
    }
    if (message.isStreaming && message.content) {
        return <span className="inline-block w-2 h-4 bg-gray-500 dark:bg-gray-400 animate-pulse ml-1" />;
    }
    return null;
}

function TokenCount({ tokens }: { tokens: number }) {
    return (
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
            <span className="material-symbols-outlined text-[12px]">token</span>
            <span>{tokens.toLocaleString()} tokens</span>
        </div>
    );
}

function Citations({ citations }: { citations: NonNullable<ChatMessage['citations']> }) {
    return (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span className="material-symbols-outlined text-[14px]">format_quote</span>
                <span className="font-medium">แหล่งอ้างอิง ({citations.length})</span>
            </div>
            <div className="space-y-2">
                {citations.map((citation, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-medium text-gray-700 dark:text-gray-300">
                                {i + 1}
                            </span>
                            {citation.url ? (
                                <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[250px]"
                                >
                                    {citation.source}
                                </a>
                            ) : (
                                <span className="font-medium text-gray-700 dark:text-gray-300">{citation.source}</span>
                            )}
                            {citation.url && <span className="material-symbols-outlined text-[12px] text-gray-400">open_in_new</span>}
                        </div>
                        {citation.content && <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{citation.content}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
