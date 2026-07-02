import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import * as XLSX from 'xlsx';
import { prisma } from '../shared/prisma/client';
import { inboundQueue, outboundQueue, embedQueue, EmbedProductJob } from '../shared/queue';
import { NombaService } from '../shared/nomba.service';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: { target: 'pino-pretty', options: { colorize: true } }
  }
});

const start = async () => {
  await fastify.register(helmet);
  await fastify.register(cors, { origin: true });
  await fastify.register(compress);
  await fastify.register(multipart);

  // ── Health ────────────────────────────────────────────────────────
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ── Ops Dashboard ─────────────────────────────────────────────────
  fastify.get('/ops/dashboard', async () => {
    const [inboundCounts, outboundCounts, activeConversations, lowBalanceVendors] = await Promise.all([
      inboundQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
      outboundQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
      prisma.wa_session.count({
        where: { updatedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } }
      }),
      prisma.vendor.findMany({
        where: { walletBalance: { lt: 2 } },
        select: { id: true, name: true, email: true, walletBalance: true }
      })
    ]);

    return {
      timestamp: new Date().toISOString(),
      queues: { inbound: inboundCounts, outbound: outboundCounts },
      activeConversations,
      lowBalanceVendors: lowBalanceVendors.map(v => ({
        id: v.id.toString(),
        name: v.name,
        email: v.email,
        balance: Number(v.walletBalance)
      }))
    };
  });

  // ── Vendor Registration ───────────────────────────────────────────
  fastify.post<{ Body: { name: string; email: string } }>('/vendors/register', async (request) => {
    const { name, email } = request.body;
    const existing = await prisma.vendor.findUnique({ where: { email } });
    if (existing) {
      return { vendorId: existing.id.toString(), message: 'Welcome back!' };
    }
    const vendor = await prisma.vendor.create({
      data: { name, email, walletBalance: 10.0 }
    });
    return { vendorId: vendor.id.toString(), message: 'Vendor registered. Free ₦10 credit applied.' };
  });

  // ── Catalog Ingestion ─────────────────────────────────────────────
  fastify.post<{ Params: { id: string } }>('/vendors/:id/catalog', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const buffer = await data.toBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const items: any[] = XLSX.utils.sheet_to_json(sheet);
    const vendorId = BigInt(request.params.id);

    const creations = items.map(item => ({
      vendorId,
      name: item.name || item.ProductName,
      price: Number(item.price || item.Price),
      description: item.description || item.Description || null,
      stock: Number(item.stock || item.Stock || 0)
    }));

    await prisma.product.createMany({ data: creations, skipDuplicates: true });

    // Enqueue embeddings for all ingested products
    const inserted = await prisma.product.findMany({
      where: { vendorId, name: { in: creations.map(c => c.name) } },
      select: { id: true, name: true, description: true }
    });

    for (const p of inserted) {
      const text = [p.name, p.description].filter(Boolean).join(' — ');
      await embedQueue.add<EmbedProductJob>(`embed:${p.id}`, {
        productId: p.id.toString(),
        text
      }, { jobId: `embed:${p.id}` });
    }

    return { count: creations.length, message: 'Catalog ingested. Embedding jobs queued.' };
  });

  // ── Wallet Top-up ─────────────────────────────────────────────────
  fastify.post<{ Body: { vendorId: string; amount: number } }>('/topup', async (request) => {
    const { vendorId, amount } = request.body;
    const vendor = await prisma.vendor.update({
      where: { id: BigInt(vendorId) },
      data: { walletBalance: { increment: amount } }
    });
    return { newBalance: Number(vendor.walletBalance) };
  });

  // ── Products List ────────────────────────────────────────────
  fastify.get<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string; sortBy?: string; sortOrder?: string };
  }>('/vendors/:id/products', async (request, reply) => {
    let vendorId: bigint;
    try { vendorId = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) return reply.status(404).send({ error: 'Vendor not found' });

    const page  = Math.max(1, parseInt(request.query.page  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50')));
    const skip  = (page - 1) * limit;

    const allowedSort = ['name', 'price', 'stock', 'createdAt', 'updatedAt'];
    const sortBy    = allowedSort.includes(request.query.sortBy || '') ? request.query.sortBy! : 'name';
    const sortOrder = request.query.sortOrder === 'desc' ? 'desc' : 'asc';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { vendorId },
        select: { id: true, name: true, description: true, price: true, stock: true, reservedStock: true, imageUrl: true, createdAt: true, updatedAt: true },
        orderBy: { [sortBy]: sortOrder },
        skip, take: limit,
      }),
      prisma.product.count({ where: { vendorId } }),
    ]);

    return {
      products: products.map(p => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        stock: p.stock,
        reservedStock: p.reservedStock,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  });

  // ── Orders List ──────────────────────────────────────────────
  fastify.get<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string; status?: string };
  }>('/vendors/:id/orders', async (request, reply) => {
    let vendorId: bigint;
    try { vendorId = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) return reply.status(404).send({ error: 'Vendor not found' });

    const page  = Math.max(1, parseInt(request.query.page  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50')));
    const skip  = (page - 1) * limit;

    const validStatuses = ['PENDING', 'PAID', 'CANCELED', 'DELIVERED'];
    const statusParam = request.query.status?.toUpperCase();
    if (statusParam && !validStatuses.includes(statusParam))
      return reply.status(400).send({ error: 'Invalid status filter' });

    const where = { vendorId, ...(statusParam ? { status: statusParam } : {}) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true, total: true, status: true, createdAt: true, updatedAt: true,
          customer: { select: { name: true, phoneNumber: true } },
          items: { select: { quantity: true, price: true, product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(o => ({
        id: o.id.toString(),
        customer: o.customer.name || o.customer.phoneNumber,
        total: o.total.toString(),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        itemCount: o.items.length,
        items: o.items.map(i => `${i.quantity}× ${i.product.name}`),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  });

  // ── WhatsApp QR Proxy ─────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/whatsapp/qr', async (request) => {
    const vendorId = BigInt(request.params.id);
    const session = await prisma.whatsAppSession.findFirst({
      where: { vendorId, sessionId: { contains: ':qr' } },
      orderBy: { updatedAt: 'desc' }
    });
    if (!session) return { status: 'waiting' };
    const sessionData = session.data as any;
    if (sessionData.connected) return { status: 'connected' };
    if (sessionData.qr) return { status: 'ready', qr: sessionData.qr };
    return { status: 'waiting' };
  });

  // ── Nomba Webhook ─────────────────────────────────────────────────
  // Parse JSON globally but stash raw string on request for HMAC verification
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body: string, done) => {
    (req as any).rawBody = body;
    try {
      done(null, JSON.parse(body));
    } catch (e: any) {
      done(e);
    }
  });

  fastify.post('/webhooks/nomba', async (request, reply) => {
    const rawBody = (request as any).rawBody as string;
    // Confirm exact header name in Nomba dashboard if verification fails
    const signature = request.headers['x-nomba-signature'] as string;

    if (!NombaService.verifyWebhookSignature(rawBody, signature)) {
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    const event = request.body as any;

    // Nomba sends payment_success event
    if (event.event === 'payment_success') {
      const orderReference = event.data?.order?.orderId ?? event.data?.transaction?.reference;
      const orderMetaData = event.data?.orderMetaData ?? {};
      const orderId = orderMetaData?.orderId ? BigInt(orderMetaData.orderId) : null;
      const reference = orderReference as string;

      if (!orderId) return reply.status(200).send({ received: true });

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } }, customer: true }
      });

      if (!order || order.status !== 'PENDING') return reply.status(200).send({ received: true });

      // Mark order paid
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID', paymentLink: reference } });

      // Release reserved stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { reservedStock: { decrement: item.quantity }, stock: { decrement: item.quantity } }
        });
      }

      // Mark reservation released so the 30-min job is a no-op
      await prisma.softReservation.updateMany({
        where: { orderId },
        data: { released: true }
      });

      // Send receipt via outbound queue
      const itemsList = order.items
        .map(i => `• ${i.quantity}× ${i.product.name} — ₦${Number(i.price) * i.quantity}`)
        .join('\n');

      await outboundQueue.add(`receipt:${orderId}`, {
        vendorId: order.vendorId.toString(),
        remoteJid: `${order.customer.phoneNumber}@s.whatsapp.net`,
        content: `Payment confirmed! Thank you.\n\nOrder #${orderId}\n${itemsList}\n\nTotal: ₦${Number(order.total).toFixed(2)}\n\nYour order is being prepared.`
      });

      console.log(`✅ Order ${orderId} marked PAID, receipt queued`);
    }

    return reply.status(200).send({ received: true });
  });

  const port = Number(process.env.PORT) || 3000;
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 Gateway running on port ${port}`);
};

start().catch(err => {
  console.error(err);
  process.exit(1);
});
