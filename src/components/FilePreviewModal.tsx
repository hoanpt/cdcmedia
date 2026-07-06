"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink, FileText, AlertCircle, Eye, Calendar, HardDrive, Tag } from "lucide-react";
import { formatFileSize, formatDate } from "@/utils/format";
import { FileIcon } from "@/utils/fileIcon";
import type { FileWithRelations } from "@/types";

interface Props {
  file: FileWithRelations | null;
  onClose: () => void;
  onSelectFile?: (file: FileWithRelations) => void;
}

const MotionDiv = motion.div as any;

export default function FilePreviewModal({ file, onClose, onSelectFile }: Props) {
  const [relatedFiles, setRelatedFiles] = useState<FileWithRelations[]>([]);

  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [file, onClose]);

  useEffect(() => {
    if (!file) return;
    setRelatedFiles([]);
    fetch(`/api/public-files?categoryId=${file.categoryId}&limit=5`)
      .then(res => res.json())
      .then(data => {
         const others = data.files.filter((f: any) => f.id !== file.id).slice(0, 4);
         setRelatedFiles(others);
      })
      .catch(console.error);
  }, [file]);

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

  const driveFileId = file.driveFileId ?? file.driveWebLink?.match(/\/file\/d\/([^/]+)/)?.[1] ?? null;
  const driveEmbedUrl = driveFileId ? `https://drive.google.com/file/d/${driveFileId}/preview` : null;

  // Render file logic
  const renderPreview = () => {
    if (isDrive && driveEmbedUrl && (isOffice || file.filepath === "external")) {
      return (
        <iframe
          src={driveEmbedUrl}
          className="w-full h-full border-0 absolute inset-0"
          title={file.title}
          allow="autoplay"
        />
      );
    }
    
    if (isImage) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={proxyUrl} alt={file.title} className="w-full h-full object-contain bg-slate-900/5 absolute inset-0" />;
    }
    if (isVideo) {
      return <video src={proxyUrl} controls controlsList="nodownload" playsInline className="w-full h-full bg-black object-contain absolute inset-0" />;
    }
    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 h-full bg-slate-50 absolute inset-0">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
            <FileIcon mimeType={file.fileType} filename={file.filename} className="w-10 h-10" />
          </div>
          <audio src={proxyUrl} controls className="w-full max-w-sm" />
        </div>
      );
    }
    if (isPdf) {
      return <iframe src={proxyUrl} className="w-full h-full border-0 absolute inset-0" title={file.title} />;
    }
    if (isOffice) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 bg-slate-50 h-full absolute inset-0">
          <AlertCircle className="w-12 h-12 text-amber-500/50" />
          <p className="text-sm font-medium text-slate-600">File Office lưu trên máy chủ</p>
          <p className="text-xs">Tải xuống để mở bằng Microsoft Office</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 bg-slate-50 h-full absolute inset-0">
        <FileText className="w-12 h-12" />
        <p className="text-sm">Không hỗ trợ xem trước định dạng này</p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <MotionDiv
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <MotionDiv className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

        <MotionDiv
          className="relative w-full max-w-6xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white z-10 shrink-0">
            <h2 className="font-bold text-slate-800 text-lg truncate pr-4">Chi tiết tài liệu</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col lg:flex-row min-h-full">
              {/* Left Column: Preview */}
              <div className="lg:w-2/3 xl:w-3/4 flex flex-col bg-slate-100/50 border-r border-slate-100">
                <div className="flex-1 relative min-h-[350px] lg:min-h-[500px]">
                  {renderPreview()}
                </div>
              </div>

              {/* Right Column: Info & Actions */}
              <div className="lg:w-1/3 xl:w-1/4 flex flex-col bg-white">
                <div className="p-5 lg:p-6 flex-1 space-y-6">
                  {/* File Title & Basic Info */}
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <FileIcon mimeType={file.fileType} filename={file.filename} className="w-8 h-8 shrink-0 mt-1" />
                      <h1 className="font-bold text-xl text-slate-800 leading-tight">{file.title}</h1>
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4" style={{ backgroundColor: file.category.color ?? "#3B82F6" }}>
                      {file.category.name}
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{formatFileSize(file.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{formatDate(file.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{file.downloadCount} lượt tải</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <a href={downloadUrl} download className="btn-primary w-full flex justify-center items-center gap-2 py-2.5 rounded-xl shadow-sm hover:shadow">
                      <Download className="w-5 h-5" />
                      <span className="font-medium">Tải xuống tài liệu</span>
                    </a>
                    {file.driveWebLink && (
                      <a href={file.driveWebLink} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full flex justify-center items-center gap-2 py-2.5 rounded-xl">
                        <ExternalLink className="w-5 h-5" />
                        <span className="font-medium">Mở trên Google Drive</span>
                      </a>
                    )}
                  </div>

                  {/* Description */}
                  {file.description && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-2">Mô tả</h3>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {file.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {file.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Thẻ từ khóa</h3>
                      <div className="flex flex-wrap gap-2">
                        {file.tags.map(({ tag }) => (
                          <span key={tag.id} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100/50">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Related Documents */}
                {relatedFiles.length > 0 && (
                  <div className="p-5 lg:p-6 border-t border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Tài liệu cùng chuyên mục</h3>
                    <div className="space-y-2.5">
                      {relatedFiles.map(rel => (
                        <div 
                          key={rel.id} 
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
                          onClick={() => { if (onSelectFile) onSelectFile(rel); else window.location.href = `/api/download/${rel.id}`; }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                             {rel.thumbnailUrl || (rel.fileType.startsWith("image/") && rel.filepath) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={`/api/thumbnail/${rel.id}`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                             ) : (
                                <FileIcon mimeType={rel.fileType} filename={rel.filename} className="w-5 h-5" />
                             )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">{rel.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(rel.fileSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
}
