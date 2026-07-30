import { prisma } from './prisma/client';
import { AIService } from './ai.service';

export interface AdvisorMetricsSnapshot {
  date: string;
  revenueToday: number;
  revenueYesterday: number;
  revenueChangePercent: number;
  ordersToday: number;
  ordersPending: number;
  lowStockItems: Array<{ id: string; name: string; stock: number }>;
  topProducts: Array<{ name: string; qtySold: number; revenue: number }>;
  totalCustomers: number;
  newCustomersToday: number;
}

export class AdvisorService {
  static async getVendorMetricsSnapshot(vendorId: bigint): Promise<AdvisorMetricsSnapshot> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

    const [todayOrders, yesterdayOrders, pendingOrders, lowStockProducts, allOrders, customersCount, newCustomersCount] = await Promise.all([
      prisma.order.findMany({
        where: { vendorId, createdAt: { gte: startOfToday } },
        include: { items: { include: { product: true } } }
      }),
      prisma.order.findMany({
        where: { vendorId, createdAt: { gte: startOfYesterday, lt: startOfToday } }
      }),
      prisma.order.count({
        where: { vendorId, status: 'PENDING' }
      }),
      prisma.product.findMany({
        where: { vendorId, stock: { lte: 5 } },
        select: { id: true, name: true, stock: true },
        take: 5
      }),
      prisma.order.findMany({
        where: { vendorId, createdAt: { gte: startOfToday } },
        include: { items: { include: { product: true } } }
      }),
      prisma.customer.count({ where: { vendorId } }),
      prisma.customer.count({ where: { vendorId, createdAt: { gte: startOfToday } } })
    ]);

    const revenueToday = todayOrders
      .filter(o => o.status === 'PAID' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const revenueYesterday = yesterdayOrders
      .filter(o => o.status === 'PAID' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const revenueChangePercent = revenueYesterday === 0
      ? (revenueToday > 0 ? 100 : 0)
      : Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100);

    // Map top products
    const productSalesMap = new Map<string, { qtySold: number; revenue: number }>();
    for (const order of todayOrders) {
      for (const item of order.items) {
        const pName = item.product?.name || 'Unknown Item';
        const existing = productSalesMap.get(pName) || { qtySold: 0, revenue: 0 };
        productSalesMap.set(pName, {
          qtySold: existing.qtySold + item.quantity,
          revenue: existing.revenue + (Number(item.price) * item.quantity)
        });
      }
    }

    const topProducts = Array.from(productSalesMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return {
      date: startOfToday.toISOString().split('T')[0] || new Date().toISOString(),
      revenueToday,
      revenueYesterday,
      revenueChangePercent,
      ordersToday: todayOrders.length,
      ordersPending: pendingOrders,
      lowStockItems: lowStockProducts.map(p => ({ id: p.id.toString(), name: p.name, stock: p.stock })),
      topProducts,
      totalCustomers: customersCount,
      newCustomersToday: newCustomersCount
    };
  }

  static async generateDailyBriefing(vendorId: bigint): Promise<string> {
    const snapshot = await this.getVendorMetricsSnapshot(vendorId);
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { name: true, agentName: true }
    });

    const systemPrompt = `You are the AI Business Advisor for ${vendor?.name || 'VendorMind Merchant'}.
Your task is to analyze the 24-hour merchant metrics snapshot and write a concise, encouraging, highly actionable morning business briefing.

Structure your response with:
1. Warm Greeting & 1-sentence Executive Summary
2. Key Insights (3 bullet points covering revenue, inventory alert if any, and customer activity)
3. One Strategic Recommendation for today.

Keep the total length under 180 words. Be sharp, direct, warm, and tailored to African SME commerce.`;

    const userContent = `Here is today's 24-hour performance snapshot:
- Date: ${snapshot.date}
- Revenue Today: ₦${snapshot.revenueToday.toLocaleString()} (Yesterday: ₦${snapshot.revenueYesterday.toLocaleString()}, Change: ${snapshot.revenueChangePercent}%)
- Total Orders Today: ${snapshot.ordersToday} (Pending Fulfilment: ${snapshot.ordersPending})
- Low Stock Alerts: ${snapshot.lowStockItems.length === 0 ? 'None' : snapshot.lowStockItems.map(i => `${i.name} (${i.stock} left)`).join(', ')}
- Top Selling Items: ${snapshot.topProducts.length === 0 ? 'None yet today' : snapshot.topProducts.map(p => `${p.name} (${p.qtySold} sold, ₦${p.revenue.toLocaleString()})`).join(', ')}
- Customer Activity: ${snapshot.newCustomersToday} new customers acquired today, total ${snapshot.totalCustomers} customers in database.`;

    const aiRes = await AIService.generateResponse(
      systemPrompt,
      [{ role: 'user', content: userContent }],
      []
    );

    const briefingText = aiRes.content;
    const dateObj = new Date(snapshot.date);

    await prisma.advisorBriefing.upsert({
      where: {
        vendorId_date: {
          vendorId,
          date: dateObj
        }
      },
      create: {
        vendorId,
        date: dateObj,
        briefingText,
        dataSnapshot: snapshot as any
      },
      update: {
        briefingText,
        dataSnapshot: snapshot as any,
        generatedAt: new Date()
      }
    });

    return briefingText;
  }

  static async getTodayBriefing(vendorId: bigint) {
    const today = new Date();
    const dateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let existing = await prisma.advisorBriefing.findUnique({
      where: { vendorId_date: { vendorId, date: dateObj } }
    });

    if (!existing) {
      await this.generateDailyBriefing(vendorId);
      existing = await prisma.advisorBriefing.findUnique({
        where: { vendorId_date: { vendorId, date: dateObj } }
      });
    }

    const snapshot = await this.getVendorMetricsSnapshot(vendorId);

    return {
      briefingText: existing?.briefingText || "Welcome! Your AI Advisor will compile your 24h business report here.",
      generatedAt: existing?.generatedAt || new Date(),
      snapshot
    };
  }

  static async askAdvisor(vendorId: bigint, userQuestion: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const snapshot = await this.getVendorMetricsSnapshot(vendorId);
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { name: true } });

    const systemPrompt = `You are the AI Business Advisor for ${vendor?.name || 'VendorMind Merchant'}.
You have real-time access to the vendor's live store metrics, sales history, inventory levels, and customer counts.
Answer the vendor's questions directly, giving actionable business advice, revenue calculations, or inventory recommendations.

Live Vendor Data Context:
- Revenue Today: ₦${snapshot.revenueToday.toLocaleString()} (Yesterday: ₦${snapshot.revenueYesterday.toLocaleString()})
- Orders Today: ${snapshot.ordersToday} (Pending: ${snapshot.ordersPending})
- Low Stock Items: ${JSON.stringify(snapshot.lowStockItems)}
- Top Selling Items: ${JSON.stringify(snapshot.topProducts)}
- Total Customers: ${snapshot.totalCustomers} (${snapshot.newCustomersToday} new today)

Be direct, warm, concise, and business-focused.`;

    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userQuestion }
    ];

    const aiRes = await AIService.generateResponse(systemPrompt, messages, []);
    return aiRes.content;
  }
}
