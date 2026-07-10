import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const DEFAULT_GROUPS = [
  { id: "VIDEO", name: "Thư viện Video", icon: "Film" },
  { id: "AUDIO", name: "Âm thanh & Podcast", icon: "Mic" },
  { id: "GRAPHICS", name: "Ấn phẩm & Hình ảnh", icon: "ImageIcon" },
  { id: "DOCUMENTS", name: "Tài liệu & Khai thác dữ liệu", icon: "FileText" }
];

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "APP_GROUPS" }
    });

    if (!setting) {
      return NextResponse.json({ groups: DEFAULT_GROUPS });
    }

    return NextResponse.json({ groups: JSON.parse(setting.value) });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groups } = await request.json();

    if (!Array.isArray(groups)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: "APP_GROUPS" },
      update: { value: JSON.stringify(groups) },
      create: { key: "APP_GROUPS", value: JSON.stringify(groups) }
    });

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error("Error updating groups:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
