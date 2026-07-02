// src/app/page.tsx — public home
import { prisma } from "@/lib/prisma";
import PublicFileList from "@/components/PublicFileList";
import SidebarAds from "@/components/SidebarAds";
import BannerStrip from "@/components/BannerStrip";
import { isDriveConfigured } from "@/lib/gdrive";
import { formatFileSize } from "@/utils/format";
import { FileArchive, FolderOpen, Download, HardDrive } from "lucide-react";

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
    { label: "Tài liệu", value: files.length, icon: FileArchive, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Chuyên mục", value: categories.length, icon: FolderOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Lượt tải", value: totalDownloads, icon: Download, color: "text-emerald-600", bg: "bg-emerald-50" },
    {
      label: "Dung lượng",
      value: formatFileSize(totalSize),
      icon: HardDrive,
      color: useDrive ? "text-violet-600" : "text-slate-600",
      bg: useDrive ? "bg-violet-50" : "bg-slate-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="card text-center py-8 sm:py-12 relative overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 60% 0%, #dbeafe88, transparent 60%), radial-gradient(ellipse at 40% 100%, #ede9fe66, transparent 60%)"
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-3">
            Ngân hàng Tài liệu<br />
            <span className="gradient-text">Truyền thông Sức khỏe</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Kho lưu trữ tập trung tài liệu truyền thông, hình ảnh, video và ấn phẩm phòng chống dịch bệnh của CDC Đà Nẵng.
          </p>

          {/* Stats pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            {stats.map((s) => (
              <div key={s.label} className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-2xl ${s.bg} border border-white/60 shadow-sm`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <div className="text-left">
                  <p className={`text-sm sm:text-base font-bold ${s.color} leading-none`}>{s.value}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-none mt-0.5">{s.label}</p>
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
