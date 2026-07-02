// src/app/api/sidebar-ads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const ad = await prisma.sidebarAd.update({
    where: { id },
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl ?? null,
      isActive: body.isActive,
      sortOrder: body.sortOrder ?? 0,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json(ad);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.sidebarAd.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
