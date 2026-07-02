// src/app/api/popups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const session = all ? await getSession() : null;

  if (all && (!session || session.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  if (all) {
    const popups = await prisma.popup.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(popups);
  }

  const popups = await prisma.popup.findMany({
    where: {
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return NextResponse.json(popups[0] ?? null);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const popup = await prisma.popup.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl ?? null,
      content: body.content ?? null,
      linkUrl: body.linkUrl ?? null,
      linkLabel: body.linkLabel ?? null,
      isActive: body.isActive ?? true,
      showOnce: body.showOnce ?? true,
      delayMs: body.delayMs ?? 1000,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json(popup, { status: 201 });
}
