// src/app/api/download/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadFromDrive } from "@/lib/gdrive";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const preview = req.nextUrl.searchParams.get("preview") === "true";

  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Increment download count (non-blocking)
  if (!preview) {
    prisma.mediaFile.update({ where: { id }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
  }

  const disposition = preview ? "inline" : `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`;

  // ─── Google Drive ───────────────────────────────────────────────
  if (file.filepath.startsWith("gdrive://")) {
    try {
      const { data, contentType, contentLength } = await downloadFromDrive(file.driveFileId!);
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      };
      if (contentLength) headers["Content-Length"] = String(contentLength);

      return new NextResponse(Readable.toWeb(data as Readable) as ReadableStream, { headers });
    } catch (err) {
      console.error("[download] Drive error:", err);
      return NextResponse.json({ error: "Lỗi khi tải từ Google Drive" }, { status: 502 });
    }
  }

  // ─── Local file ─────────────────────────────────────────────────
  const localPath = path.join(process.cwd(), "uploads", file.filepath);
  if (!existsSync(localPath)) {
    return NextResponse.json({ error: "File không tồn tại trên server" }, { status: 404 });
  }

  const stat = statSync(localPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(localPath, { start, end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": file.fileType,
        "Content-Disposition": disposition,
      },
    });
  }

  const stream = createReadStream(localPath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": file.fileType,
      "Content-Disposition": disposition,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
