import Anthropic from '@anthropic-ai/sdk';
import { AIService } from './ai.service';
import { prisma } from './prisma/client';

type InsightPeriod = '7d' | '30d';

interface InsightMetric {
  label: string;
  value: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
}

interface InsightCard {
  title: string;
  description: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
}

interface InsightProduct {
  id: string;
  name: string;
  revenue: string;
  unitsSold: number;
  available: number;
  stock: number;
  reservedStock: number;
}

interface InsightCustomer {
  id: string;
  name: string;
  phoneNumber: string;
  pendingAmount: string;
  lastOrderAt: string;
  ordersCount: number;
}

interface TimelinePoint {
  day: string;
  revenue: string;
  orders: number;
}

interface InsightReport {
  period: InsightPeriod;
  generatedAt: string;
  summary: string;
  metrics: InsightMetric[];
  insights: InsightCard[];
  recommendations: string[];
  suggestedQuestions: string[];
  topProducts: InsightProduct[];
  customers: InsightCustomer[];
  timeline: TimelinePoint[];
}

interface InsightResponse extends InsightReport {
  question?: string;
  answer?: string;
}

interface OrderSnapshot {
  id: bigint;
  total: any;
  status: string;
  createdAt: Date;
  customerId: bigint;
  customer: {
    id: bigint;
    name: string | null;
    phoneNumber: string;
  };
  items: Array<{
    quantity: number;
    price: any;
    product: {
      id: bigint;
      name: string;
      stock: number;
      reservedStock: number;
    };
  }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const REVENUE_STATUSES = new Set(['PAID', 'DELIVERED']);
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatMoney = (amount: number) => `₦${Math.round(amount).toLocaleString('en-NG')}`;

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });

const periodLabel = (period: InsightPeriod) => (period === '30d' ? 'last 30 days' : 'last 7 days');

const isRevenueOrder = (order: OrderSnapshot) => REVENUE_STATUSES.has(order.status);

const toNumber = (value: unknown) => Number(value ?? 0);

function splitPeriods(orders: OrderSnapshot[], currentStart: Date, previousStart: Date) {
  const current: OrderSnapshot[] = [];
  const previous: OrderSnapshot[] = [];

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    if (createdAt >= currentStart) {
      current.push(order);
    } else if (createdAt >= previousStart) {
      previous.push(order);
    }
  }

  return { current, previous };
}

function sumRevenue(orders: OrderSnapshot[]) {
  return orders.filter(isRevenueOrder).reduce((sum, order) => sum + toNumber(order.total), 0);
}

function formatChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 'New revenue momentum' : 'No prior baseline';
  const delta = ((current - previous) / previous) * 100;
  const direction = delta >= 0 ? 'up' : 'down';
  return `${Math.abs(delta).toFixed(0)}% ${direction} vs previous period`;
}

function buildTopProducts(orders: OrderSnapshot[]): InsightProduct[] {
  const map = new Map<string, InsightProduct>();

  for (const order of orders.filter(isRevenueOrder)) {
    for (const item of order.items) {
      const revenue = toNumber(item.price) * item.quantity;
      const existing = map.get(item.product.id.toString());
      if (existing) {
        existing.revenue = formatMoney(Number(existing.revenue.replace(/[^0-9.-]/g, '')) + revenue);
        existing.unitsSold += item.quantity;
      } else {
        map.set(item.product.id.toString(), {
          id: item.product.id.toString(),
          name: item.product.name,
          revenue: formatMoney(revenue),
          unitsSold: item.quantity,
          available: item.product.stock - item.product.reservedStock,
          stock: item.product.stock,
          reservedStock: item.product.reservedStock,
        });
      }
    }
  }

  return [...map.values()]
    .sort((a, b) => Number(b.revenue.replace(/[^0-9.-]/g, '')) - Number(a.revenue.replace(/[^0-9.-]/g, '')))
    .slice(0, 5);
}

function buildTimeline(orders: OrderSnapshot[], windowDays: number): TimelinePoint[] {
  const start = new Date(Date.now() - windowDays * DAY_MS);
  const points = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders.filter(isRevenueOrder)) {
    const createdAt = new Date(order.createdAt);
    if (createdAt < start) continue;
    const day = WEEKDAY_NAMES[createdAt.getDay()] ?? 'Unknown';
    const entry = points.get(day) ?? { revenue: 0, orders: 0 };
    entry.revenue += toNumber(order.total);
    entry.orders += 1;
    points.set(day, entry);
  }

  return WEEKDAY_NAMES
    .filter(day => points.has(day))
    .map(day => ({
      day,
      revenue: formatMoney(points.get(day)!.revenue),
      orders: points.get(day)!.orders,
    }));
}

function buildPendingCustomers(orders: OrderSnapshot[]): InsightCustomer[] {
  const map = new Map<string, InsightCustomer & { numericPending: number; lastOrder: Date }>();

  for (const order of orders.filter(order => order.status === 'PENDING')) {
    const key = order.customerId.toString();
    const current = map.get(key);
    const orderDate = new Date(order.createdAt);
    if (current) {
      current.numericPending += toNumber(order.total);
      current.ordersCount += 1;
      if (orderDate > current.lastOrder) current.lastOrder = orderDate;
      continue;
    }

    map.set(key, {
      id: key,
      name: order.customer.name || order.customer.phoneNumber,
      phoneNumber: order.customer.phoneNumber,
      pendingAmount: formatMoney(toNumber(order.total)),
      lastOrderAt: formatDate(orderDate),
      ordersCount: 1,
      numericPending: toNumber(order.total),
      lastOrder: orderDate,
    });
  }

  return [...map.values()]
    .sort((a, b) => b.numericPending - a.numericPending)
    .slice(0, 5)
    .map(({ numericPending, lastOrder, ...rest }) => rest);
}

function buildInsights(report: InsightReport, totalRevenue: number, previousRevenue: number, pendingTotal: number, abandonedTotal: number, lowStockProducts: string[], bestDay: TimelinePoint | null, topProduct: InsightProduct | undefined): InsightCard[] {
  return [
    {
      title: 'Revenue momentum',
      description: `${formatMoney(totalRevenue)} generated in ${periodLabel(report.period)}. ${formatChange(totalRevenue, previousRevenue)}.`,
      tone: totalRevenue >= previousRevenue ? 'positive' : 'warning',
    },
    {
      title: 'Highest performer',
      description: topProduct ? `${topProduct.name} led sales with ${topProduct.revenue} across ${topProduct.unitsSold} units.` : 'No paid product sales were recorded in this period.',
      tone: topProduct ? 'positive' : 'neutral',
    },
    {
      title: 'Payment backlog',
      description: `${formatMoney(pendingTotal)} is still awaiting payment. ${abandonedTotal > 0 ? `${formatMoney(abandonedTotal)} has already abandoned checkout.` : 'No abandoned checkout value yet.'}`,
      tone: pendingTotal > 0 ? 'warning' : 'positive',
    },
    {
      title: 'Inventory intelligence',
      description: lowStockProducts.length > 0 ? `${lowStockProducts.join(', ')} need restock attention.` : 'Inventory looks healthy across the catalog.',
      tone: lowStockProducts.length > 0 ? 'warning' : 'positive',
    },
    {
      title: 'Best selling day',
      description: bestDay ? `${bestDay.day} is currently your strongest sales day with ${bestDay.revenue}.` : 'Not enough sales data to determine a winning day yet.',
      tone: bestDay ? 'positive' : 'neutral',
    },
  ];
}

function buildRecommendations(topProduct: InsightProduct | undefined, lowStockProducts: string[], bestDay: TimelinePoint | null, pendingCustomers: InsightCustomer[]) {
  const recommendations = [
    topProduct ? `Promote ${topProduct.name} in WhatsApp broadcast messages while demand is already proven.` : 'Promote the products customers ask about most once you have more sales data.',
    bestDay ? `Schedule your next promo push for ${bestDay.day}, since that is currently your strongest revenue day.` : 'Run a small promo test when you have more sales data to identify your strongest day.',
    pendingCustomers.length > 0 ? `Follow up with ${pendingCustomers[0]!.name} and other unpaid customers to recover stalled checkouts.` : 'No obvious unpaid customers to follow up yet.',
  ];

  if (lowStockProducts.length > 0) {
    recommendations.unshift(`Restock ${lowStockProducts[0]} first so you do not lose momentum on a proven seller.`);
  }

  return recommendations.slice(0, 4);
}

function buildSuggestedQuestions() {
  return [
    'How is my business doing?',
    'What products are performing best?',
    'Which customers have not paid yet?',
    'What should I restock next?',
    'What should I do to increase sales?',
  ];
}

function buildFallbackSummary(report: InsightReport, topProduct: InsightProduct | undefined, bestDay: TimelinePoint | null, lowStockProducts: string[]) {
  const parts = [
    `Revenue for the ${periodLabel(report.period)} is ${report.metrics[0]?.value ?? 'unavailable'}.`,
    topProduct ? `${topProduct.name} is the current best performer.` : 'No top product signal yet.',
    bestDay ? `${bestDay.day} is your strongest sales day.` : 'A winning sales day is not clear yet.',
  ];

  if (lowStockProducts.length > 0) {
    parts.push(`${lowStockProducts[0]} is close to running low.`);
  }

  return parts.join(' ');
}

function buildFallbackAnswer(question: string, report: InsightReport) {
  const text = question.toLowerCase();
  const pendingMetric = report.metrics.find(metric => metric.label === 'Awaiting payment');
  const abandonedMetric = report.metrics.find(metric => metric.label === 'Abandoned checkout');
  const topProduct = report.topProducts[0];
  const lowStock = report.insights.find(item => item.title === 'Inventory intelligence');

  if (text.includes('best product') || text.includes('performing best')) {
    return topProduct
      ? `${topProduct.name} is your strongest product right now with ${topProduct.revenue} in revenue and ${topProduct.unitsSold} units sold.`
      : 'There is not enough paid sales data yet to identify a clear top product.';
  }

  if (text.includes('not paid') || text.includes('haven') || text.includes('unpaid')) {
    return `${pendingMetric?.value ?? 'No'} is still awaiting payment. ${abandonedMetric?.value ?? 'No'} has already abandoned checkout. Follow up with the customers in the insights panel before the opportunity cools.`;
  }

  if (text.includes('restock') || text.includes('inventory')) {
    return lowStock?.description ?? 'Inventory looks healthy for now. Keep an eye on products that are near zero available stock.';
  }

  if (text.includes('revenue') || text.includes('doing') || text.includes('sales')) {
    return `${report.metrics[0]?.detail ?? 'Sales momentum is still being established.'} Focus on the strongest product, the best sales day, and follow up on unpaid orders.`;
  }

  if (text.includes('increase sales') || text.includes('grow')) {
    return report.recommendations.join(' ');
  }

  return `Based on the current period, ${report.metrics[0]?.detail ?? 'your business is still collecting data.'} ${report.recommendations[0] ?? ''}`.trim();
}

async function generateNarrative(report: InsightReport, question?: string) {
  const systemPrompt = `You are the AI Business Analyst for VendorMind.
Your job is to turn merchant data into practical advice.
Rules:
- Be concise, direct, and actionable.
- Do not mention internal code or database terms.
- Use Nigerian naira formatting.
- Explain what happened, why it likely happened, and what the merchant should do next.
- If a merchant question is present, answer it clearly and specifically.
- Avoid charts and avoid generic analytics language.`;

  const context = {
    period: report.period,
    metrics: report.metrics,
    insights: report.insights,
    recommendations: report.recommendations,
    topProducts: report.topProducts.slice(0, 3),
    customers: report.customers.slice(0, 3),
    timeline: report.timeline.slice(0, 7),
  };

  const prompt = question
    ? `Merchant question: ${question}\n\nBusiness context:\n${JSON.stringify(context, null, 2)}`
    : `Create an executive summary for the merchant from this context:\n${JSON.stringify(context, null, 2)}\n\nStructure the response as: what happened, why it happened, what to do next.`;

  try {
    const response = await AIService.generateResponse(systemPrompt, [{ role: 'user', content: prompt }], []);
    const text = response.content.trim();
    return text || null;
  } catch {
    return null;
  }
}

export class BusinessInsightsService {
  static async build(vendorId: bigint, period: InsightPeriod): Promise<InsightResponse> {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true, name: true } });
    if (!vendor) throw new Error('Vendor not found');

    const now = new Date();
    const currentDays = period === '30d' ? 30 : 7;
    const currentStart = new Date(now.getTime() - currentDays * DAY_MS);
    const previousStart = new Date(currentStart.getTime() - currentDays * DAY_MS);
    const analyticsStart = new Date(now.getTime() - 60 * DAY_MS);

    const [orders, products, pendingOrders] = await Promise.all([
      prisma.order.findMany({
        where: { vendorId, createdAt: { gte: analyticsStart } },
        include: {
          customer: { select: { id: true, name: true, phoneNumber: true } },
          items: { include: { product: { select: { id: true, name: true, stock: true, reservedStock: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }) as Promise<OrderSnapshot[]>,
      prisma.product.findMany({
        where: { vendorId },
        select: { id: true, name: true, stock: true, reservedStock: true },
      }),
      prisma.order.findMany({
        where: { vendorId, status: 'PENDING' },
        include: {
          customer: { select: { id: true, name: true, phoneNumber: true } },
          items: { include: { product: { select: { id: true, name: true, stock: true, reservedStock: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }) as Promise<OrderSnapshot[]>,
    ]);

    const { current, previous } = splitPeriods(orders, currentStart, previousStart);
    const currentRevenue = sumRevenue(current);
    const previousRevenue = sumRevenue(previous);

    const abandonedOrders = orders.filter(order => order.status === 'CANCELED' && new Date(order.createdAt) >= currentStart);
    const pendingTotal = pendingOrders.reduce((sum, order) => sum + toNumber(order.total), 0);
    const abandonedTotal = abandonedOrders.reduce((sum, order) => sum + toNumber(order.total), 0);

    const revenueOrders = current.filter(isRevenueOrder);
    const topProducts = buildTopProducts(current);
    const topProduct = topProducts[0];
    const pendingCustomers = buildPendingCustomers(pendingOrders);
    const timeline = buildTimeline(orders, 30);

    const lowStockProducts = products
      .filter(product => product.stock - product.reservedStock <= 5)
      .map(product => product.name);

    const bestDay = timeline
      .slice()
      .sort((a, b) => Number(b.revenue.replace(/[^0-9.-]/g, '')) - Number(a.revenue.replace(/[^0-9.-]/g, '')))[0] ?? null;

    const reportBase: InsightReport = {
      period,
      generatedAt: new Date().toISOString(),
      summary: '',
      metrics: [
        {
          label: 'Revenue',
          value: formatMoney(currentRevenue),
          detail: `${formatChange(currentRevenue, previousRevenue)} for ${periodLabel(period)}.`,
          tone: currentRevenue >= previousRevenue ? 'positive' : 'warning',
        },
        {
          label: 'Awaiting payment',
          value: formatMoney(pendingTotal),
          detail: pendingTotal > 0 ? `${pendingCustomers.length} customer${pendingCustomers.length === 1 ? '' : 's'} still need to complete payment.` : 'No pending orders are waiting for payment.',
          tone: pendingTotal > 0 ? 'warning' : 'positive',
        },
        {
          label: 'Abandoned checkout',
          value: formatMoney(abandonedTotal),
          detail: abandonedTotal > 0 ? `${abandonedOrders.length} checkout${abandonedOrders.length === 1 ? '' : 's'} were cancelled before payment.` : 'No checkout cancellations in the selected period.',
          tone: abandonedTotal > 0 ? 'warning' : 'positive',
        },
        {
          label: 'Low stock items',
          value: String(lowStockProducts.length),
          detail: lowStockProducts.length > 0 ? `${lowStockProducts.slice(0, 3).join(', ')} need attention.` : 'Inventory is healthy across the catalog.',
          tone: lowStockProducts.length > 0 ? 'warning' : 'positive',
        },
      ],
      insights: [],
      recommendations: [],
      suggestedQuestions: buildSuggestedQuestions(),
      topProducts,
      customers: pendingCustomers,
      timeline,
    };

    reportBase.insights = buildInsights(
      reportBase,
      currentRevenue,
      previousRevenue,
      pendingTotal,
      abandonedTotal,
      lowStockProducts,
      bestDay,
      topProduct,
    );

    reportBase.recommendations = buildRecommendations(topProduct, lowStockProducts, bestDay, pendingCustomers);
    reportBase.summary = (await generateNarrative(reportBase)) ?? buildFallbackSummary(reportBase, topProduct, bestDay, lowStockProducts);

    return reportBase;
  }

  static async ask(vendorId: bigint, period: InsightPeriod, question: string): Promise<InsightResponse> {
    const report = await this.build(vendorId, period);
    const answer = (await generateNarrative(report, question)) ?? buildFallbackAnswer(question, report);
    return { ...report, question, answer };
  }
}