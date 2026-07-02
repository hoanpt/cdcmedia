// src/app/api/settings/test-drive/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDriveStorageInfo } from "@/lib/gdrive";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  try {
    const info = await getDriveStorageInfo();
    return NextResponse.json({ ok: true, ...info });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
