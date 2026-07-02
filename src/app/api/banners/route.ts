// src/app/api/banners/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const session = all ? await getSession() : null;

  if (all && (!session || session.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: all ? undefined : {
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const banner = await prisma.banner.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl ?? null,
      position: body.position ?? "TOP",
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json(banner, { status: 201 });
}
