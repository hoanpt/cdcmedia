// src/utils/fileIcon.tsx — returns lucide icon based on MIME type
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  File,
} from "lucide-react";

export type FileCategory = "image" | "video" | "audio" | "pdf" | "word" | "excel" | "powerpoint" | "archive" | "other";

export function getFileCategory(mimeType: string, filename?: string): FileCategory {
  const mime = mimeType.toLowerCase();
  const ext = filename ? filename.split(".").pop()?.toLowerCase() : "";

  // Check extension first (more reliable for generic mime types like application/octet-stream)
  if (ext) {
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
    if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx"].includes(ext)) return "word";
    if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
    if (["ppt", "pptx"].includes(ext)) return "powerpoint";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  }

  // Fallback to mimeType
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("word") || mime.includes("document")) return "word";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("spreadsheet")) return "excel";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "powerpoint";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z") || mime.includes("tar")) return "archive";
  return "other";
}

export function getFileCategoryLabel(mimeType: string, filename?: string): string {
  const map: Record<FileCategory, string> = {
    image: "Hình ảnh",
    video: "Video",
    audio: "Âm thanh",
    pdf: "PDF",
    word: "Word",
    excel: "Excel",
    powerpoint: "PowerPoint",
    archive: "Nén",
    other: "Khác",
  };
  return map[getFileCategory(mimeType, filename)];
}

export function getFileColorClass(mimeType: string, filename?: string): string {
  const map: Record<FileCategory, string> = {
    image: "text-emerald-500",
    video: "text-violet-500",
    audio: "text-pink-500",
    pdf: "text-red-500",
    word: "text-blue-600",
    excel: "text-green-600",
    powerpoint: "text-orange-500",
    archive: "text-yellow-600",
    other: "text-slate-500",
  };
  return map[getFileCategory(mimeType, filename)];
}

export function getFileBgClass(mimeType: string, filename?: string): string {
  const map: Record<FileCategory, string> = {
    image: "bg-emerald-50",
    video: "bg-violet-50",
    audio: "bg-pink-50",
    pdf: "bg-red-50",
    word: "bg-blue-50",
    excel: "bg-green-50",
    powerpoint: "bg-orange-50",
    archive: "bg-yellow-50",
    other: "bg-slate-50",
  };
  return map[getFileCategory(mimeType, filename)];
}

interface FileIconProps {
  mimeType: string;
  filename?: string;
  className?: string;
}

export function FileIcon({ mimeType, filename, className = "w-5 h-5" }: FileIconProps) {
  const cat = getFileCategory(mimeType, filename);
  const colorClass = getFileColorClass(mimeType, filename);
  const props = { className: `${className} ${colorClass}` };

  switch (cat) {
    case "image":      return <FileImage {...props} />;
    case "video":      return <FileVideo {...props} />;
    case "audio":      return <FileAudio {...props} />;
    case "pdf":        return <FileText {...props} />;
    case "word":       return <FileText {...props} />;
    case "excel":      return <FileSpreadsheet {...props} />;
    case "powerpoint": return <Presentation {...props} />;
    case "archive":    return <FileArchive {...props} />;
    default:           return <File {...props} />;
  }
}
