// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

const DRIVE_KEYS = ["gdrive_client_id", "gdrive_client_secret", "gdrive_refresh_token", "gdrive_folder_id", "default_thumbnail_url"];
const SECRET_KEYS = ["gdrive_client_secret", "gdrive_refresh_token"];

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const rows = await prisma.appSetting.findMany({ where: { key: { in: DRIVE_KEYS } } });
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = SECRET_KEYS.includes(r.key) && r.value
      ? r.value.slice(0, 6) + "••••••••"
      : r.value;
  }
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const body = await req.json();

  for (const key of DRIVE_KEYS) {
    if (body[key] !== undefined) {
      // Don't overwrite with masked value
      if (SECRET_KEYS.includes(key) && body[key].includes("••")) continue;
      await prisma.appSetting.upsert({
        where: { key },
        create: { key, value: body[key] },
        update: { value: body[key] },
      });
    }
  }

  await logActivity(session.userId, "UPDATE_SETTINGS", "Cập nhật cài đặt Google Drive");
  return NextResponse.json({ ok: true });
}
