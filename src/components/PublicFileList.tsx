// src/components/PublicFileList.tsx
"use client";
import { useState, useCallback, useMemo } from "react";
import { Search, Filter, Download, Eye, SlidersHorizontal, Tag, X } from "lucide-react";
import FilePreviewModal from "./FilePreviewModal";
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
  const [selectedTag, setSelectedTag] = useState("");
  const [previewFile, setPreviewFile] = useState<FileWithRelations | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Collect all tags from files
  const allTags = useMemo(() => {
    const tagMap = new Map<string, string>();
    files.forEach((f) => f.tags.forEach(({ tag }) => tagMap.set(tag.id, tag.name)));
    return Array.from(tagMap.entries()).map(([id, name]) => ({ id, name }));
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (selectedCategory && f.categoryId !== selectedCategory) return false;
      if (typeFilter) {
        const match = typeFilter.includes("/")
          ? f.fileType === typeFilter
          : f.fileType.includes(typeFilter) || f.fileType.startsWith(typeFilter + "/");
        if (!match) return false;
      }
      if (selectedTag && !f.tags.some(({ tag }) => tag.name === selectedTag)) return false;
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
  }, [files, selectedCategory, typeFilter, selectedTag, query]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("");
    setTypeFilter("");
    setSelectedTag("");
    setQuery("");
  }, []);

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

        {showFilters && (
          <div className="card mb-5 flex flex-wrap gap-4">
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
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(selectedTag === tag.name ? "" : tag.name)}
                      className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        selectedTag === tag.name
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      )}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
          <div className="text-center py-16 sm:py-24 text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Không tìm thấy tài liệu nào</p>
            <p className="text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((file) => (
              <div
                key={file.id}
                className="card border border-slate-200/60 hover:border-blue-200/80 hover:shadow-lg hover:-translate-y-1 flex flex-col gap-3.5 p-4 animate-fade-in transition-all duration-300"
              >
                {/* Icon + title */}
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-200/50">
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
                    <div className={`flex items-center justify-center w-full h-full text-blue-600 bg-blue-50/50 ${(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? 'hidden' : ''}`}>
                      <FileIcon mimeType={file.fileType} filename={file.filename} className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                      {file.title}
                    </h3>
                    <span
                      className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full text-white font-semibold tracking-wider uppercase"
                      style={{ backgroundColor: file.category.color ?? "#3B82F6" }}
                    >
                      {file.category.name}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {file.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{file.description}</p>
                )}

                {/* Tags */}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {file.tags.slice(0, 3).map(({ tag }) => (
                      <span key={tag.id} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">
                        #{tag.name}
                      </span>
                    ))}
                    {file.tags.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-400 self-center">+{file.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-[11px] text-slate-450 mt-auto pt-2.5 border-t border-slate-100/80">
                  <span className="font-medium text-slate-400">{formatFileSize(file.fileSize)}</span>
                  <span className="text-slate-400">{formatDate(file.createdAt)}</span>
                  {file.downloadCount > 0 && (
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Download className="w-3 h-3 text-slate-400" /> {file.downloadCount}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-2 h-9"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem trước
                  </button>
                  <a
                    href={`/api/download/${file.id}`}
                    download
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2 h-9"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải xuống
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
