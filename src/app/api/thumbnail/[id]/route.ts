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

    // If we have a Google Drive thumbnailLink, redirect to it (higher resolution trick: replace =s220 with =s800)
    if (file.thumbnailUrl) {
      const highResUrl = file.thumbnailUrl.replace(/=s\d+/, "=s800");
      const response = NextResponse.redirect(highResUrl);
      response.headers.set("Cache-Control", "public, max-age=604800, immutable");
      return response;
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
    } else if ((file.filepath?.startsWith("gdrive://") || file.filepath === "external") && file.fileType.startsWith("image/")) {
      // For images directly uploaded to Drive that don't have a thumbnail ready yet,
      // fallback to streaming the full image as a preview. (It will be cached by CDN).
      const downloadUrl = new URL(`/api/download/${id}?preview=true`, req.url).toString();
      const response = NextResponse.redirect(downloadUrl);
      response.headers.set("Cache-Control", "public, max-age=604800, immutable");
      return response;
    }

    return new NextResponse("No thumbnail available", { status: 404 });
  } catch (error) {
    console.error("[thumbnail API]", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
