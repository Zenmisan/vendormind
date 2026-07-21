const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

export type InsightPeriod = '7d' | '30d';
export type InsightTone = 'positive' | 'neutral' | 'warning' | 'critical';
export type InsightRole = 'user' | 'assistant';

export interface InsightMetric {
  label: string;
  value: string;
  detail: string;
  tone: InsightTone;
}

export interface InsightCard {
  title: string;
  description: string;
  tone: InsightTone;
}

export interface InsightProduct {
  id: string;
  name: string;
  revenue: string;
  unitsSold: number;
  available: number;
  stock: number;
  reservedStock: number;
}

export interface InsightCustomer {
  id: string;
  name: string;
  phoneNumber: string;
  pendingAmount: string;
  lastOrderAt: string;
  ordersCount: number;
}

export interface InsightTimelinePoint {
  day: string;
  revenue: string;
  orders: number;
}

export interface BusinessInsightsResponse {
  period: InsightPeriod;
  generatedAt: string;
  summary: string;
  metrics: InsightMetric[];
  insights: InsightCard[];
  recommendations: string[];
  suggestedQuestions: string[];
  topProducts: InsightProduct[];
  customers: InsightCustomer[];
  timeline: InsightTimelinePoint[];
}

export interface InsightConversationMessage {
  role: InsightRole;
  content: string;
}

export interface BusinessInsightsAskResponse extends BusinessInsightsResponse {
  question: string;
  answer: string;
}

export async function fetchBusinessInsights(vendorId: string, period: InsightPeriod): Promise<BusinessInsightsResponse> {
  const res = await fetch(`${API}/vendors/${vendorId}/insights?period=${period}`);
  if (!res.ok) throw new Error('Failed to load business insights');
  return res.json() as Promise<BusinessInsightsResponse>;
}

export async function askBusinessInsights(vendorId: string, period: InsightPeriod, question: string): Promise<BusinessInsightsAskResponse> {
  const res = await fetch(`${API}/vendors/${vendorId}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period, question }),
  });

  if (!res.ok) throw new Error('Failed to ask business insights');
  return res.json() as Promise<BusinessInsightsAskResponse>;
}