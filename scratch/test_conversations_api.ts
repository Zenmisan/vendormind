import { prisma } from '../src/shared/prisma/client';

async function testConversations() {
  console.log('🔍 Inspecting Customers and wa_session rows in DB...\n');

  const customers = await prisma.customer.findMany({
    include: { sessions: true, orders: true },
    orderBy: { updatedAt: 'desc' }
  });

  console.log(`📌 Found ${customers.length} customer(s) in DB:`);
  for (const c of customers) {
    console.log(`   - Customer ID: ${c.id} | Vendor ID: ${c.vendorId} | Name: "${c.name}" | Phone: "${c.phoneNumber}"`);
    console.log(`   - wa_session: ${c.sessions ? 'YES' : 'NONE'}`);
    if (c.sessions) {
      console.log(`     Context data: ${JSON.stringify(c.sessions.context)}`);
    }
  }

  const sessions = await prisma.wa_session.findMany({
    include: { customer: true }
  });
  console.log(`\n📌 Found ${sessions.length} wa_session row(s) in DB.`);

  process.exit(0);
}

testConversations().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
