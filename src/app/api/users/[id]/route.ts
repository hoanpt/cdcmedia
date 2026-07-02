// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { displayName, role, isActive, password } = await req.json();
  const updateData: Record<string, unknown> = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) {
    if (password.length < 6) return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
  });

  await logActivity(session.userId, "UPDATE", `Cập nhật tài khoản: "${user.username}"`);
  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (user.username === "admin") {
    return NextResponse.json({ error: "Không thể xóa tài khoản admin gốc" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  await logActivity(session.userId, "DELETE_USER", `Xóa tài khoản: "${user.username}"`);
  return NextResponse.json({ ok: true });
}
