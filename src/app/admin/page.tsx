// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatFileSize } from "@/utils/format";
import { isDriveConfigured } from "@/lib/gdrive";
import AdminTabs from "./AdminTabs";
import { FileArchive, FolderOpen, Users, HardDrive, Download, Cloud, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [totalFiles, totalCategories, totalUsers, storageAgg, downloadAgg, useDrive] = await Promise.all([
    prisma.mediaFile.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.mediaFile.aggregate({ _sum: { fileSize: true } }),
    prisma.mediaFile.aggregate({ _sum: { downloadCount: true } }),
    isDriveConfigured(),
  ]);

  const totalSize = storageAgg._sum.fileSize ?? 0;
  const totalDownloads = downloadAgg._sum.downloadCount ?? 0;

  const stats = [
    { label: "Tổng tài liệu", value: totalFiles, icon: FileArchive, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Chuyên mục", value: totalCategories, icon: FolderOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Người dùng", value: totalUsers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Dung lượng", value: formatFileSize(totalSize), icon: HardDrive, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Lượt tải", value: totalDownloads, icon: Download, color: "text-pink-600", bg: "bg-pink-50" },
    {
      label: "Lưu trữ",
      value: useDrive ? "Google Drive" : "Máy chủ nội bộ",
      icon: useDrive ? Cloud : Server,
      color: useDrive ? "text-sky-600" : "text-slate-600",
      bg: useDrive ? "bg-sky-50" : "bg-slate-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Quản trị hệ thống</h1>
        <p className="text-slate-500 text-sm mt-1">CDC Media – Ngân hàng Tài liệu Truyền thông</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card py-3 sm:py-4 flex flex-col items-center text-center gap-1.5 sm:gap-2 p-3 sm:p-4">
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ${s.bg}`}>
              <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-sm sm:text-lg font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-tight mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <AdminTabs />
    </div>
  );
}
