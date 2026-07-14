import { prisma } from '../src/shared/prisma/client';

async function main() {
  const vendors = await prisma.vendor.findMany();
  console.log('--- vendors ---');
  for (const v of vendors) {
    console.log(`ID: ${v.id}, Name: ${v.name}, Email: ${v.email}, Phone: ${v.phoneNumber}`);
  }
}

main().catch(console.error);
