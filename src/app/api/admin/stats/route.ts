// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isDriveConfigured } from "@/lib/gdrive";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const [totalFiles, totalCategories, totalUsers, storageAgg, downloadAgg, useDrive] = await Promise.all([
    prisma.mediaFile.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.mediaFile.aggregate({ _sum: { fileSize: true } }),
    prisma.mediaFile.aggregate({ _sum: { downloadCount: true } }),
    isDriveConfigured(),
  ]);

  return NextResponse.json({
    totalFiles,
    totalCategories,
    totalUsers,
    totalStorageBytes: storageAgg._sum.fileSize ?? 0,
    totalDownloads: downloadAgg._sum.downloadCount ?? 0,
    storageMode: useDrive ? "drive" : "local",
  });
}
