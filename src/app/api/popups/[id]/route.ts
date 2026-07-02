// src/app/api/popups/[id]/route.ts
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
  const popup = await prisma.popup.update({
    where: { id },
    data: {
      title: body.title,
      imageUrl: body.imageUrl ?? null,
      content: body.content ?? null,
      linkUrl: body.linkUrl ?? null,
      linkLabel: body.linkLabel ?? null,
      isActive: body.isActive,
      showOnce: body.showOnce,
      delayMs: body.delayMs ?? 1000,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json(popup);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.popup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
