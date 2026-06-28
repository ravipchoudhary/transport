const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({ select: { id: true, fullName: true, email: true, mobile: true, role: true, createdAt: true } });
    console.log('Users:', users);
  } catch (e) {
    console.error('Error listing users:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
