import { prisma } from '../src/shared/prisma/client';

async function checkProducts() {
  console.log('📦 Checking all products in database...\n');

  const products = await prisma.product.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  console.log(`Found ${products.length} product(s) in DB:`);
  for (const p of products) {
    console.log(`   - Product ID: ${p.id} | Vendor ID: ${p.vendorId} | Name: "${p.name}" | Price: ₦${p.price} | Stock: ${p.stock}`);
  }

  process.exit(0);
}

checkProducts().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
