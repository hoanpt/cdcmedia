import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatFileSize, formatDate } from "@/utils/format";
import { FileIcon } from "@/utils/fileIcon";
import { Download, ExternalLink, Calendar, HardDrive, Eye, Tag, AlertCircle, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AlbumViewer from "./AlbumViewer";
import RelatedFiles from "./RelatedFiles";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file) return { title: "Không tìm thấy tài liệu" };
  return { title: `${file.title} - CDC Media` };
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const file = await prisma.mediaFile.findUnique({
    where: { id },
    include: {
      category: true,
      uploader: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: true } },
      attachments: true
    }
  });

  if (!file) {
    notFound();
  }

  const relatedFiles = await prisma.mediaFile.findMany({
    where: { 
      categoryId: file.categoryId,
      id: { not: file.id },
      isPublic: true
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const downloadUrl = `/api/download/${file.id}`;

  const allItems = [file, ...file.attachments];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-xl text-sm font-bold transition-colors mb-6 border border-indigo-100/50 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Quay lại kho tài liệu
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Left Column: Preview */}
            <div className="lg:w-2/3 xl:w-3/4 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-100/50 relative flex flex-col min-h-[350px] lg:min-h-full">
              <AlbumViewer items={allItems} />
            </div>

            {/* Right Column: Info & Actions */}
            <div className="lg:w-1/3 xl:w-1/4 flex flex-col bg-white">
              <div className="p-6 lg:p-8 flex-1 space-y-8">
                {/* File Title & Basic Info */}
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <FileIcon mimeType={file.fileType} filename={file.filename} className="w-10 h-10 shrink-0 mt-1" />
                    <h1 className="font-bold text-2xl text-slate-800 leading-tight">{file.title}</h1>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-6" style={{ backgroundColor: file.category.color ?? "#3B82F6" }}>
                    {file.category.name}
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4.5 h-4.5 text-slate-400" />
                      <span className="truncate">{formatFileSize(file.fileSize)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4.5 h-4.5 text-slate-400" />
                      <span className="truncate">{formatDate(file.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Eye className="w-4.5 h-4.5 text-slate-400" />
                      <span className="truncate">{file.downloadCount} lượt tải</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <a href={downloadUrl} download className="btn-primary w-full flex justify-center items-center gap-2 py-3 rounded-xl shadow-sm hover:shadow text-base">
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Tải xuống tài liệu</span>
                  </a>
                  {file.driveWebLink && (
                    <a href={file.driveWebLink} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full flex justify-center items-center gap-2 py-3 rounded-xl text-base">
                      <ExternalLink className="w-5 h-5" />
                      <span className="font-medium">Mở trên Google Drive</span>
                    </a>
                  )}
                </div>

                {/* Description */}
                {file.description && (
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Mô tả</h3>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {file.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {file.tags.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Thẻ từ khóa</h3>
                    <div className="flex flex-wrap gap-2">
                      {file.tags.map(({ tag }) => (
                        <span key={tag.id} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100/50 hover:bg-blue-100 cursor-pointer transition-colors">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Documents Section */}
        <RelatedFiles relatedFiles={relatedFiles as any} />
    </div>
  );
}
