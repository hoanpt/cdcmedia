// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    await logActivity(session.userId, "LOGOUT", "Đăng xuất");
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
