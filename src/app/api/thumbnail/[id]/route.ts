import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// GET /api/thumbnail/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) return new NextResponse("Not Found", { status: 404 });

    // If we have a Google Drive thumbnailLink, redirect to it (higher resolution trick: replace =s220 with =s800)
    if (file.thumbnailUrl) {
      const highResUrl = file.thumbnailUrl.replace(/=s\d+/, "=s800");
      return NextResponse.redirect(highResUrl);
    }

    // If it's a local image upload, stream it directly
    if (file.filepath && !file.filepath.startsWith("gdrive://") && file.filepath !== "external") {
      if (file.fileType.startsWith("image/")) {
        const localPath = path.join(process.cwd(), "uploads", file.filepath);
        if (fs.existsSync(localPath)) {
          const stream = fs.createReadStream(localPath);
          return new NextResponse(stream as unknown as ReadableStream, {
            headers: {
              "Content-Type": file.fileType,
              "Cache-Control": "public, max-age=31536000, immutable"
            }
          });
        }
      }
    }

    return new NextResponse("No thumbnail available", { status: 404 });
  } catch (error) {
    console.error("[thumbnail API]", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
