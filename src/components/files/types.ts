export interface FileItem {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    type: "DOCUMENT" | "IMAGE";
    createdAt: string;
    folderId?: string | null;
    storagePath: string;
}

export interface FolderItem {
    name: string;
    path: string;
    fileCount: number;
    folderCount: number;
    createdAt: string;
}

export type SortBy = "name" | "date" | "size" | "type";
export type SortOrder = "asc" | "desc";
export type ViewMode = "grid" | "list";

export interface ContextMenuState {
    x: number;
    y: number;
    file: FileItem;
}

export const SORT_LABELS: Record<SortBy, string> = {
    name: "ชื่อ",
    date: "วันที่",
    size: "ขนาด",
    type: "ประเภท",
};

export const TEXT_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv",
    "text/html",
    "text/css",
    "application/xml",
    "application/javascript",
    "text/javascript",
    "application/x-javascript",
];

export function isTextFile(mimeType: string): boolean {
    return TEXT_MIME_TYPES.includes(mimeType) || mimeType.startsWith("text/");
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

export function formatDate(dateString: string): string {
    const d = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "เมื่อกี้";
    if (diff < 3600000) return Math.floor(diff / 60000) + " นาทีที่แล้ว";
    if (diff < 86400000) return Math.floor(diff / 3600000) + " ชม.ที่แล้ว";
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "movie";
    if (mimeType.startsWith("audio/")) return "audio_file";
    if (mimeType === "application/pdf") return "picture_as_pdf";
    if (mimeType.includes("word") || mimeType.includes("document")) return "description";
    if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType === "text/csv") return "table_chart";
    return "draft";
}

export function getFileColor(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "bg-pink-100 dark:bg-pink-900/30 text-pink-600";
    if (mimeType === "application/pdf") return "bg-red-100 dark:bg-red-900/30 text-red-600";
    if (mimeType.includes("word") || mimeType.includes("document")) return "bg-blue-100 dark:bg-blue-900/30 text-blue-600";
    if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType === "text/csv") return "bg-green-100 dark:bg-green-900/30 text-green-600";
    return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
}
