// src/app/api/upload-image/route.ts
// Upload ảnh banner/sidebar/popup từ máy tính → lưu uploads/ads/
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Chỉ chấp nhận ảnh (JPG, PNG, GIF, WebP, SVG)" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Ảnh tối đa 10MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;

  const adsDir = path.join(process.cwd(), "uploads", "ads");
  if (!existsSync(adsDir)) await mkdir(adsDir, { recursive: true });

  await writeFile(path.join(adsDir, filename), buffer);

  return NextResponse.json({ url: `/api/uploads/ads/${filename}` }, { status: 201 });
}
