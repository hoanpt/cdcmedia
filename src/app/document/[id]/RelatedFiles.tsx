"use client";
import { useState } from "react";
import Link from "next/link";
import { FileIcon } from "@/utils/fileIcon";
import { formatFileSize, formatDate } from "@/utils/format";
import { Eye } from "lucide-react";
import clsx from "clsx";

export default function RelatedFiles({ relatedFiles }: { relatedFiles: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (relatedFiles.length === 0) return null;

  const totalPages = Math.ceil(relatedFiles.length / itemsPerPage);
  const paginatedFiles = relatedFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
          <span className="w-2 h-7 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 shadow-sm block"></span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900">
            Tài liệu cùng chuyên mục
          </span>
        </h2>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60 shadow-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              &lt;
            </button>
            <span className="text-sm font-semibold text-slate-600 px-2 min-w-[3rem] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {paginatedFiles.map((rel) => (
          <Link
            key={rel.id}
            href={`/document/${rel.id}`}
            className="group bg-white rounded-2xl border border-indigo-100 overflow-hidden hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >
            <div className="aspect-[4/3] bg-indigo-50/30 relative overflow-hidden flex items-center justify-center border-b border-indigo-100/50">
              {rel.thumbnailUrl || (rel.fileType.startsWith("image/") && rel.filepath !== "external") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/thumbnail/${rel.id}`}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`flex items-center justify-center w-full h-full ${(rel.thumbnailUrl || (rel.fileType.startsWith("image/") && rel.filepath !== "external")) ? 'hidden' : ''}`}>
                <FileIcon mimeType={rel.fileType} filename={rel.filename} className="w-12 h-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col bg-gradient-to-b from-white to-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors mb-3">
                {rel.title}
              </h3>
              <div className="mt-auto flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{formatFileSize(rel.fileSize)}</span>
                <div className="flex items-center gap-2">
                  {rel.viewCount > 0 && (
                    <span className="flex items-center gap-1 text-slate-400" title={`${rel.viewCount} lượt xem`}>
                      <Eye className="w-3 h-3" /> {rel.viewCount}
                    </span>
                  )}
                  <span className="text-slate-400">{formatDate(rel.createdAt)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
