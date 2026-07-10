const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting category migration...");

  // Define the target categories and their groups
  const targetCategories = [
    { name: "Thư viện Video", slug: "thu-vien-video", group: "VIDEO", icon: "Video", color: "#EC4899" },
    { name: "Âm thanh & Podcast", slug: "am-thanh-podcast", group: "AUDIO", icon: "Mic", color: "#F59E0B" },
    { name: "Thiết kế truyền thông", slug: "thiet-ke-truyen-thong", group: "GRAPHICS", icon: "Image", color: "#10B981" },
    { name: "Tài liệu chuyên môn", slug: "tai-lieu-chuyen-mon", group: "DOCUMENTS", icon: "FileText", color: "#3B82F6" },
    { name: "Biểu mẫu hành chính", slug: "bieu-mau-hanh-chinh", group: "DOCUMENTS", icon: "FileSpreadsheet", color: "#8B5CF6" },
  ];

  const categoryMap = {};

  // 1. Ensure target categories exist and have correct group
  for (const tc of targetCategories) {
    let cat = await prisma.category.findUnique({ where: { name: tc.name } });
    if (!cat) {
      console.log(`Creating missing category: ${tc.name}`);
      cat = await prisma.category.create({
        data: tc
      });
    } else {
      console.log(`Updating existing category: ${tc.name} to group ${tc.group}`);
      cat = await prisma.category.update({
        where: { id: cat.id },
        data: { group: tc.group, icon: tc.icon, color: tc.color }
      });
    }
    categoryMap[tc.name] = cat.id;
  }

  // 2. Map old categories to new ones
  const allCategories = await prisma.category.findMany();
  for (const cat of allCategories) {
    if (Object.values(categoryMap).includes(cat.id)) {
      continue; // Already a target category
    }

    let targetId = categoryMap["Tài liệu chuyên môn"]; // Default fallback

    if (cat.name.toLowerCase().includes("video")) {
      targetId = categoryMap["Thư viện Video"];
    } else if (cat.name.toLowerCase().includes("audio") || cat.name.toLowerCase().includes("podcast") || cat.name.toLowerCase().includes("phát thanh")) {
      targetId = categoryMap["Âm thanh & Podcast"];
    } else if (cat.name.toLowerCase().includes("hình ảnh") || cat.name.toLowerCase().includes("thiết kế") || cat.name.toLowerCase().includes("banner")) {
      targetId = categoryMap["Thiết kế truyền thông"];
    } else if (cat.name.toLowerCase().includes("biểu mẫu") || cat.name.toLowerCase().includes("hành chính")) {
      targetId = categoryMap["Biểu mẫu hành chính"];
    }

    console.log(`Moving files from "${cat.name}" to new category ID: ${targetId}`);
    
    // Update all files to new category
    await prisma.mediaFile.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: targetId }
    });

    // Delete old category
    console.log(`Deleting old category: ${cat.name}`);
    await prisma.category.delete({ where: { id: cat.id } });
  }

  console.log("✅ Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
