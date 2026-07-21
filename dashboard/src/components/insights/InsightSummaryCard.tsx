import { ArrowUpRight, CalendarRange, Sparkles } from 'lucide-react';

interface Props {
  summary: string;
  generatedAt: string;
  periodLabel: string;
  loading?: boolean;
}

export default function InsightSummaryCard({ summary, generatedAt, periodLabel, loading }: Props) {
  return (
    <section className="card-raised" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(22,163,74,0.11) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div className="badge" style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--brand)', marginBottom: '0.75rem' }}>
            <Sparkles size={13} />
            AI Business Analyst
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            What happened, why it happened, and what to do next
          </h2>
        </div>
        <div style={{ display: 'grid', gap: '0.5rem', textAlign: 'right', flexShrink: 0 }}>
          <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', justifySelf: 'end' }}>
            <CalendarRange size={13} />
            {periodLabel}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Updated {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 18, width: '85%' }} />
            <div className="skeleton" style={{ height: 18, width: '75%' }} />
            <div className="skeleton" style={{ height: 18, width: '65%' }} />
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.8, color: 'var(--text-2)', maxWidth: 880 }}>
            {summary}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
        {['Revenue trend', 'Unpaid orders', 'Best products', 'Restock signals'].map((item) => (
          <span key={item} className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
            <ArrowUpRight size={12} />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}