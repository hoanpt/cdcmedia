import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// GET /api/thumbnail/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    let file: any = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) {
      const attachment = await prisma.mediaAttachment.findUnique({ where: { id } });
      if (attachment) {
        file = attachment;
      }
    }
    
    if (!file) return new NextResponse("Not Found", { status: 404 });

    // 1. If it is a Google Drive file, use the permanent thumbnail endpoint
    // This is much faster, never expires, and works for videos and images.
    if (file.driveFileId) {
      const driveThumbUrl = `https://drive.google.com/thumbnail?id=${file.driveFileId}&sz=w800`;
      const response = NextResponse.redirect(driveThumbUrl);
      // Cache heavily as this URL acts as a permanent redirect to Google's CDN
      response.headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
      return response;
    }

    // 2. If it's a local image upload, stream it directly
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

    // 3. Fallback to custom thumbnailUrl if exists and not googleusercontent (which expires)
    if (file.thumbnailUrl && !file.thumbnailUrl.includes('googleusercontent.com')) {
      const response = NextResponse.redirect(file.thumbnailUrl);
      response.headers.set("Cache-Control", "public, max-age=86400");
      return response;
    }

    return new NextResponse("No thumbnail available", { status: 404 });
  } catch (error) {
    console.error("[thumbnail API]", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
