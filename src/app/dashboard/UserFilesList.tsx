// src/app/dashboard/UserFilesList.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Eye, Download, X, Check, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { formatFileSize, formatDate } from "@/utils/format";
import { FileIcon } from "@/utils/fileIcon";
import Link from "next/link";
import EditFileModal from "./EditFileModal";
import type { FileWithRelations } from "@/types";

interface Category { id: string; name: string; }
interface Category { id: string; name: string; group?: string; color?: string; }
interface Props {
  isAdmin: boolean;
  categories: Category[];
  refreshSignal: number;
}

export default function UserFilesList({ isAdmin, categories, refreshSignal }: Props) {
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const itemsPerPage = 10;

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

  const handleBulkMove = async () => {
    if (selectedFiles.size === 0 || !bulkCategoryId) return;
    
    const confirmMove = window.confirm(`Bạn có chắc muốn chuyển ${selectedFiles.size} tài liệu sang chuyên mục mới?`);
    if (!confirmMove) return;

    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/files/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          categoryId: bulkCategoryId
        }),
      });

      if (res.ok) {
        toast.success(`Đã chuyển thành công ${selectedFiles.size} tài liệu`);
        setSelectedFiles(new Set());
        setBulkCategoryId("");
        fetchFiles();
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Lỗi chuyển chuyên mục");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsBulkUpdating(false);
    }
  };

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
        {selectedFiles.size > 0 ? (
          <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/50 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">Đã chọn {selectedFiles.size}</span>
              <button onClick={() => setSelectedFiles(new Set())} className="text-xs text-blue-600 hover:underline">Bỏ chọn</button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="input-base py-1.5 text-sm h-auto"
              >
                <option value="">-- Chọn chuyên mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.group ? `[${c.group}] ` : ""}{c.name}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleBulkMove}
                disabled={!bulkCategoryId || isBulkUpdating}
                className="btn-primary py-1.5 text-sm h-auto shrink-0 flex items-center gap-1"
              >
                {isBulkUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Chuyển nhanh
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              {isAdmin ? "Tất cả tài liệu" : "Tài liệu của bạn"}
              <span className="ml-2 text-sm font-normal text-slate-400">({files.length})</span>
            </h2>
            <button onClick={fetchFiles} className="btn-secondary text-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Làm mới
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-50">
          <div className="px-5 py-3 bg-slate-50 flex items-center gap-3 border-b border-slate-100">
            <input 
              type="checkbox"
              checked={
                files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length > 0 &&
                files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).every(f => selectedFiles.has(f.id))
              }
              onChange={(e) => {
                const newSet = new Set(selectedFiles);
                const currentFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                if (e.target.checked) {
                  currentFiles.forEach(f => newSet.add(f.id));
                } else {
                  currentFiles.forEach(f => newSet.delete(f.id));
                }
                setSelectedFiles(newSet);
              }}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên tài liệu</span>
          </div>

          {files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((file) => (
            <div key={file.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedFiles);
                    if (e.target.checked) newSet.add(file.id);
                    else newSet.delete(file.id);
                    setSelectedFiles(newSet);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
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
                    <Link href={`/document/${file.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                      <Eye className="w-4 h-4" />
                    </Link>
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

        {/* Pagination UI */}
        {Math.ceil(files.length / itemsPerPage) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, files.length)} trong {files.length} tài liệu
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded text-xs font-medium border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 transition"
              >
                Trước
              </button>
              
              {Array.from({ length: Math.ceil(files.length / itemsPerPage) }, (_, i) => i + 1).map(page => {
                const totalPages = Math.ceil(files.length / itemsPerPage);
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition ${
                        currentPage === page 
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-200" 
                          : "text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                
                if (
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <span key={page} className="text-slate-400 px-1 text-xs">...</span>;
                }
                
                return null;
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(files.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(files.length / itemsPerPage)}
                className="px-2.5 py-1.5 rounded text-xs font-medium border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>


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
