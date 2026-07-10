// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatFileSize } from "@/utils/format";
import DashboardClient from "./DashboardClient";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import { FileArchive, HardDrive, FolderOpen, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";

  const [categories, ownFiles, storageAgg] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, color: true, group: true },
      orderBy: { name: "asc" },
    }),
    prisma.mediaFile.findMany({
      where: isAdmin ? {} : { uploaderId: session.userId },
      select: { fileSize: true, downloadCount: true },
    }),
    prisma.mediaFile.aggregate({
      _sum: { fileSize: true },
      where: isAdmin ? {} : { uploaderId: session.userId },
    }),
  ]);

  const totalSize = storageAgg._sum.fileSize ?? 0;
  const totalDownloads = ownFiles.reduce((s: number, f: any) => s + f.downloadCount, 0);

  const stats = [
    { label: "Tài liệu", value: ownFiles.length, icon: FileArchive, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Dung lượng", value: formatFileSize(totalSize), icon: HardDrive, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Chuyên mục", value: categories.length, icon: FolderOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Lượt tải", value: totalDownloads, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Xin chào, <span className="gradient-text">{session.displayName ?? session.username}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin ? "Quản lý toàn bộ tài liệu" : "Quản lý tài liệu của bạn"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`card flex items-center gap-3 py-4`}>
            <div className={`p-2.5 rounded-2xl ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Change password */}
      <ChangePasswordCard />

      {/* Main */}
      <DashboardClient
        categories={categories}
        isAdmin={isAdmin}
      />
    </div>
  );
}
