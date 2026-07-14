import { prisma } from '../src/shared/prisma/client';

async function main() {
  const products = await prisma.product.findMany({ where: { vendorId: 1 } });
  console.log(`Vendor 1 has ${products.length} products`);
  for (const p of products) {
    console.log(`ID: ${p.id}, Name: ${p.name}, Has Embedding: ${p.embedding ? 'Yes' : 'No'}`);
  }
}

main().then(() => process.exit(0)).catch(console.error);
