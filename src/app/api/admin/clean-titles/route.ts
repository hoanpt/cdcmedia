import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const files = await prisma.mediaFile.findMany();
  let count = 0;
  for (const file of files) {
    if (file.title && file.title.includes('.')) {
      // Check if title ends with an extension like .jpg, .png, .mp4, .pdf
      if (file.title.match(/\.(jpg|jpeg|png|gif|mp4|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
        const newTitle = file.title.replace(/\.[^/.]+$/, "");
        await prisma.mediaFile.update({
          where: { id: file.id },
          data: { title: newTitle }
        });
        count++;
      }
    }
  }
  return NextResponse.json({ updated: count });
}
