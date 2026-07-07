require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const files = await prisma.mediaFile.findMany();
  let count = 0;
  for (const file of files) {
    if (file.title.match(/\.[a-zA-Z0-9]+$/)) {
      const newTitle = file.title.replace(/\.[^/.]+$/, "");
      await prisma.mediaFile.update({
        where: { id: file.id },
        data: { title: newTitle }
      });
      console.log(`Updated "${file.title}" -> "${newTitle}"`);
      count++;
    }
  }
  console.log(`Updated ${count} files.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
