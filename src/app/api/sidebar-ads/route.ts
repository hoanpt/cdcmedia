// src/app/api/sidebar-ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const now = new Date();
  const ads = await prisma.sidebarAd.findMany({
    where: {
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ad = await prisma.sidebarAd.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl ?? null,
      position: body.position ?? "LEFT",
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json(ad, { status: 201 });
}
