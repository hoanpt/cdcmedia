// src/components/PublicFileList.tsx
"use client";
import { useState, useCallback, useMemo } from "react";
import { Search, Filter, Download, Eye, SlidersHorizontal, Tag, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FileIcon, getFileCategoryLabel } from "@/utils/fileIcon";
import { formatFileSize, formatDate } from "@/utils/format";
import type { CategoryWithCount, FileWithRelations } from "@/types";
import { clsx } from "clsx";

interface Props {
  files: FileWithRelations[];
  categories: CategoryWithCount[];
}

const FILE_TYPE_FILTERS = [
  { value: "", label: "Tất cả loại" },
  { value: "image", label: "Hình ảnh" },
  { value: "video", label: "Video" },
  { value: "application/pdf", label: "PDF" },
  { value: "word", label: "Word" },
  { value: "sheet", label: "Excel" },
  { value: "presentation", label: "PowerPoint" },
];

export default function PublicFileList({ files, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const sortedFiles = useMemo(() => {
    const now = Date.now();
    const newFiles: typeof files = [];
    const oldFiles: typeof files = [];
    files.forEach(f => {
      if (now - new Date(f.createdAt).getTime() < 24 * 60 * 60 * 1000) {
        newFiles.push(f);
      } else {
        oldFiles.push(f);
      }
    });
    // Shuffle oldFiles
    for (let i = oldFiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [oldFiles[i], oldFiles[j]] = [oldFiles[j], oldFiles[i]];
    }
    // Sort newFiles by newest first
    newFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return [...newFiles, ...oldFiles];
  }, [files]);

  // Collect all tags from files (case-insensitive, sorted by frequency)
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    const originalNames = new Map<string, string>();

    files.forEach((f) => {
      const added = new Set<string>();
      f.tags.forEach(({ tag }) => {
        const lowerName = tag.name.toLowerCase();
        if (!added.has(lowerName)) {
          added.add(lowerName);
          counts.set(lowerName, (counts.get(lowerName) || 0) + 1);
          if (!originalNames.has(lowerName)) {
            originalNames.set(lowerName, tag.name); // keep the first original casing we see
          }
        }
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]) // sort by count descending
      .map(([lowerName, count]) => ({
        id: lowerName, // use lowercase name as unique id
        name: originalNames.get(lowerName) || lowerName,
        lowerName,
        count
      }));
  }, [files]);

  const filtered = useMemo(() => {
    return sortedFiles.filter((f) => {
      if (selectedCategory && f.categoryId !== selectedCategory) return false;
      if (typeFilter) {
        const match = typeFilter.includes("/")
          ? f.fileType === typeFilter
          : f.fileType.includes(typeFilter) || f.fileType.startsWith(typeFilter + "/");
        if (!match) return false;
      }
      if (selectedTag && !f.tags.some(({ tag }) => tag.name.toLowerCase() === selectedTag)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !f.title.toLowerCase().includes(q) &&
          !(f.description ?? "").toLowerCase().includes(q) &&
          !f.tags.some(({ tag }) => tag.name.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [sortedFiles, selectedCategory, typeFilter, selectedTag, query]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("");
    setTypeFilter("");
    setSelectedTag("");
    setQuery("");
    setCurrentPage(1);
  }, []);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedCategory, typeFilter, selectedTag, query]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFiles = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasActiveFilters = selectedCategory || typeFilter || selectedTag || query;

  return (
    <div className="flex gap-4 lg:gap-6">
      {/* Sidebar – category filter, desktop only */}
      <aside className="hidden lg:block w-56 xl:w-60 shrink-0">
        <div className="card sticky top-20 space-y-1 bg-white/70 backdrop-blur-xl border border-slate-200/50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Chuyên mục
          </p>
          <button
            onClick={() => setSelectedCategory("")}
            className={clsx(
              "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-between",
              !selectedCategory
                ? "bg-gradient-to-r from-[#1D78B8] to-[#0d5485] text-white shadow-md shadow-blue-500/10"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
            )}
          >
            <span>Tất cả</span>
            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", !selectedCategory ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
              {files.length}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={clsx(
                "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2",
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-[#1D78B8] to-[#0d5485] text-white shadow-md shadow-blue-500/10"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: selectedCategory === cat.id ? "white" : (cat.color ?? "#3B82F6") }}
                />
                <span className="truncate">{cat.name}</span>
              </span>
              <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                {cat._count.files}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Search + filter bar */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu…"
              className="input-base text-sm"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>

          {/* Quick Filter by Department (Khoa/Phòng) */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="btn-secondary text-xs sm:text-sm max-w-[220px] truncate"
            style={{ height: "42px" }}
          >
            <option value="">Tất cả Khoa/Phòng</option>
            {[
            "Tổ chức - Hành chính",
            "Kế hoạch - Tài chính",
            "Kế hoạch - Nghiệp vụ",
            "PC bệnh truyền nhiễm",
            "PC HIV/AIDS",
            "PC bệnh không lây nhiễm",
            "Sức khỏe môi trường - Y tế trường học",
            "Sức khỏe sinh sản",
            "Dinh dưỡng",
            "Kiểm dịch y tế quốc tế",
            "Ký sinh trùng - Côn trùng",
            "Truyền thông",
            "Xét nghiệm",
            "Dược - Vật tư y tế",
            "Phòng Khám đa khoa",
            "Bệnh nghề nghiệp"
            ].map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx("btn-secondary flex items-center gap-1.5 text-xs sm:text-sm px-3", showFilters && "ring-2 ring-blue-400")}
            style={{ height: "42px" }}
          >
            <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-1 text-xs sm:text-sm text-red-500 px-3" style={{ height: "42px" }}>
              <X className="w-4 h-4" /> Xóa
            </button>
          )}
        </div>



        {/* Mobile category */}
        <div className="lg:hidden mb-6">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 px-1">Chuyên mục</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={clsx(
                "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all",
                !selectedCategory
                  ? "bg-gradient-to-r from-[#1D78B8] to-[#0d5485] text-white shadow-sm shadow-blue-500/15"
                  : "bg-white text-slate-600 border border-slate-200/50 hover:bg-slate-50"
              )}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all",
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-[#1D78B8] to-[#0d5485] text-white shadow-sm shadow-blue-500/15"
                    : "bg-white text-slate-600 border border-slate-200/50 hover:bg-slate-50"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-slate-500 mb-4">
          Hiển thị <strong className="text-slate-700">{filtered.length}</strong> tài liệu
          {hasActiveFilters && <span> (đã lọc)</span>}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Search className="w-12 h-12 text-slate-200" />
              <p className="font-medium text-slate-500">Không tìm thấy tài liệu phù hợp</p>
              <button onClick={clearFilters} className="text-blue-500 text-sm hover:underline mt-1">Xóa bộ lọc</button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((file) => {
              const isNew = Date.now() - new Date(file.createdAt).getTime() < 24 * 60 * 60 * 1000;
              return (
              <div
                key={file.id}
                className="relative group bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 rounded-2xl flex flex-col p-3 transition-all duration-300"
              >
                {isNew && (
                  <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm animate-pulse border border-white">
                    NEW
                  </div>
                )}
                
                {/* Header: Icon + Title */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-100">
                    {(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? (
                      <Image 
                        src={`/api/thumbnail/${file.id}`} 
                        alt="thumbnail" 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`flex items-center justify-center w-full h-full text-blue-600 bg-blue-50/30 ${(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? 'hidden' : ''}`}>
                      <FileIcon mimeType={file.fileType} filename={file.filename} className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1 flex flex-col items-start overflow-hidden">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white tracking-wider uppercase mb-1 truncate max-w-full inline-block"
                      style={{ backgroundColor: file.category.color ?? "#3B82F6" }}
                    >
                      {file.category.name}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-[13px] leading-snug w-full truncate group-hover:text-blue-600 transition-colors" title={file.title}>
                      {file.title.length > 45 ? file.title.substring(0, 45) + "..." : file.title}
                    </h3>
                  </div>
                </div>

                {/* Tags */}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {file.tags.slice(0, 1).map(({ tag }) => (
                      <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 font-medium truncate max-w-[120px]">
                        #{tag.name}
                      </span>
                    ))}
                    {file.tags.length > 1 && (
                      <span className="text-[10px] font-medium text-slate-400 self-center">+{file.tags.length - 1}</span>
                    )}
                  </div>
                )}

                <div className="mt-auto">
                  {/* Meta */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                    <span className="font-medium">{formatFileSize(file.fileSize)}</span>
                    <span>{formatDate(file.createdAt)}</span>
                    {(file.viewCount > 0 || file.downloadCount > 0) && (
                      <div className="flex items-center gap-2">
                        {file.viewCount > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-400" title={`${file.viewCount} lượt xem`}>
                            <Eye className="w-3 h-3" /> {file.viewCount}
                          </span>
                        )}
                        {file.downloadCount > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-400" title={`${file.downloadCount} lượt tải`}>
                            <Download className="w-3 h-3" /> {file.downloadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2.5">
                    <Link
                      href={`/document/${file.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold py-2 transition shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </Link>
                    <a
                      href={`/api/download/${file.id}`}
                      download
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1D78B8] hover:bg-[#0d5485] text-white rounded-lg text-xs font-bold py-2 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải xuống
                    </a>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Filters moved below grid */}
        {showFilters && (
          <div className="card mt-6 flex flex-wrap gap-4">
            {/* Type filter */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500">Loại file</p>
              <div className="flex flex-wrap gap-1.5">
                {FILE_TYPE_FILTERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTypeFilter(t.value)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      typeFilter === t.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Thẻ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(showAllTags ? allTags : allTags.slice(0, 15)).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(selectedTag === tag.lowerName ? "" : tag.lowerName)}
                      className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        selectedTag === tag.lowerName
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      )}
                    >
                      #{tag.name}
                    </button>
                  ))}
                  {allTags.length > 15 && (
                    <button
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      {showAllTags ? "Thu gọn" : `Xem thêm (${allTags.length - 15})`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Trước
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Logic to show a reasonable number of pages
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition",
                        currentPage === page 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {page}
                    </button>
                  );
                }
                
                // Show ellipsis
                if (
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <span key={page} className="text-slate-400 px-1">...</span>;
                }
                
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
