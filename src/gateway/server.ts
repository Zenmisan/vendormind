import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import * as XLSX from 'xlsx';
import { prisma } from '../shared/prisma/client';
import { inboundQueue, outboundQueue, embedQueue, type EmbedProductJob } from '../shared/queue';
import { MonnifyService } from '../shared/monnify.service';
import { redisConnection } from '../shared/redis';
import { ContextService } from '../shared/context.service';

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
  fastify.get('/', async () => ({ name: 'VendorMind API Gateway', status: 'ok', timestamp: new Date().toISOString() }));
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
    const firstSheetName = workbook.SheetNames[0] || '';
    const sheet = workbook.Sheets[firstSheetName];
    const items: any[] = sheet ? XLSX.utils.sheet_to_json(sheet) : [];
    const vendorId = BigInt(request.params.id);

    if (items.length === 0) return reply.status(400).send({ error: 'Spreadsheet is empty' });

    // Fuzzy column resolver — case-insensitive partial match
    const keys = Object.keys(items[0]);
    const find = (patterns: string[]) =>
      keys.find(k => patterns.some(p => k.toLowerCase().includes(p))) ?? null;

    const nameCol  = find(['name', 'product', 'item', 'title', 'cake', 'food', 'menu', 'service']);
    const priceCol = find(['price', 'cost', 'amount', 'fee', 'rate', 'naira', 'charge']);
    const descCol  = find(['desc', 'detail', 'note', 'about', 'whatnot', 'flavor', 'flavour', 'info', 'ingred', 'spec']);
    const stockCol = find(['stock', 'qty', 'quantity', 'inventory', 'count', 'avail', 'units']);

    // Columns not mapped to name/price/stock get concatenated into description
    const usedCols = new Set([nameCol, priceCol, stockCol].filter(Boolean));
    const extraDescCols = keys.filter(k => !usedCols.has(k) && k !== '#' && k !== 'id');

    const creations = items
      .map(item => {
        const name = nameCol ? String(item[nameCol] ?? '').trim() : '';
        if (!name) return null;

        const explicitDesc = descCol ? String(item[descCol] ?? '').trim() : '';
        const extraDesc = extraDescCols
          .map(k => item[k] ? String(item[k]).trim() : '')
          .filter(Boolean)
          .join(' · ');
        const description = [explicitDesc, !descCol && extraDesc ? extraDesc : '']
          .filter(Boolean).join(' — ') || extraDesc || null;

        return {
          vendorId,
          name,
          price: priceCol ? Number(item[priceCol]) || 0 : 0,
          description: description || null,
          stock: stockCol ? Number(item[stockCol]) || 0 : 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (creations.length === 0)
      return reply.status(400).send({ error: `No valid rows found. Detected columns: ${keys.join(', ')}. Need at least a name/product column.` });

    await prisma.product.createMany({ data: creations, skipDuplicates: true });

    // Enqueue embeddings for all ingested products
    const inserted = await prisma.product.findMany({
      where: { vendorId, name: { in: creations.map(c => c.name) } },
      select: { id: true, name: true, description: true }
    });

    for (const p of inserted) {
      const text = [p.name, p.description].filter(Boolean).join(' — ');
      await embedQueue.add(`embed:${p.id}`, {
        productId: p.id.toString(),
        text
      }, { jobId: `embed:${p.id}` });
    }

    return { count: creations.length, message: 'Catalog ingested. Embedding jobs queued.' };
  });

  // ── Wallet Top-up ─────────────────────────────────────────────────
  // Legacy direct topup (dev/mock only — no Nomba credentials)
  fastify.post<{ Body: { vendorId: string; amount: number } }>('/topup', async (request) => {
    const { vendorId, amount } = request.body;
    const vendor = await prisma.vendor.update({
      where: { id: BigInt(vendorId) },
      data: { walletBalance: { increment: amount } }
    });
    return { newBalance: Number(vendor.walletBalance) };
  });

  // ── Wallet Top-up via Monnify Checkout ─────────────────────────────
  fastify.post<{ Params: { id: string }; Body: { amount: number } }>('/vendors/:id/wallet/topup', async (request, reply) => {
    let vendorId: bigint;
    try { vendorId = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }

    const { amount } = request.body;
    if (!amount || amount <= 0) return reply.status(400).send({ error: 'Invalid amount' });

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { name: true, email: true } });
    if (!vendor) return reply.status(404).send({ error: 'Vendor not found' });

    const monnifyConfigured = !!(process.env.MONNIFY_API_KEY && process.env.MONNIFY_SECRET_KEY && process.env.MONNIFY_CONTRACT_CODE);

    if (!monnifyConfigured) {
      // Dev fallback: direct credit
      const updated = await prisma.vendor.update({
        where: { id: vendorId },
        data: { walletBalance: { increment: amount } }
      });
      return { mode: 'mock', newBalance: Number(updated.walletBalance) };
    }

    const paymentReference = `TOPUP-${request.params.id}-${Date.now()}`;
    const redirectUrl = `${process.env.APP_URL || 'https://vendormind-z.web.app'}/wallet`;

    const checkoutUrl = await MonnifyService.createCheckoutUrl({
      amount,
      paymentReference,
      redirectUrl,
      customerName: vendor.name || 'VendorMind Merchant',
      customerEmail: vendor.email,
      paymentDescription: `VendorMind Wallet Top-up ₦${amount}`
    });

    return { checkoutUrl, paymentReference };
  });

  // ── Catalog Embedding Progress ────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/catalog/progress', async (request, reply) => {
    let vendorId: bigint;
    try { vendorId = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) return reply.status(404).send({ error: 'Vendor not found' });

    const total = await prisma.product.count({ where: { vendorId } });
    const embeddedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM products
      WHERE "vendorId" = ${vendorId}
        AND embedding IS NOT NULL
    `;
    const embedded = Number(embeddedResult[0]?.count || 0);
    const progress = total > 0 ? Number(((embedded / total) * 100).toFixed(1)) : 100.0;
    const allowed = progress >= 80.0;

    return { total, embedded, progress, allowed };
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

    const [products, total, embeddedIdsResult] = await Promise.all([
      prisma.product.findMany({
        where: { vendorId },
        select: { id: true, name: true, description: true, price: true, stock: true, reservedStock: true, imageUrl: true, createdAt: true, updatedAt: true },
        orderBy: { [sortBy]: sortOrder },
        skip, take: limit,
      }),
      prisma.product.count({ where: { vendorId } }),
      prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM products WHERE "vendorId" = ${vendorId} AND embedding IS NOT NULL
      `
    ]);

    const embeddedIds = new Set(embeddedIdsResult.map(r => r.id.toString()));

    return {
      products: products.map(p => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        stock: p.stock,
        reservedStock: p.reservedStock,
        imageUrl: p.imageUrl,
        isEmbedded: embeddedIds.has(p.id.toString()),
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

    // Check if auth credentials session exists (connected state)
    const credsSession = await prisma.whatsAppSession.findFirst({
      where: { vendorId, sessionId: `${request.params.id}:creds` }
    });
    if (credsSession) {
      const credsData = credsSession.data as any;
      if (credsData?.me?.id || credsData?.registered) {
        return { status: 'connected' };
      }
    }

    const session = await prisma.whatsAppSession.findFirst({
      where: { vendorId, sessionId: `${request.params.id}:qr` },
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

    // Clear all existing sessions for this vendor so Baileys starts 100% unregistered
    await prisma.whatsAppSession.deleteMany({ where: { vendorId } });

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0') && formattedPhone.length === 11) {
      formattedPhone = '234' + formattedPhone.slice(1);
    }

    // Signal fleet worker to use pairing code on next QR event
    await redisConnection.set(`pairing_phone:${request.params.id}`, formattedPhone, 'EX', 300);

    // Notify fleet worker to restart socket for fresh pairing event
    await redisConnection.publish('fleet_control', JSON.stringify({
      action: 'restart_socket',
      vendorId: request.params.id
    }));

    return { status: 'pending', message: 'Pairing code will be ready in ~5 seconds. Poll /whatsapp/pairing-code.' };
  });

  // ── Reset Session / Force Fresh QR ─────────────────────────────
  fastify.post<{ Params: { id: string } }>('/vendors/:id/whatsapp/reset', async (request, reply) => {
    let vendorId: bigint;
    try { vendorId = BigInt(request.params.id); }
    catch { return reply.status(400).send({ error: 'Invalid vendor ID' }); }

    await prisma.whatsAppSession.deleteMany({
      where: { vendorId, sessionId: { contains: request.params.id } }
    });

    await redisConnection.publish('fleet_control', JSON.stringify({
      action: 'restart_socket',
      vendorId: request.params.id
    }));

    return { status: 'reset', message: 'Session reset. Fleet worker re-initializing socket.' };
  });

  // ── Get Pairing Code ──────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/vendors/:id/whatsapp/pairing-code', async (request) => {
    const vendorId = BigInt(request.params.id);

    // Check if auth credentials session exists (connected state)
    const credsSession = await prisma.whatsAppSession.findFirst({
      where: { vendorId, sessionId: `${request.params.id}:creds` }
    });
    if (credsSession) {
      const credsData = credsSession.data as any;
      if (credsData?.me?.id || credsData?.registered) {
        return { status: 'connected' };
      }
    }

    const session = await prisma.whatsAppSession.findFirst({
      where: { vendorId, sessionId: `${request.params.id}:qr` },
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

  // ── Send Manual Message ───────────────────────────────────────────
  fastify.post<{ Params: { id: string, customerId: string }; Body: { content: string } }>('/vendors/:id/conversations/:customerId/messages', async (request, reply) => {
    let customerId: bigint;
    let vendorId: bigint;
    try {
      customerId = BigInt(request.params.customerId);
      vendorId = BigInt(request.params.id);
    } catch {
      return reply.status(400).send({ error: 'Invalid customer or vendor ID' });
    }
    const { content } = request.body;
    if (!content?.trim()) {
      return reply.status(400).send({ error: 'Message content is required' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }

    await outboundQueue.add(`reply:manual:${Date.now()}`, {
      vendorId: vendorId.toString(),
      remoteJid: `${customer.phoneNumber}@s.whatsapp.net`,
      content: content.trim()
    });

    await ContextService.updateContext(customerId, {
      role: 'assistant',
      content: content.trim()
    });

    return { success: true };
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
    await embedQueue.add(`embed:${product.id}`, {
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
      await embedQueue.add(`embed:${product.id}`, {
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

  // ── Monnify Webhook ────────────────────────────────────────────────
  // Parse JSON globally but stash raw string on request for HMAC verification
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body: string, done) => {
    (req as any).rawBody = body;
    try {
      done(null, JSON.parse(body));
    } catch (e: any) {
      done(e);
    }
  });

  fastify.post('/webhooks/monnify', async (request, reply) => {
    const rawBody = (request as any).rawBody as string;
    const signature = (request.headers['monnify-signature'] || request.headers['x-monnify-signature']) as string;

    if (!MonnifyService.verifyWebhookSignature(rawBody, signature)) {
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    const payload = request.body as any;
    const eventType = payload?.eventType;
    const eventData = payload?.eventData || {};

    if (eventType === 'SUCCESSFUL_TRANSACTION' && (eventData.paymentStatus === 'PAID' || eventData.paymentStatus === 'SUCCESSFUL')) {
      const paymentReference = eventData.paymentReference as string;
      const amountPaid = Number(eventData.amountPaid || eventData.totalPayable || 0);

      // Wallet top-up payment
      if (paymentReference && paymentReference.startsWith('TOPUP-')) {
        const parts = paymentReference.split('-');
        const vendorIdStr = parts[1];
        if (vendorIdStr) {
          const vendorId = BigInt(vendorIdStr);
          await prisma.vendor.update({
            where: { id: vendorId },
            data: { walletBalance: { increment: amountPaid } }
          });
          console.log(`💳 Wallet top-up via Monnify: vendor ${vendorIdStr} +₦${amountPaid}`);
          return reply.status(200).send({ received: true });
        }
      }

      // Order payment
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { paymentLink: paymentReference },
            { paymentLink: eventData.transactionReference }
          ]
        },
        include: { items: { include: { product: true } }, customer: true }
      });

      if (!order || order.status !== 'PENDING') return reply.status(200).send({ received: true });
      const orderId = order.id;

      // Mark order paid
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } });

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

      console.log(`✅ Order ${orderId} marked PAID via Monnify, receipt queued`);
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
