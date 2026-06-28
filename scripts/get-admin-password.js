const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ where: { email: 'ravi@encogix.com' } });
    console.log('Admin user:', user);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
