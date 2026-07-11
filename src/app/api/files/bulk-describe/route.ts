import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getGeminiKey, generateFileDescription } from "@/lib/ai";
import { downloadDriveFile } from "@/lib/gdrive";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { fileIds } = await req.json();
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "Chưa chọn tài liệu nào" }, { status: 400 });
  }

  const geminiKey = await getGeminiKey();
  if (!geminiKey) {
    return NextResponse.json({ error: "Chưa cấu hình Gemini API Key" }, { status: 400 });
  }

  // Admin or Owner check
  const where: any = { id: { in: fileIds } };
  if (session.role !== "ADMIN") {
    where.uploaderId = session.userId;
  }

  const files = await prisma.mediaFile.findMany({
    where,
    select: { id: true, title: true, filepath: true, driveFileId: true, description: true }
  });

  if (files.length === 0) {
    return NextResponse.json({ error: "Không tìm thấy tài liệu phù hợp" }, { status: 404 });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    // skip if it already has description
    if (file.description && file.description.trim().length > 10) {
      continue;
    }

    try {
      let buffer: Buffer | null = null;
      let filenameForExt = file.title;

      if (file.driveFileId) {
        // Fetch from Google Drive
        buffer = await downloadDriveFile(file.driveFileId);
        // We might need a better filename to guess the extension, but we can assume from the title
      } else if (file.filepath && file.filepath !== "external") {
        // Local file
        const fullPath = path.join(process.cwd(), "uploads", file.filepath);
        if (existsSync(fullPath)) {
          buffer = await readFile(fullPath);
          filenameForExt = file.filepath; // has actual extension
        }
      }

      if (buffer) {
        const description = await generateFileDescription(buffer, filenameForExt, geminiKey);
        if (description) {
          await prisma.mediaFile.update({
            where: { id: file.id },
            data: { description }
          });
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    } catch (e) {
      console.error(`[bulk-describe] Error processing file ${file.id}:`, e);
      errorCount++;
    }
  }

  return NextResponse.json({ 
    message: `Đã tạo mô tả cho ${successCount} tài liệu, thất bại/bỏ qua ${errorCount} tài liệu`,
    successCount,
    errorCount
  });
}
