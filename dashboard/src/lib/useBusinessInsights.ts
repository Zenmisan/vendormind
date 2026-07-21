import { useEffect, useState } from 'react';
import { askBusinessInsights, fetchBusinessInsights } from './insightsApi';
import type { BusinessInsightsResponse, InsightConversationMessage, InsightPeriod } from './insightsApi';

export function useBusinessInsights(vendorId: string) {
  const [period, setPeriod] = useState<InsightPeriod>('7d');
  const [data, setData] = useState<BusinessInsightsResponse | null>(null);
  const [messages, setMessages] = useState<InsightConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchBusinessInsights(vendorId, period);
      setData(payload);
      setMessages([{ role: 'assistant', content: payload.summary }]);
    } catch (err: any) {
      setError(err.message || 'Failed to load business insights');
      setData(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setAsking(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);

    try {
      const payload = await askBusinessInsights(vendorId, period, trimmed);
      setData(payload);
      setMessages(prev => [...prev, { role: 'assistant', content: payload.answer }]);
    } catch (err: any) {
      const fallback = err.message || 'Failed to answer your question';
      setError(fallback);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    } finally {
      setAsking(false);
    }
  };

  useEffect(() => {
    if (!vendorId) return;
    load();
  }, [vendorId, period]);

  return {
    period,
    setPeriod,
    data,
    messages,
    loading,
    asking,
    error,
    refresh: load,
    ask,
  };
}