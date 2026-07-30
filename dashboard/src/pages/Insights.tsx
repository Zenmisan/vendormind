import { useState } from 'react';
import { ArrowRight, RefreshCw, Sparkles, TrendingUp, Wallet, Package, Users, AlertTriangle, CalendarDays } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import InsightMetricCard from '../components/insights/InsightMetricCard';
import InsightSummaryCard from '../components/insights/InsightSummaryCard';
import InsightQuestionChips from '../components/insights/InsightQuestionChips';
import InsightConversationPanel from '../components/insights/InsightConversationPanel';
import { useBusinessInsights } from '../lib/useBusinessInsights';

const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

const periodLabels: Record<'7d' | '30d', string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

const metricIcons = [TrendingUp, Wallet, AlertTriangle, Package];

export default function Insights() {
  const { period, setPeriod, data, messages, loading, asking, error, refresh, ask } = useBusinessInsights(VENDOR_ID);
  const [lastPicked, setLastPicked] = useState('');

  const handlePick = async (question: string) => {
    setLastPicked(question);
    await ask(question);
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="insights" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem', overflowX: 'hidden' }}>
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '0.65rem' }}>
              <Sparkles size={13} />
              AI Business Insights
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Your AI business analyst
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>
              Ask what happened, why it happened, and what to do next without digging through raw reports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className="filter-pills">
              {(Object.keys(periodLabels) as Array<'7d' | '30d'>).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPeriod(option)}
                  className={period === option ? 'filter-pill active' : 'filter-pill'}
                >
                  {periodLabels[option]}
                </button>
              ))}
            </div>
            <button className="btn-ghost" onClick={refresh} disabled={loading || asking}>
              <RefreshCw size={13} style={{ animation: loading || asking ? 'spin-slow 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        <div className="dashboard-grid animate-fade-up-1" style={{ display: 'grid', gap: '1.25rem' }}>
          <InsightSummaryCard
            summary={data?.summary || 'Loading business insights...'}
            generatedAt={data?.generatedAt || new Date().toISOString()}
            periodLabel={periodLabels[period]}
            loading={loading}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
            {(data?.metrics || Array.from({ length: 4 }, (_, index) => ({
              label: ['Revenue', 'Awaiting payment', 'Abandoned checkout', 'Low stock items'][index] || 'Metric',
              value: '...',
              detail: 'Loading insight data...',
              tone: 'neutral' as const,
            }))).map((metric, index) => (
              <InsightMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
                Icon={metricIcons[index] || TrendingUp}
              />
            ))}
          </div>

          <InsightQuestionChips
            questions={data?.suggestedQuestions || [
              'How is my business doing?',
              'What products are performing best?',
              'What should I restock next?',
            ]}
            onPick={handlePick}
          />

          {error && (
            <div className="card" style={{ padding: '1rem', borderColor: 'rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.04)' }}>
              <p style={{ margin: 0, color: '#ef4444', fontWeight: 700 }}>{error}</p>
            </div>
          )}

          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.25rem', alignItems: 'start' }}>
            <section className="card-raised" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Business signals</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>Interpretation of the numbers that matter most.</p>
                </div>
                <div className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  <CalendarDays size={13} />
                  {periodLabels[period]}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {(data?.insights || []).map((item) => (
                  <div key={item.title} className="card" style={{ padding: '0.95rem 1rem', borderLeft: `3px solid ${item.tone === 'positive' ? '#16a34a' : item.tone === 'warning' ? '#d97706' : item.tone === 'critical' ? '#ef4444' : '#3b82f6'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>{item.title}</p>
                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.6 }}>{item.description}</p>
                      </div>
                      <span className="badge" style={{ background: item.tone === 'positive' ? 'rgba(22,163,74,0.08)' : item.tone === 'warning' ? 'rgba(245,158,11,0.08)' : item.tone === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', color: item.tone === 'positive' ? '#16a34a' : item.tone === 'warning' ? '#d97706' : item.tone === 'critical' ? '#ef4444' : '#3b82f6' }}>
                        {item.tone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Recommended actions</h3>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {(data?.recommendations || []).map((item, index) => (
                    <div key={item} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <span className="badge" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--brand)', minWidth: 26, justifyContent: 'center' }}>{index + 1}</span>
                      <span style={{ fontSize: '0.84rem', lineHeight: 1.7, color: 'var(--text-2)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Product performance</h3>
                <div style={{ display: 'grid', gap: '0.7rem' }}>
                  {(data?.topProducts || []).slice(0, 4).map((product) => (
                    <div key={product.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700 }}>{product.name}</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-3)' }}>{product.unitsSold} units sold • {product.available} available</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="mono" style={{ margin: 0, fontWeight: 800 }}>{product.revenue}</p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-3)' }}>Stock {product.stock} / Reserved {product.reservedStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <InsightConversationPanel
              messages={messages}
              onAsk={handlePick}
              loading={asking || loading}
              suggestedPrompt={lastPicked || 'Ask a question and the AI will respond with a direct business recommendation.'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}