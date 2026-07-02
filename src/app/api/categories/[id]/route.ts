// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { slugify } from "@/utils/format";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { name, description, color, icon, sortOrder } = await req.json();
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) { updateData.name = name; updateData.slug = slugify(name); }
  if (description !== undefined) updateData.description = description;
  if (color !== undefined) updateData.color = color;
  if (icon !== undefined) updateData.icon = icon;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const category = await prisma.category.update({ where: { id }, data: updateData });
  await logActivity(session.userId, "UPDATE", `Cập nhật chuyên mục: "${category.name}"`);
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Cascade handled by Prisma — delete files first manually so storage is cleaned
  const files = await prisma.mediaFile.findMany({ where: { categoryId: id } });
  for (const f of files) {
    if (f.filepath.startsWith("gdrive://")) {
      try {
        const { deleteFromDrive } = await import("@/lib/gdrive");
        await deleteFromDrive(f.driveFileId!);
      } catch {}
    } else {
      const { unlink } = await import("fs/promises");
      const { existsSync } = await import("fs");
      const path = await import("path");
      const local = path.join(process.cwd(), "uploads", f.filepath);
      if (existsSync(local)) await unlink(local);
    }
  }

  await prisma.mediaFile.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });

  await logActivity(session.userId, "DELETE_CATEGORY", `Xóa chuyên mục: "${category.name}" (${files.length} file)`);
  return NextResponse.json({ ok: true });
}
