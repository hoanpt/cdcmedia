import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export async function PATCH(request: Request) {
  try {
    const user = await getSession();
    if (!user || user.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileIds, categoryId } = await request.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No files selected" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Missing categoryId" }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Admin can update any file, Uploader can only update their own files
    const updateCondition = user.role === "ADMIN" 
      ? { id: { in: fileIds } } 
      : { id: { in: fileIds }, uploaderId: user.userId };

    const result = await prisma.mediaFile.updateMany({
      where: updateCondition,
      data: { categoryId }
    });

    // Log the activity
    await logActivity(user.userId, "UPDATE", `Bulk moved ${result.count} files to category ${category.name}`);

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error bulk updating files:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
