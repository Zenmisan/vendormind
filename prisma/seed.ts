import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const vendor = await prisma.vendor.upsert({
    where: { email: 'demo@vendormind.com' },
    update: {},
    create: {
      id: BigInt(1),
      name: 'Demo Vendor',
      email: 'demo@vendormind.com',
      walletBalance: 100.00,
    },
  });
  console.log({ vendor });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: BigInt(1) },
      update: {},
      create: {
        id: BigInt(1),
        vendorId: vendor.id,
        name: 'Premium Coffee Beans',
        price: 15.00,
        description: 'Dark roast, 500g',
        stock: 50,
      },
    }),
    prisma.product.upsert({
      where: { id: BigInt(2) },
      update: {},
      create: {
        id: BigInt(2),
        vendorId: vendor.id,
        name: 'Green Tea Leaves',
        price: 10.00,
        description: 'Organic, 200g',
        stock: 30,
      },
    }),
    prisma.product.upsert({
      where: { id: BigInt(3) },
      update: {},
      create: {
        id: BigInt(3),
        vendorId: vendor.id,
        name: 'Vanilla Syrup',
        price: 8.00,
        description: 'Sweetener for coffee, 250ml',
        stock: 100,
      },
    }),
  ]);
  console.log({ products });

  const documents = await Promise.all([
    prisma.document.upsert({
      where: { id: BigInt(1) },
      update: {},
      create: {
        id: BigInt(1),
        vendorId: vendor.id,
        title: 'Shipping Policy',
        content: 'We ship to all areas in Lagos and Abuja. Flat rate is $5.00. Same day delivery if ordered before 12 PM.'
      }
    }),
    prisma.document.upsert({
      where: { id: BigInt(2) },
      update: {},
      create: {
        id: BigInt(2),
        vendorId: vendor.id,
        title: 'Refund Policy',
        content: 'Refunds are available within 7 days of purchase if the bag is unopened. Store credit only for opened bags.'
      }
    })
  ]);
  console.log({ documents });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
