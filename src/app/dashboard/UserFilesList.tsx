// src/app/dashboard/UserFilesList.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Eye, Download, X, Check, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { formatFileSize, formatDate } from "@/utils/format";
import { FileIcon } from "@/utils/fileIcon";
import FilePreviewModal from "@/components/FilePreviewModal";
import EditFileModal from "./EditFileModal";
import type { FileWithRelations } from "@/types";

interface Category { id: string; name: string; }
interface Props {
  isAdmin: boolean;
  categories: Category[];
  refreshSignal: number;
}

export default function UserFilesList({ isAdmin, categories, refreshSignal }: Props) {
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithRelations | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/files?limit=200");
    const data = await res.json();
    setFiles(data.files ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles, refreshSignal]);

  async function deleteFile(file: FileWithRelations) {
    if (!confirm(`Xóa "${file.title}"? Hành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      fetchFiles();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Lỗi xóa file");
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16 text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Đang tải…
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Download className="w-10 h-10 opacity-30" />
        <p className="font-medium">Chưa có tài liệu nào</p>
        <p className="text-sm">Hãy tải lên tài liệu đầu tiên</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            {isAdmin ? "Tất cả tài liệu" : "Tài liệu của bạn"}
            <span className="ml-2 text-sm font-normal text-slate-400">({files.length})</span>
          </h2>
          <button onClick={fetchFiles} className="btn-secondary text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Làm mới
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {files.map((file) => (
            <div key={file.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 relative">
                  {(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? (
                    <img 
                      src={`/api/thumbnail/${file.id}`} 
                      alt="thumbnail" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`flex items-center justify-center w-full h-full ${(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? 'hidden' : ''}`}>
                    <FileIcon mimeType={file.fileType} filename={file.filename} className="w-6 h-6" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">{file.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span
                      className="px-1.5 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: file.category.color ?? "#3B82F6" }}
                    >
                        {file.category.name}
                      </span>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>{formatDate(file.createdAt)}</span>
                      {isAdmin && (
                        <span className="text-slate-300">
                          {file.uploader.displayName ?? file.uploader.username}
                        </span>
                      )}
                      {file.downloadCount > 0 && <span>{file.downloadCount} lượt tải</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setPreviewFile(file)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <a href={`/api/download/${file.id}`} download className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => setEditingFile(file)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteFile(file)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      {editingFile && (
        <EditFileModal
          file={editingFile}
          categories={categories}
          onClose={() => setEditingFile(null)}
          onSuccess={() => {
            setEditingFile(null);
            fetchFiles();
          }}
        />
      )}
    </>
  );
}
