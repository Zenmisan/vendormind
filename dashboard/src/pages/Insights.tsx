import { useState } from 'react';
import { RefreshCw, Sparkles, TrendingUp, Wallet, Package, AlertTriangle, CalendarDays, ArrowUpRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import InsightMetricCard from '../components/insights/InsightMetricCard';
import InsightQuestionChips from '../components/insights/InsightQuestionChips';
import InsightConversationPanel from '../components/insights/InsightConversationPanel';
import { useBusinessInsights } from '../lib/useBusinessInsights';

const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

const periodLabels: Record<'7d' | '30d', string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

const metricIcons = [TrendingUp, Wallet, AlertTriangle, Package];

// Strip markdown bold/italic so the summary reads as plain prose
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1');
}

// Split summary into paragraphs for better readability
function parseSummary(text: string): string[] {
  const clean = stripMarkdown(text);
  // Split on numbered list items or double newlines
  return clean
    .split(/(?:\n\n|\n(?=\d+\.))/g)
    .map(p => p.trim())
    .filter(Boolean);
}

export default function Insights() {
  const { period, setPeriod, data, messages, loading, asking, error, refresh, ask } = useBusinessInsights(VENDOR_ID);
  const [lastPicked, setLastPicked] = useState('');

  const handlePick = async (question: string) => {
    setLastPicked(question);
    await ask(question);
  };

  const summaryParagraphs = parseSummary(data?.summary || '');

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="insights" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem', overflowX: 'hidden', maxWidth: '100%' }}>

        {/* ── Header ── */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <div>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '0.65rem' }}>
              <Sparkles size={13} />
              AI Business Insights
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Your AI business analyst
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: '0.3rem', margin: '0.3rem 0 0' }}>
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

        {/* ── Main content — stacked single column with natural flow ── */}
        <div className="animate-fade-up-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Summary card ── */}
          <section className="card-raised" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(59,130,246,0.06) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="badge" style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--brand)' }}>
                  <Sparkles size={13} />
                  AI Business Analyst
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                  {periodLabels[period]}
                </span>
                {data?.generatedAt && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-3)' }}>
                    Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.9rem', color: 'var(--text)' }}>
              What happened, why it happened, and what to do next
            </h2>

            {loading ? (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {[85, 75, 65, 55].map(w => (
                  <div key={w} className="skeleton" style={{ height: 16, width: `${w}%` }} />
                ))}
              </div>
            ) : summaryParagraphs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {summaryParagraphs.map((para, i) => (
                  <p key={i} style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-2)' }}>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-3)' }}>
                No insights available. Click Refresh to generate.
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
              {['Revenue trend', 'Unpaid orders', 'Best products', 'Restock signals'].map(item => (
                <span key={item} className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>
                  <ArrowUpRight size={11} />
                  {item}
                </span>
              ))}
            </div>
          </section>

          {/* ── 4 Metric cards ── */}
          <div className="insights-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
            {(data?.metrics || Array.from({ length: 4 }, (_, i) => ({
              label: ['Revenue', 'Awaiting payment', 'Abandoned checkout', 'Low stock items'][i],
              value: '—',
              detail: 'Loading…',
              tone: 'neutral' as const,
            }))).map((metric, i) => (
              <InsightMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
                Icon={metricIcons[i] || TrendingUp}
              />
            ))}
          </div>

          {/* ── Question chips ── */}
          <InsightQuestionChips
            questions={data?.suggestedQuestions || [
              'How is my business doing?',
              'What products are performing best?',
              'Which customers have not paid yet?',
              'What should I restock next?',
              'What should I do to increase sales?',
            ]}
            onPick={handlePick}
          />

          {error && (
            <div className="card" style={{ padding: '1rem', borderColor: 'rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.04)' }}>
              <p style={{ margin: 0, color: '#ef4444', fontWeight: 700 }}>{error}</p>
            </div>
          )}

          {/* ── Bottom: Business signals + AI chat (2-col on wide, stacked on narrow) ── */}
          <div className="insights-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Business signals */}
            <section className="card-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Business signals</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>
                    Interpretation of the numbers that matter most.
                  </p>
                </div>
                <div className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', flexShrink: 0 }}>
                  <CalendarDays size={13} />
                  {periodLabels[period]}
                </div>
              </div>

              {/* Insight items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />
                  ))
                ) : (data?.insights || []).length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-3)' }}>No signals available yet.</p>
                ) : (
                  (data?.insights || []).map(item => (
                    <div key={item.title} className="card" style={{
                      padding: '0.85rem 1rem',
                      borderLeft: `3px solid ${item.tone === 'positive' ? '#16a34a' : item.tone === 'warning' ? '#d97706' : item.tone === 'critical' ? '#ef4444' : '#3b82f6'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem' }}>{item.title}</p>
                          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-2)', fontSize: '0.8rem', lineHeight: 1.6 }}>{item.description}</p>
                        </div>
                        <span className="badge" style={{
                          background: item.tone === 'positive' ? 'rgba(22,163,74,0.08)' : item.tone === 'warning' ? 'rgba(245,158,11,0.08)' : item.tone === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                          color: item.tone === 'positive' ? '#16a34a' : item.tone === 'warning' ? '#d97706' : item.tone === 'critical' ? '#ef4444' : '#3b82f6',
                          flexShrink: 0, fontSize: '0.68rem',
                        }}>
                          {item.tone}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Recommended actions */}
              {(data?.recommendations || []).length > 0 && (
                <div className="card" style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.7rem' }}>Recommended actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {(data?.recommendations || []).map((item, i) => (
                      <div key={item} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <span className="badge" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--brand)', minWidth: 24, justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text-2)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product performance */}
              {(data?.topProducts || []).length > 0 && (
                <div className="card" style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.7rem' }}>Product performance</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {(data?.topProducts || []).slice(0, 4).map(product => (
                      <div key={product.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{product.name}</p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.74rem', color: 'var(--text-3)' }}>{product.unitsSold} units sold · {product.available} available</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p className="mono" style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem' }}>{product.revenue}</p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--text-3)' }}>Stock {product.stock} / Reserved {product.reservedStock}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* AI conversational panel */}
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
