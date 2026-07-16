// src/components/PublicFileList.tsx
"use client";
import { useState, useCallback, useMemo } from "react";
import { Search, Filter, Download, Eye, SlidersHorizontal, Tag, X, Film, Mic, Image as ImageIcon, FileText } from "lucide-react";
import * as Icons from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FileIcon, getFileCategoryLabel } from "@/utils/fileIcon";
import { formatFileSize, formatDate } from "@/utils/format";
import type { CategoryWithCount, FileWithRelations } from "@/types";
import { clsx } from "clsx";

interface Group {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  files: FileWithRelations[];
  categories: CategoryWithCount[];
  groups: Group[];
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

const getCategoryGroup = (catName: string, availableGroups: Group[]) => {
  if (!catName || !availableGroups || availableGroups.length === 0) return null;
  const lower = catName.toLowerCase();
  
  if ((lower.includes("video") || lower.includes("clip") || lower.includes("phim")) && availableGroups.some(g => g.id === "VIDEO")) return "VIDEO";
  if ((lower.includes("audio") || lower.includes("âm thanh") || lower.includes("mp3")) && availableGroups.some(g => g.id === "AUDIO")) return "AUDIO";
  if ((lower.includes("hình ảnh") || lower.includes("ảnh") || lower.includes("banner") || lower.includes("poster") || lower.includes("infographic")) && availableGroups.some(g => g.id === "GRAPHICS")) return "GRAPHICS";
  
  // Mặc định trả về phân hệ cuối cùng (thường là Tài liệu) hoặc phân hệ đầu tiên
  const docGroup = availableGroups.find(g => g.id === "DOCUMENTS");
  return docGroup ? docGroup.id : availableGroups[availableGroups.length - 1].id;
};

const isDepartmentTag = (tagName: string) => {
  const depts = [
    "tổ chức - hành chính",
    "kế hoạch - tài chính",
    "kế hoạch - nghiệp vụ",
    "pc bệnh truyền nhiễm",
    "khoa bệnh truyền nhiễm",
    "pc hiv/aids",
    "pc bệnh không lây nhiễm",
    "sức khỏe môi trường - y tế trường học",
    "sức khỏe sinh sản",
    "dinh dưỡng",
    "kiểm dịch y tế quốc tế",
    "ký sinh trùng - côn trùng",
    "truyền thông",
    "xét nghiệm",
    "dược - vật tư y tế",
    "phòng khám đa khoa",
    "bệnh nghề nghiệp"
  ];
  return depts.includes(tagName.toLowerCase().trim());
};

export default function PublicFileList({ files, categories, groups }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Collect all tags from files (case-insensitive, sorted by frequency), excluding department tags
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    const originalNames = new Map<string, string>();

    files.forEach((f) => {
      const added = new Set<string>();
      f.tags.forEach(({ tag }) => {
        if (isDepartmentTag(tag.name)) return;
        const lowerName = tag.name.toLowerCase();
        if (!added.has(lowerName)) {
          added.add(lowerName);
          counts.set(lowerName, (counts.get(lowerName) || 0) + 1);
          if (!originalNames.has(lowerName)) {
            originalNames.set(lowerName, tag.name);
          }
        }
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]) // sort by count descending
      .map(([lowerName, count]) => ({
        id: lowerName,
        name: originalNames.get(lowerName) || lowerName,
        lowerName,
        count
      }));
  }, [files]);

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
    for (let i = oldFiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [oldFiles[i], oldFiles[j]] = [oldFiles[j], oldFiles[i]];
    }
    newFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return [...newFiles, ...oldFiles];
  }, [files]);

  const filtered = useMemo(() => {
    return sortedFiles.filter((f) => {
      const cat = categories.find(c => c.id === f.categoryId);
      const catGroup = cat?.group || getCategoryGroup(cat?.name || f.category.name, groups);

      if (selectedGroup && catGroup !== selectedGroup) return false;
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
  }, [sortedFiles, selectedGroup, selectedCategory, typeFilter, selectedTag, query, categories, groups]);

  const clearFilters = useCallback(() => {
    setSelectedGroup("");
    setSelectedCategory("");
    setTypeFilter("");
    setSelectedTag("");
    setQuery("");
    setCurrentPage(1);
  }, []);

  useMemo(() => {
    setCurrentPage(1);
  }, [selectedGroup, selectedCategory, typeFilter, selectedTag, query]);

  useMemo(() => {
    setSelectedCategory("");
  }, [selectedGroup]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const hasActiveFilters = selectedGroup || selectedCategory || typeFilter || selectedTag || query;

  const currentGroupCategories = categories.filter(c => {
    const cGroup = c.group || getCategoryGroup(c.name, groups);
    return cGroup === selectedGroup;
  });

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide border-b border-slate-100">
        <button
          onClick={() => setSelectedGroup("")}
          className={clsx(
            "relative shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
            !selectedGroup
              ? "text-white"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          {!selectedGroup && (
            <motion.div
              layoutId="active-group"
              className="absolute inset-0 bg-gradient-to-r from-[#1D78B8] to-[#0d5485] rounded-full shadow-md"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Tất cả phân hệ</span>
        </button>
        {groups.map((grp) => {
          const IconComponent = (Icons as any)[grp.icon] || Icons.Folder;
          return (
            <button
              key={grp.id}
              onClick={() => setSelectedGroup(grp.id)}
              className={clsx(
                "relative shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                selectedGroup === grp.id
                  ? "text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {selectedGroup === grp.id && (
                <motion.div
                  layoutId="active-group"
                  className="absolute inset-0 bg-gradient-to-r from-[#1D78B8] to-[#0d5485] rounded-full shadow-md"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className={clsx(selectedGroup === grp.id ? "text-white" : "text-blue-500")}>
                  <IconComponent className="w-4 h-4" />
                </span>
                <span>{grp.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-w-0">

        {selectedGroup && currentGroupCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("")}
              className={clsx(
                "relative px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                !selectedCategory
                  ? "text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              {!selectedCategory && (
                <motion.div
                  layoutId="active-category"
                  className="absolute inset-0 bg-blue-600 rounded-full shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">Tất cả</span>
            </button>
            {currentGroupCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "relative px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                  selectedCategory === cat.id
                    ? "text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                {selectedCategory === cat.id && (
                  <motion.div
                    layoutId="active-category"
                    className="absolute inset-0 bg-blue-600 rounded-full shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu…"
              aria-label="Tìm kiếm tài liệu"
              className="input-base text-sm"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-1 text-xs sm:text-sm text-red-500 px-3" style={{ height: "42px" }}>
              <X className="w-4 h-4" /> Xóa
            </button>
          )}
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Hiển thị <strong className="text-slate-700">{filtered.length}</strong> tài liệu
          {hasActiveFilters && <span> (đã lọc)</span>}
        </p>

        {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Search className="w-12 h-12 text-slate-300" />
              <p className="font-medium text-slate-500">Không tìm thấy tài liệu phù hợp</p>
              <button onClick={clearFilters} className="text-blue-500 text-sm hover:underline mt-1">Xóa bộ lọc</button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5">
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
                
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-100"
                    style={{ width: "48px", height: "48px" }}
                  >
                    {(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? (
                      <Image 
                        src={`/api/thumbnail/${file.id}`} 
                        alt="thumbnail" 
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`flex items-center justify-center w-full h-full text-blue-600 bg-blue-50/30 ${(file.thumbnailUrl || (file.fileType.startsWith("image/") && file.filepath !== "external")) ? 'hidden' : ''}`}>
                      <FileIcon mimeType={file.fileType} filename={file.filename} className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1 flex flex-col items-start overflow-hidden">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white tracking-wider uppercase mb-1 truncate max-w-full inline-block"
                      style={{ backgroundColor: file.category.color ?? "#3B82F6" }}
                    >
                      {file.category.name}
                    </span>
                    <h2 className="font-semibold text-slate-800 text-[13px] leading-snug w-full truncate group-hover:text-blue-600 transition-colors" title={file.title}>
                      {file.title.length > 45 ? file.title.substring(0, 45) + "..." : file.title}
                    </h2>
                    {file.tags && file.tags.filter((t: any) => !isDepartmentTag(t.tag.name)).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 w-full">
                        {file.tags.filter((t: any) => !isDepartmentTag(t.tag.name)).map((t: any) => (
                          <span key={t.tag.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] text-slate-500 font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            {t.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {file.description && (
                  <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed" title={file.description}>
                    {file.description}
                  </p>
                )}

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                    <span className="font-medium">{formatFileSize(file.fileSize)}</span>
                    <span>{formatDate(file.createdAt)}</span>
                    {(file.viewCount > 0 || file.downloadCount > 0) && (
                      <div className="flex items-center gap-2">
                        {file.viewCount > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-500" title={`${file.viewCount} lượt xem`}>
                            <Eye className="w-3 h-3" /> {file.viewCount}
                          </span>
                        )}
                        {file.downloadCount > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-500" title={`${file.downloadCount} lượt tải`}>
                            <Download className="w-3 h-3" /> {file.downloadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

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

        {/* Tag Cloud */}
        {allTags.length > 0 && (
          <div className="card mt-8 p-5 border border-slate-200/60 rounded-2xl bg-slate-50/50 shadow-sm">
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-500" /> Phân loại theo chủ đề (Hashtags)
              </p>
              <div className="flex flex-wrap gap-2">
                {(showAllTags ? allTags : allTags.slice(0, 20)).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.lowerName ? "" : tag.lowerName)}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      selectedTag === tag.lowerName
                        ? "bg-[#1D78B8] border-[#1D78B8] text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    #{tag.name} <span className={clsx("ml-1 font-semibold", selectedTag === tag.lowerName ? "text-blue-100" : "text-slate-400")}>({tag.count})</span>
                  </button>
                ))}
                {allTags.length > 20 && (
                  <button
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-200 border border-slate-300 text-slate-700 hover:bg-slate-300"
                  >
                    {showAllTags ? "Thu gọn" : `Xem thêm (${allTags.length - 20})`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
