import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { listFilesInFolder, getFolderMetadata } from "@/lib/gdrive";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { folderId, isAlbum } = await req.json();
    if (!folderId) {
      return NextResponse.json({ error: "Missing folderId" }, { status: 400 });
    }

    // 1. Get folder metadata
    const folderMeta = await getFolderMetadata(folderId);
    if (!folderMeta) {
      return NextResponse.json({ error: "Could not read Google Drive folder. Check permissions or ID." }, { status: 404 });
    }
    const folderName = folderMeta.name;

    // 2. Fetch files from Drive
    const driveFiles = await listFilesInFolder(folderId);
    if (!driveFiles || driveFiles.length === 0) {
      return NextResponse.json({ message: "No files found in this folder", synced: 0 });
    }

    // 3. Ensure Tags exist
    const defaultTagName = "Khoa Bệnh truyền nhiễm";
    
    // Helper to get or create tag
    const getOrCreateTag = async (name: string) => {
      let tag = await prisma.tag.findUnique({ where: { name } });
      if (!tag) {
        tag = await prisma.tag.create({ data: { name } });
      }
      return tag;
    };

    const defaultTag = await getOrCreateTag(defaultTagName);
    const folderTag = await getOrCreateTag(folderName);

    // 4. Get Categories for classification
    const categories = await prisma.category.findMany();
    if (categories.length === 0) {
      return NextResponse.json({ error: "No categories in database. Please create one first." }, { status: 400 });
    }

    const imageCategory = categories.find(c => c.name.toLowerCase().includes("hình ảnh") || c.name.toLowerCase().includes("ảnh")) || categories[0];
    const videoCategory = categories.find(c => c.name.toLowerCase().includes("video")) || categories[0];
    const docCategory = categories.find(c => c.name.toLowerCase().includes("tờ rơi") || c.name.toLowerCase().includes("tài liệu") || c.name.toLowerCase().includes("văn bản")) || categories[0];

    // 5. Process files
    let syncedCount = 0;
    
    const validFiles = driveFiles.filter(f => f.mimeType !== "application/vnd.google-apps.folder");
    
    if (validFiles.length === 0) {
      return NextResponse.json({ message: "No valid files found in this folder", synced: 0 });
    }

    if (isAlbum) {
      // Check if this album was already synced (by checking if the first file exists as a main file or attachment)
      const firstFile = validFiles[0];
      const existing = await prisma.mediaFile.findFirst({
        where: { driveFileId: firstFile.id }
      });

      if (!existing) {
        let assignedCategoryId = docCategory.id;
        if (firstFile.mimeType.startsWith("image/")) assignedCategoryId = imageCategory.id;
        else if (firstFile.mimeType.startsWith("video/")) assignedCategoryId = videoCategory.id;

        const newFile = await prisma.mediaFile.create({
          data: {
            title: folderName, // Use folder name as the title of the Album
            filename: firstFile.name,
            filepath: "external",
            fileType: firstFile.mimeType,
            fileSize: firstFile.size ? parseInt(firstFile.size) : 0,
            driveFileId: firstFile.id,
            driveWebLink: firstFile.webViewLink,
            thumbnailUrl: firstFile.thumbnailLink?.replace(/=s\d+/, "=s800"),
            isPublic: true,
            categoryId: assignedCategoryId,
            uploaderId: session.userId,
            attachments: {
              create: validFiles.slice(1).map(f => ({
                filename: f.name,
                filepath: "external",
                fileType: f.mimeType,
                fileSize: f.size ? parseInt(f.size) : 0,
                driveFileId: f.id,
                driveWebLink: f.webViewLink,
                thumbnailUrl: f.thumbnailLink?.replace(/=s\d+/, "=s800"),
              }))
            }
          }
        });

        const tagsToConnect = Array.from(new Set([defaultTag.id, folderTag.id]));
        await prisma.mediaFileTag.createMany({
          data: tagsToConnect.map(tagId => ({
            fileId: newFile.id,
            tagId
          })),
          skipDuplicates: true
        });

        syncedCount = validFiles.length;
      }
    } else {
      for (const dFile of validFiles) {
        // Check if file already exists in DB
        const existing = await prisma.mediaFile.findFirst({
          where: { driveFileId: dFile.id }
        });

        if (existing) continue; // Skip existing

        // Classify
        let assignedCategoryId = docCategory.id;
        if (dFile.mimeType.startsWith("image/")) assignedCategoryId = imageCategory.id;
        else if (dFile.mimeType.startsWith("video/")) assignedCategoryId = videoCategory.id;
        
        const fileSize = dFile.size ? parseInt(dFile.size) : 0;

        // Create record
        const newFile = await prisma.mediaFile.create({
          data: {
            title: dFile.name.replace(/\.[^/.]+$/, ""),
            filename: dFile.name,
            filepath: "external",
            fileType: dFile.mimeType,
            fileSize,
            driveFileId: dFile.id,
            driveWebLink: dFile.webViewLink,
            thumbnailUrl: dFile.thumbnailLink?.replace(/=s\d+/, "=s800"), // High res thumbnail
            isPublic: true,
            categoryId: assignedCategoryId,
            uploaderId: session.userId,
          }
        });

        // Attach tags
        const tagsToConnect = Array.from(new Set([defaultTag.id, folderTag.id]));
        await prisma.mediaFileTag.createMany({
          data: tagsToConnect.map(tagId => ({
            fileId: newFile.id,
            tagId
          })),
          skipDuplicates: true
        });

        syncedCount++;
      }
    }

    return NextResponse.json({ message: "Success", synced: syncedCount, totalScanned: driveFiles.length });

  } catch (error: any) {
    console.error("[sync-gdrive]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
