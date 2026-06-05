import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import { pino } from 'pino';
import * as dotenv from 'dotenv';
import { prisma } from '../shared/prisma/client';
import * as XLSX from 'xlsx';

dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

const start = async () => {
  try {
    await fastify.register(helmet);
    await fastify.register(cors, { origin: true });
    await fastify.register(compress);
    await fastify.register(multipart);

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // 1. Vendor Registration
    fastify.post<{
      Body: { name: string; email: string };
    }>('/vendors/register', async (request, reply) => {
      const { name, email } = request.body;
      const vendor = await prisma.vendor.create({
        data: { name, email, walletBalance: 10.0000 } // Free credit for new vendors
      });
      return { vendorId: vendor.id.toString(), message: 'Vendor registered successfully' };
    });

    // 2. Catalog Ingestion
    fastify.post<{
      Params: { id: string };
    }>('/vendors/:id/catalog', async (request, reply) => {
      const data = await request.file();
      if (!data) return reply.status(400).send({ error: 'No file uploaded' });

      const buffer = await data.toBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const items: any[] = XLSX.utils.sheet_to_json(sheet);

      const vendorId = BigInt(request.params.id);

      // Simple bulk create/upsert
      const creations = items.map(item => ({
        vendorId,
        name: item.name || item.ProductName,
        price: Number(item.price || item.Price),
        description: item.description || item.Description,
        stock: Number(item.stock || item.Stock || 0)
      }));

      await prisma.product.createMany({
        data: creations,
        skipDuplicates: true
      });

      return { count: creations.length, message: 'Catalog ingested successfully' };
    });

    // 3. Wallet Top-up
    fastify.post<{
      Body: { vendorId: string; amount: number };
    }>('/topup', async (request, reply) => {
      const { vendorId, amount } = request.body;
      const vId = BigInt(vendorId);
      const vendor = await prisma.vendor.update({
        where: { id: vId },
        data: { walletBalance: { increment: amount } }
      });
      return { newBalance: Number(vendor.walletBalance) };
    });

    // 4. WhatsApp QR Proxy
    fastify.get<{
      Params: { id: string };
    }>('/vendors/:id/whatsapp/qr', async (request, reply) => {
      const vendorId = BigInt(request.params.id);
      // For demo, we just look for the 'default:qr' or similar key in DB
      const session = await prisma.whatsAppSession.findFirst({
        where: { vendorId, sessionId: { contains: ':qr' } },
        orderBy: { updatedAt: 'desc' }
      });

      if (!session) return { status: 'waiting', message: 'QR not generated yet' };
      return { status: 'ready', qr: (session.data as any).qr };
    });

    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Gateway running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
