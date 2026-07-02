// src/app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { deleteFromDrive } from "@/lib/gdrive";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

type Params = { params: Promise<{ id: string }> };

// GET /api/files/[id] — single file detail
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const file = await prisma.mediaFile.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
      uploader: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });
  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ file });
}

// PUT /api/files/[id] — update title, description, category, tags
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isOwner = file.uploaderId === session.userId;
  if (!isOwner && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { title, description, categoryId, tags: tagNames, year, isPublic } = await req.json();

  // Rebuild tags
  let tagsUpdate = {};
  if (Array.isArray(tagNames)) {
    const tagRecords = await Promise.all(
      tagNames.map((name: string) =>
        prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
          select: { id: true },
        })
      )
    );
    tagsUpdate = {
      tags: {
        deleteMany: {},
        create: tagRecords.map((t) => ({ tagId: t.id })),
      },
    };
  }

  const updated = await prisma.mediaFile.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(categoryId && { categoryId }),
      ...(year !== undefined && { year }),
      ...(isPublic !== undefined && { isPublic }),
      ...tagsUpdate,
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
      uploader: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });

  await logActivity(session.userId, "UPDATE", `Cập nhật: "${updated.title}"`);
  return NextResponse.json({ file: updated });
}

// DELETE /api/files/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isOwner = file.uploaderId === session.userId;
  if (!isOwner && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  // Remove from storage
  if (file.filepath.startsWith("gdrive://")) {
    try {
      await deleteFromDrive(file.driveFileId!);
    } catch (e) {
      console.warn("[delete] Drive delete failed:", e);
    }
  } else {
    const localPath = path.join(process.cwd(), "uploads", file.filepath);
    if (existsSync(localPath)) await unlink(localPath);
  }

  await prisma.mediaFile.delete({ where: { id } });

  await logActivity(session.userId, "DELETE", `Xóa: "${file.title}"`);
  return NextResponse.json({ ok: true });
}
