// scripts/seed.js — khởi tạo dữ liệu ban đầu
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CDCMedia database...");

  // Create or update admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existing) {
    await prisma.user.create({
      data: { username: "admin", passwordHash, displayName: "Quản trị viên", role: "ADMIN" },
    });
    console.log("✅ Admin account created — username: admin / password: admin123");
  } else {
    await prisma.user.update({
      where: { username: "admin" },
      data: { passwordHash },
    });
    console.log("✅ Admin account password reset to admin123");
  }

  // Default categories for CDC media bank
  const defaultCategories = [
    { name: "Tờ rơi & Áp phích", slug: "to-roi-ap-phich", description: "Tờ rơi, poster, banner truyền thông sức khỏe", color: "#3B82F6", icon: "FileText", sortOrder: 1 },
    { name: "Video truyền thông", slug: "video-truyen-thong", description: "Video clip phòng chống dịch bệnh", color: "#8B5CF6", icon: "FileVideo", sortOrder: 2 },
    { name: "Hình ảnh sự kiện", slug: "hinh-anh-su-kien", description: "Hình ảnh hoạt động, chiến dịch y tế", color: "#22C55E", icon: "FileImage", sortOrder: 3 },
    { name: "Báo cáo & Tài liệu", slug: "bao-cao-tai-lieu", description: "Báo cáo dịch tễ, tài liệu hướng dẫn chuyên môn", color: "#EF4444", icon: "FileText", sortOrder: 4 },
    { name: "Infographic", slug: "infographic", description: "Đồ họa thông tin sức khỏe cộng đồng", color: "#F97316", icon: "BarChart2", sortOrder: 5 },
    { name: "Slide thuyết trình", slug: "slide-thuyet-trinh", description: "Bài trình chiếu tập huấn, hội thảo", color: "#14B8A6", icon: "Presentation", sortOrder: 6 },
    { name: "Âm thanh & Nhạc hiệu", slug: "am-thanh-nhac-hieu", description: "Jingle, clip âm thanh phát thanh", color: "#EC4899", icon: "FileAudio", sortOrder: 7 },
    { name: "Khác", slug: "khac", description: "Các tài liệu đa dạng khác", color: "#64748B", icon: "Folder", sortOrder: 99 },
  ];

  for (const cat of defaultCategories) {
    const ex = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!ex) {
      await prisma.category.create({ data: cat });
      console.log(`✅ Category created: ${cat.name}`);
    }
  }

  console.log("\n✨ Seed complete!");
  console.log("   Login: http://localhost:3000/login");
  console.log("   Username: admin | Password: admin123");
  console.log("   ⚠️  Đổi mật khẩu sau lần đăng nhập đầu tiên!\n");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
