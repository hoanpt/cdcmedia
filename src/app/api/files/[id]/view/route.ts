import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Increment view count for the file
    await prisma.mediaFile.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[view api error]", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
