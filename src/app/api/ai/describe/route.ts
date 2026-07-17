import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGeminiKey, generateFileDescription } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { downloadDriveFile } from "@/lib/gdrive";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const geminiKey = await getGeminiKey();
  if (!geminiKey) return NextResponse.json({ error: "Chưa cấu hình Gemini API Key" }, { status: 400 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileId = formData.get("fileId") as string | null;

    let buffer: Buffer | null = null;
    let filename = "document.txt";

    if (file) {
      buffer = Buffer.from(await file.arrayBuffer());
      filename = file.name;
    } else if (fileId) {
      const existingFile = await prisma.mediaFile.findUnique({ where: { id: fileId } });
      if (!existingFile) return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
      
      filename = existingFile.filepath !== "external" ? existingFile.filepath : existingFile.title;

      if (existingFile.driveFileId) {
        buffer = await downloadDriveFile(existingFile.driveFileId);
      } else if (existingFile.filepath && existingFile.filepath !== "external") {
        const fullPath = path.join(process.cwd(), "uploads", existingFile.filepath);
        if (existsSync(fullPath)) {
          buffer = await readFile(fullPath);
        }
      }
    }

    if (!buffer) {
      return NextResponse.json({ error: "Không thể lấy dữ liệu tài liệu để phân tích" }, { status: 400 });
    }

    const description = await generateFileDescription(buffer, filename, geminiKey);
    if (!description) {
      return NextResponse.json({ error: "AI không thể tạo mô tả cho tài liệu này (file quá lớn hoặc không có nội dung)" }, { status: 400 });
    }

    return NextResponse.json({ description });
  } catch (err: any) {
    console.error("[ai/describe] Error:", err);
    return NextResponse.json({ error: "Lỗi khi gọi AI: " + (err.message || "Unknown") }, { status: 500 });
  }
}
