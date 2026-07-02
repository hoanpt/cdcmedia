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

export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "excel";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "powerpoint";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z") || mimeType.includes("tar")) return "archive";
  return "other";
}

export function getFileCategoryLabel(mimeType: string): string {
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
  return map[getFileCategory(mimeType)];
}

export function getFileColorClass(mimeType: string): string {
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
  return map[getFileCategory(mimeType)];
}

export function getFileBgClass(mimeType: string): string {
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
  return map[getFileCategory(mimeType)];
}

interface FileIconProps {
  mimeType: string;
  className?: string;
}

export function FileIcon({ mimeType, className = "w-5 h-5" }: FileIconProps) {
  const cat = getFileCategory(mimeType);
  const colorClass = getFileColorClass(mimeType);
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
