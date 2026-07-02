// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu mới tối thiểu 6 ký tự" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Mật khẩu mới phải khác mật khẩu cũ" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  await logActivity(session.userId, "CHANGE_PASSWORD", `Đổi mật khẩu tài khoản: "${user.username}"`);
  return NextResponse.json({ ok: true });
}
