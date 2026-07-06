// src/app/api/uploads/[...path]/route.ts
// Serve ảnh local từ thư mục uploads/ (dùng cho ảnh banner/sidebar/popup)
import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

type Params = { params: Promise<{ path: string[] }> };

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml",
};

export async function GET(_: NextRequest, { params }: Params) {
  const { path: segments } = await params;

  // Chặn path traversal
  const relative = segments.join("/").replace(/\.\./g, "");
  const filePath = path.join(process.cwd(), "uploads", relative);

  if (!existsSync(filePath)) {
    if (relative === "logo.png") {
      const fallbackPath = path.join(process.cwd(), "public", "logo.png");
      if (existsSync(fallbackPath)) {
        const fileBuffer = await readFile(fallbackPath);
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";
  const { size } = statSync(filePath);

  const fileBuffer = await readFile(filePath);
  const isLogo = relative.toLowerCase() === "logo.png";
  const cacheControl = isLogo ? "no-cache, no-store, must-revalidate" : "public, max-age=86400";
  
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Cache-Control": cacheControl,
    },
  });
}
