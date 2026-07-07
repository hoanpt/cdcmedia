// src/app/api/admin/analytics/route.ts
// Thống kê toàn diện cho admin dashboard
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7);
  const d90 = new Date(now); d90.setDate(d90.getDate() - 90);

  const [
    // Tổng quan
    totalFiles,
    totalPublic,
    totalDownloads,
    totalViews,
    totalSize,

    // Top tài liệu theo lượt tải
    topByDownload,

    // Top chuyên mục theo số file + lượt tải
    categoryStats,

    // Upload theo tháng (12 tháng gần nhất)
    uploadByMonth,

    // Theo loại file
    byFileType,

    // File mới 30 ngày
    recentFiles,

    // File chưa có lượt tải nào
    zeroDownload,

    // Top uploader
    topUploaders,
  ] = await Promise.all([
    prisma.mediaFile.count(),
    prisma.mediaFile.count({ where: { isPublic: true } }),
    prisma.mediaFile.aggregate({ _sum: { downloadCount: true } }),
    prisma.mediaFile.aggregate({ _sum: { viewCount: true } }),
    prisma.mediaFile.aggregate({ _sum: { fileSize: true } }),

    // Top 10 file tải nhiều nhất
    prisma.mediaFile.findMany({
      orderBy: { downloadCount: "desc" },
      take: 10,
      select: {
        id: true, title: true, fileType: true, downloadCount: true, viewCount: true,
        fileSize: true, createdAt: true, isPublic: true,
        category: { select: { name: true, color: true } },
      },
    }),

    // Thống kê theo chuyên mục
    prisma.category.findMany({
      include: {
        _count: { select: { files: true } },
        files: {
          select: { downloadCount: true, viewCount: true, fileSize: true, isPublic: true },
        },
      },
      orderBy: { name: "asc" },
    }),

    // Upload theo tháng — group by month thủ công
    prisma.mediaFile.findMany({
      where: { createdAt: { gte: d90 } },
      select: { createdAt: true, fileSize: true },
      orderBy: { createdAt: "asc" },
    }),

    // Phân bố loại file
    prisma.mediaFile.findMany({
      select: { fileType: true, fileSize: true, downloadCount: true, viewCount: true },
    }),

    // File mới 30 ngày
    prisma.mediaFile.count({ where: { createdAt: { gte: d30 } } }),

    // File 0 lượt tải
    prisma.mediaFile.count({ where: { downloadCount: 0 } }),

    // Top uploader
    prisma.user.findMany({
      include: {
        _count: { select: { files: true } },
        files: { select: { downloadCount: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // ── Xử lý upload theo tháng ──────────────────────────────────────────────
  const monthMap: Record<string, { month: string; count: number; sizeMB: number }> = {};
  for (const f of uploadByMonth) {
    const key = `${f.createdAt.getFullYear()}-${String(f.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) monthMap[key] = { month: key, count: 0, sizeMB: 0 };
    monthMap[key].count++;
    monthMap[key].sizeMB += f.fileSize / 1024 / 1024;
  }
  const uploadTrend = Object.values(monthMap).map(m => ({
    ...m, sizeMB: Math.round(m.sizeMB * 10) / 10,
  }));

  // ── Phân bố loại file ────────────────────────────────────────────────────
  const typeMap: Record<string, { label: string; count: number; downloads: number; sizeMB: number }> = {};
  for (const f of byFileType) {
    const label = classifyType(f.fileType);
    if (!typeMap[label]) typeMap[label] = { label, count: 0, downloads: 0, sizeMB: 0 };
    typeMap[label].count++;
    typeMap[label].downloads += f.downloadCount;
    typeMap[label].sizeMB += f.fileSize / 1024 / 1024;
  }
  const fileTypeBreakdown = Object.values(typeMap)
    .map(t => ({ ...t, sizeMB: Math.round(t.sizeMB * 10) / 10 }))
    .sort((a, b) => b.count - a.count);

  // ── Thống kê chuyên mục ──────────────────────────────────────────────────
  const catStats = categoryStats.map((cat: any) => {
    const totalDl = cat.files.reduce((s: number, f: any) => s + f.downloadCount, 0);
    const totalSz = cat.files.reduce((s: number, f: any) => s + f.fileSize, 0);
    const publicCount = cat.files.filter((f: any) => f.isPublic).length;
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      fileCount: cat._count.files,
      publicCount,
      totalDownloads: totalDl,
      sizeMB: Math.round(totalSz / 1024 / 1024 * 10) / 10,
      avgDownloads: cat._count.files > 0 ? Math.round(totalDl / cat._count.files) : 0,
    };
  }).sort((a: any, b: any) => b.totalDownloads - a.totalDownloads);

  // ── Top uploader ─────────────────────────────────────────────────────────
  const uploaderStats = topUploaders.map((u: any) => ({
    id: u.id,
    name: u.displayName ?? u.username,
    role: u.role,
    fileCount: u._count.files,
    totalDownloads: u.files.reduce((s: number, f: any) => s + f.downloadCount, 0),
  })).sort((a: any, b: any) => b.fileCount - a.fileCount).slice(0, 10);

  // ── Hiệu quả (effectiveness score) ─────────────────────────────────────
  // Score = downloads / max_downloads * 100, để so sánh tương đối
  const maxDl = topByDownload[0]?.downloadCount ?? 1;
  const topFilesWithScore = topByDownload.map((f: any) => ({
    ...f,
    score: Math.round((f.downloadCount / maxDl) * 100),
  }));

  return NextResponse.json({
    overview: {
      totalFiles,
      totalPublic,
      totalPrivate: totalFiles - totalPublic,
      totalDownloads: totalDownloads._sum.downloadCount ?? 0,
      totalViews: totalViews._sum.viewCount ?? 0,
      totalSizeMB: (totalSize._sum.fileSize ?? 0) / (1024 * 1024),
      recentFiles,
      zeroDownload,
      zeroDownloadPct: totalFiles > 0 ? Math.round(zeroDownload / totalFiles * 100) : 0,
    },
    topFiles: topFilesWithScore,
    categoryStats: catStats,
    uploadTrend,
    fileTypeBreakdown,
    uploaderStats,
  });
}

function classifyType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Hình ảnh";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Âm thanh";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Word";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Excel";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PowerPoint";
  return "Khác";
}
