import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import * as XLSX from 'xlsx';
import { prisma } from '../shared/prisma/client';
import { inboundQueue, outboundQueue, embedQueue, EmbedProductJob } from '../shared/queue';
import { NombaService } from '../shared/nomba.service';
import { redisConnection } from '../shared/redis';

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

  // ── Update Order Status ───────────────────────────────────────────
  fastify.put<{ Params: { id: string, orderId: string }; Body: { status: string } }>('/vendors/:id/orders/:orderId', async (request, reply) => {
    let orderId: bigint;
    try { orderId = BigInt(request.params.orderId); }
    catch { return reply.status(400).send({ error: 'Invalid order ID' }); }
    const { status } = request.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    return { order: { id: order.id.toString(), status: order.status } };
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
  // ── Pairing Code Request ──────────────────────────────────────────
  fastify.post<{ Params: { id: string }; Body: { phone: string } }>('/vendors/:id/whatsapp/pair', async (request, reply) => {
    let vendorId: bigint;
    try { vendorId = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }

    const { phone } = request.body;
    if (!phone) return reply.status(400).send({ error: 'phone required' });

    // Clear existing session so fleet worker starts fresh and fires QR event
    await prisma.whatsAppSession.deleteMany({
      where: { vendorId, sessionId: `${request.params.id}:creds` }
    });
    await prisma.whatsAppSession.deleteMany({
      where: { vendorId, sessionId: `${request.params.id}:qr` }
    });

    // Signal fleet worker to use pairing code on next QR event
    await redisConnection.set(`pairing_phone:${request.params.id}`, phone.replace(/\D/g, ''), 'EX', 300);

    return { status: 'pending', message: 'Pairing code will be ready in ~5 seconds. Poll /whatsapp/pairing-code.' };
  });

  // ── Get Pairing Code ──────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/whatsapp/pairing-code', async (request) => {
    const vendorId = BigInt(request.params.id);
    const session = await prisma.whatsAppSession.findFirst({
      where: { vendorId, sessionId: { contains: ':qr' } },
      orderBy: { updatedAt: 'desc' }
    });
    if (!session) return { status: 'waiting' };
    const data = session.data as any;
    if (data.connected) return { status: 'connected' };
    if (data.pairingCode) return { status: 'ready', code: data.pairingCode };
    return { status: 'waiting' };
  });

  // ── Wallet Details ────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/wallet', async (request, reply) => {
    let id: bigint;
    try { id = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { walletBalance: true }
    });
    if (!vendor) return reply.status(404).send({ error: 'Vendor not found' });
    return {
      balance: Number(vendor.walletBalance),
      currency: 'NGN',
      transactions: [
        { id: 'tx_1', description: 'Welcome Free Credit', amount: 10.0, type: 'credit', createdAt: new Date().toISOString() }
      ]
    };
  });

  // ── Conversations List ────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/conversations', async (request, reply) => {
    let id: bigint;
    try { id = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }
    const sessions = await prisma.wa_session.findMany({
      where: {
        customer: { vendorId: id }
      },
      include: {
        customer: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const conversations = [];
    for (const s of sessions) {
      const ctx = s.context as any;
      const messages = ctx?.recentMessages || [];
      const lastMsg = messages[messages.length - 1];
      const snippet = lastMsg ? (typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content)) : '';
      const handoffActive = await redisConnection.get(`handoff:${s.customerId}`);

      conversations.push({
        id: s.customerId.toString(),
        customer: s.customer.name || s.customer.phoneNumber,
        phoneNumber: s.customer.phoneNumber,
        lastMessage: snippet,
        timestamp: s.updatedAt.toISOString(),
        status: handoffActive === '1' ? 'HANDED_OFF' : 'ACTIVE'
      });
    }

    return { conversations };
  });

  // ── Conversation Detail ───────────────────────────────────────────
  fastify.get<{ Params: { id: string, customerId: string } }>('/vendors/:id/conversations/:customerId', async (request, reply) => {
    let customerId: bigint;
    try { customerId = BigInt(request.params.customerId); }
    catch { return reply.status(400).send({ error: 'Invalid customer ID' }); }

    const session = await prisma.wa_session.findUnique({
      where: { customerId },
      include: { customer: true }
    });
    if (!session) return reply.status(404).send({ error: 'Conversation not found' });

    const ctx = session.context as any;
    const messages = ctx?.recentMessages || [];
    const handoffActive = await redisConnection.get(`handoff:${customerId}`);

    return {
      customerId: customerId.toString(),
      customer: session.customer.name || session.customer.phoneNumber,
      phoneNumber: session.customer.phoneNumber,
      summary: ctx?.summary || '',
      status: handoffActive === '1' ? 'HANDED_OFF' : 'ACTIVE',
      messages: messages.map((m: any, idx: number) => ({
        id: idx.toString(),
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        timestamp: session.updatedAt.toISOString()
      }))
    };
  });

  // ── Handoff Toggle ────────────────────────────────────────────────
  fastify.post<{ Params: { id: string, customerId: string }; Body: { handoff: boolean } }>('/vendors/:id/conversations/:customerId/handoff', async (request, reply) => {
    let customerId: bigint;
    try { customerId = BigInt(request.params.customerId); }
    catch { return reply.status(400).send({ error: 'Invalid customer ID' }); }
    const { handoff } = request.body;

    const handoffKey = `handoff:${customerId}`;
    if (handoff) {
      await redisConnection.set(handoffKey, '1', 'EX', 3600);
    } else {
      await redisConnection.del(handoffKey);
    }
    return { status: handoff ? 'HANDED_OFF' : 'ACTIVE' };
  });

  // ── Add Product ───────────────────────────────────────────────────
  fastify.post<{ Params: { id: string }; Body: { name: string; price: number; description?: string; stock: number } }>('/vendors/:id/products', async (request, reply) => {
    let id: bigint;
    try { id = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }
    const { name, price, description, stock } = request.body;

    const product = await prisma.product.create({
      data: {
        vendorId: id,
        name,
        price: Number(price),
        description: description || null,
        stock: Number(stock)
      }
    });

    const text = [product.name, product.description].filter(Boolean).join(' — ');
    await embedQueue.add<EmbedProductJob>(`embed:${product.id}`, {
      productId: product.id.toString(),
      text
    }, { jobId: `embed:${product.id}` });

    return {
      product: {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock,
        reservedStock: product.reservedStock
      }
    };
  });

  // ── Update Product ────────────────────────────────────────────────
  fastify.put<{ Params: { id: string, productId: string }; Body: { name?: string; price?: number; description?: string; stock?: number } }>('/vendors/:id/products/:productId', async (request, reply) => {
    let productId: bigint;
    try { productId = BigInt(request.params.productId); }
    catch { return reply.status(400).send({ error: 'Invalid product ID' }); }
    const { name, price, description, stock } = request.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description || null;
    if (stock !== undefined) updateData.stock = Number(stock);

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    if (name !== undefined || description !== undefined) {
      const text = [product.name, product.description].filter(Boolean).join(' — ');
      await embedQueue.add<EmbedProductJob>(`embed:${product.id}`, {
        productId: product.id.toString(),
        text
      }, { jobId: `embed:${product.id}`, removeOnComplete: true });
    }

    return {
      product: {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock,
        reservedStock: product.reservedStock
      }
    };
  });

  // ── Delete Product ────────────────────────────────────────────────
  fastify.delete<{ Params: { id: string, productId: string } }>('/vendors/:id/products/:productId', async (request, reply) => {
    let productId: bigint;
    try { productId = BigInt(request.params.productId); }
    catch { return reply.status(400).send({ error: 'Invalid product ID' }); }

    await prisma.product.delete({
      where: { id: productId }
    });
    return { success: true };
  });

  // ── Get Settings ──────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/settings', async (request, reply) => {
    let id: bigint;
    try { id = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { name: true, email: true, phoneNumber: true, agentName: true, agentTone: true, agentGreeting: true }
    });
    if (!vendor) return reply.status(404).send({ error: 'Vendor not found' });
    return {
      settings: {
        name: vendor.name,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        agentName: vendor.agentName || vendor.name,
        agentTone: vendor.agentTone || 'Friendly',
        agentGreeting: vendor.agentGreeting || `Hello! I am ${vendor.agentName || vendor.name}'s AI sales agent. How can I help you today?`
      }
    };
  });

  // ── Save Settings ─────────────────────────────────────────────────
  fastify.post<{ Params: { id: string }; Body: { name?: string; email?: string; agentName?: string; agentTone?: string; agentGreeting?: string } }>('/vendors/:id/settings', async (request, reply) => {
    let id: bigint;
    try { id = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }
    const { name, email, agentName, agentTone, agentGreeting } = request.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (agentName !== undefined) updateData.agentName = agentName;
    if (agentTone !== undefined) updateData.agentTone = agentTone;
    if (agentGreeting !== undefined) updateData.agentGreeting = agentGreeting;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
      select: { name: true, email: true, phoneNumber: true, agentName: true, agentTone: true, agentGreeting: true }
    });

    return {
      settings: {
        name: vendor.name,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        agentName: vendor.agentName,
        agentTone: vendor.agentTone,
        agentGreeting: vendor.agentGreeting
      }
    };
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
