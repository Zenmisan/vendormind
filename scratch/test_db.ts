import { prisma } from '../src/shared/prisma/client';

async function testConnection() {
  console.log('🔌 Testing Prisma PostgreSQL connection on port 6543...');
  const start = Date.now();
  const count = await prisma.vendor.count();
  const duration = Date.now() - start;
  console.log(`✅ Database connection successful! Query returned ${count} vendor(s) in ${duration}ms.`);
  process.exit(0);
}

testConnection().catch(err => {
  console.error('❌ Database connection test failed:', err);
  process.exit(1);
});
