import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: "global_visitors" } });
    let count = row ? parseInt(row.value, 10) : 15420;
    
    count += 1;
    
    await prisma.appSetting.upsert({
      where: { key: "global_visitors" },
      create: { key: "global_visitors", value: count.toString() },
      update: { value: count.toString() }
    });

    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json({ count: 15420 });
  }
}
