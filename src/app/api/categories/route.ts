// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import { slugify } from "@/utils/format";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { files: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { name, description, color, icon, sortOrder } = await req.json();
  if (!name) return NextResponse.json({ error: "Tên chuyên mục là bắt buộc" }, { status: 400 });

  const slug = slugify(name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Chuyên mục đã tồn tại" }, { status: 409 });

  const category = await prisma.category.create({
    data: { name, slug, description, color, icon, sortOrder: sortOrder ?? 0 },
  });

  await logActivity(session.userId, "CREATE_CATEGORY", `Tạo chuyên mục: "${name}"`);
  return NextResponse.json({ category }, { status: 201 });
}
