// Simulate running login with DATABASE_URL unset to trigger DB-check error path
process.env.DATABASE_URL = '';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

(async () => {
  try {
    const db = require('../database-prisma');
    const result = await db.loginUser('ravi@encogix.com', '123456');
    console.log('Login result:', result);
  } catch (err) {
    console.error('Error when calling loginUser without DB:', err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
})();
