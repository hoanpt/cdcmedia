// src/app/page.tsx — public home
import { prisma } from "@/lib/prisma";
import PublicFileList from "@/components/PublicFileList";
import SidebarAds from "@/components/SidebarAds";
import BannerStrip from "@/components/BannerStrip";
import { isDriveConfigured } from "@/lib/gdrive";
import { formatFileSize } from "@/utils/format";
import { FileArchive, FolderOpen, Download, HardDrive, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, files, storageAgg, downloadAgg, useDrive] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { files: { where: { isPublic: true } } } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.mediaFile.findMany({
      where: { isPublic: true },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        uploader: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mediaFile.aggregate({ _sum: { fileSize: true }, where: { isPublic: true } }),
    prisma.mediaFile.aggregate({ _sum: { downloadCount: true }, where: { isPublic: true } }),
    isDriveConfigured(),
  ]);

  const totalSize = storageAgg._sum.fileSize ?? 0;
  const totalDownloads = downloadAgg._sum.downloadCount ?? 0;

  const stats = [
    { label: "Tài liệu", value: files.length, icon: FileArchive, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Chuyên mục", value: categories.length, icon: FolderOpen, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "Lượt tải", value: totalDownloads.toLocaleString("vi-VN"), icon: Download, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    {
      label: "Dung lượng",
      value: formatFileSize(totalSize),
      icon: HardDrive,
      color: useDrive ? "text-violet-600" : "text-slate-600",
      bg: useDrive ? "bg-violet-50" : "bg-slate-50",
      border: useDrive ? "border-violet-100" : "border-slate-100",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Banner TOP đã chuyển sang layout.tsx để full màn hình */}

      {/* Hero — the subject is a government health media archive: authoritative, trusted, accessible */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#1D78B8]/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#F26A21]/10 blur-3xl" />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

        <div className="relative px-4 sm:px-8 py-6 sm:py-10">
          {/* Authority badge */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#1D78B8]/10 to-[#1D78B8]/5 border border-[#1D78B8]/20 text-[#1D78B8] text-xs sm:text-sm font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#D31224] animate-pulse" />
              Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">
              Ngân hàng Tài liệu
              <br />
              <span className="gradient-text">Truyền thông Sức khỏe</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Kho lưu trữ tập trung tài liệu truyền thông, hình ảnh, video và ấn phẩm phòng chống dịch bệnh của CDC Đà Nẵng.
            </p>
          </div>

          {/* Stats grid */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl ${s.bg} border ${s.border} backdrop-blur-sm hover:scale-105 transition-transform duration-200 cursor-default`}
              >
                <div className={`p-1.5 rounded-lg sm:rounded-xl ${s.bg}`}>
                  <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm sm:text-base font-extrabold ${s.color} leading-none tabular-nums`}>{s.value}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-none mt-0.5 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner MIDDLE — giữa trang, sau hero */}
      <BannerStrip position="MIDDLE" className="rounded-2xl overflow-hidden shadow-sm" />

      {/* File list + Sidebar */}
      <div className="flex gap-4 xl:gap-6">
        <div className="flex-1 min-w-0">
          <PublicFileList files={files as never} categories={categories as never} />
        </div>
        <SidebarAds />
      </div>
    </div>
  );
}
