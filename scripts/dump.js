const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.category.findMany().then(console.log).finally(() => prisma.$disconnect());
