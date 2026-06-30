/**
 * Print wallet balance for a vendor.
 * Usage: VENDOR_ID=1 bun run scripts/check-balance.ts
 */

import { prisma } from '../src/shared/prisma/client';

async function main() {
  const vendorId = BigInt(process.env.VENDOR_ID || '1');
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true, email: true, walletBalance: true }
  });

  if (!vendor) {
    console.error(`Vendor ${vendorId} not found.`);
    process.exit(1);
  }

  console.log(`Vendor:  ${vendor.name} <${vendor.email}>`);
  console.log(`Balance: $${Number(vendor.walletBalance).toFixed(4)}`);
  process.exit(0);
}

main().catch(console.error);
