// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, displayName: true,
      role: true, isActive: true, createdAt: true,
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const { username, password, displayName, role } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Tên đăng nhập và mật khẩu là bắt buộc" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash, displayName, role: role ?? "UPLOADER" },
    select: { id: true, username: true, displayName: true, role: true, isActive: true, createdAt: true },
  });

  await logActivity(session.userId, "CREATE_USER", `Tạo tài khoản: "${username}" (${role ?? "UPLOADER"})`);
  return NextResponse.json({ user }, { status: 201 });
}
