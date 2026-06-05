import { prisma } from './src/shared/prisma/client';

async function check() {
  const vendor = await prisma.vendor.findUnique({
    where: { id: BigInt(1) },
    select: { name: true, walletBalance: true }
  });
  console.log('💰 Current Balance:', vendor);
  process.exit(0);
}

check();
