// src/components/FilePreviewModal.tsx
"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { formatFileSize, formatDate } from "@/utils/format";
import { FileIcon } from "@/utils/fileIcon";
import type { FileWithRelations } from "@/types";

interface Props {
  file: FileWithRelations | null;
  onClose: () => void;
}

const MotionDiv = motion.div as any;

export default function FilePreviewModal({ file, onClose }: Props) {
  // Đóng bằng ESC
  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [file, onClose]);

  if (!file) return null;

  const isDrive = file.filepath?.startsWith("gdrive://") || (file.filepath === "external" && !!file.driveWebLink);
  const downloadUrl = `/api/download/${file.id}`;
  const proxyUrl = `/api/download/${file.id}?preview=true`;

  const isImage = file.fileType.startsWith("image/");
  const isVideo = file.fileType.startsWith("video/");
  const isAudio = file.fileType.startsWith("audio/");
  const isPdf = file.fileType === "application/pdf";
  const isOffice =
    file.fileType.includes("word") ||
    file.fileType.includes("sheet") ||
    file.fileType.includes("presentation") ||
    file.fileType.includes("excel") ||
    file.fileType.includes("powerpoint");

  // Trích fileId từ driveWebLink: https://drive.google.com/file/d/FILE_ID/view
  const driveFileId = file.driveFileId ??
    file.driveWebLink?.match(/\/file\/d\/([^/]+)/)?.[1] ?? null;

  // Drive embed URL: /preview cho PDF/ảnh/video — render trực tiếp không có Drive UI
  const driveEmbedUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : null;

  return (
    <AnimatePresence>
      <MotionDiv
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <MotionDiv
          className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel — bottom sheet trên mobile, centered dialog trên desktop */}
        <MotionDiv
          className="relative w-full sm:max-w-4xl bg-white/95 backdrop-blur-xl
                     rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/60
                     flex flex-col overflow-hidden
                     max-h-[92dvh] sm:max-h-[90vh]"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <FileIcon mimeType={file.fileType} filename={file.filename} className="w-8 h-8 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h2 className="font-bold text-slate-800 text-base sm:text-lg leading-tight line-clamp-2">
                  {file.title}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <span
                    className="px-2 py-0.5 rounded-full font-medium text-white shrink-0"
                    style={{ backgroundColor: file.category.color ?? "#3B82F6" }}
                  >
                    {file.category.name}
                  </span>
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span className="hidden sm:inline">{formatDate(file.createdAt)}</span>
                  {file.downloadCount > 0 && (
                    <span className="hidden sm:inline">{file.downloadCount} lượt tải</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-700"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto bg-slate-50/60 min-h-[180px]">
            {isDrive && driveEmbedUrl && (isOffice || file.filepath === "external") ? (
              <iframe
                src={driveEmbedUrl}
                className="w-full border-0"
                style={{ height: "52vh", backgroundColor: "#000" }}
                title={file.title}
                allow="autoplay"
              />
            ) : (
              <>
                {isImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proxyUrl}
                    alt={file.title}
                    className="w-full h-full object-contain"
                    style={{ maxHeight: "52vh" }}
                  />
                )}
                {isVideo && (
                  <video
                    src={proxyUrl}
                    controls
                    controlsList="nodownload"
                    playsInline
                    className="w-full bg-black"
                    style={{ maxHeight: "52vh" }}
                  />
                )}
                {isAudio && (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 px-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileIcon mimeType={file.fileType} filename={file.filename} className="w-8 h-8" />
                    </div>
                    <audio src={proxyUrl} controls className="w-full max-w-sm" />
                  </div>
                )}
                {isPdf && (
                  <iframe
                    src={proxyUrl}
                    className="w-full border-0"
                    style={{ height: "52vh" }}
                    title={file.title}
                  />
                )}
                {isOffice && (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                    <AlertCircle className="w-10 h-10" />
                    <p className="text-sm font-medium">File Office lưu trên máy chủ nội bộ</p>
                    <p className="text-xs">Tải xuống để mở bằng Microsoft Office</p>
                  </div>
                )}
                {!isImage && !isVideo && !isAudio && !isPdf && !isOffice && (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                    <FileText className="w-10 h-10" />
                    <p className="text-sm">Không hỗ trợ xem trước định dạng này</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description + tags */}
          {(file.description || file.tags.length > 0) && (
            <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-white/60 text-sm text-slate-600 space-y-1.5 shrink-0">
              {file.description && <p className="text-xs sm:text-sm leading-relaxed">{file.description}</p>}
              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {file.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 shrink-0">
            <p className="text-xs text-slate-400 truncate">
              {file.uploader.displayName ?? file.uploader.username}
              <span className="hidden sm:inline"> · {formatDate(file.createdAt)}</span>
            </p>
            <div className="flex gap-2 shrink-0">
              {file.driveWebLink && (
                <a
                  href={file.driveWebLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Drive</span>
                </a>
              )}
              <a
                href={downloadUrl}
                download
                className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2"
              >
                <Download className="w-3.5 h-3.5" />
                Tải xuống
              </a>
            </div>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
}
