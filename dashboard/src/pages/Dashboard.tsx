import { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, Send, AlertTriangle, RefreshCw, Wallet, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

interface OpsData {
  queues: {
    inbound:  { waiting: number; active: number; completed: number; failed: number };
    outbound: { waiting: number; active: number; completed: number; failed: number };
  };
  activeConversations: number;
  lowBalanceVendors: Array<{ id: string; name: string; balance: number }>;
}

export default function Dashboard() {
  const [ops, setOps] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ops/dashboard`);
      if (res.ok) setOps(await res.json() as OpsData);
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { load(); }, []);

  const stats = ops ? [
    {
      label: 'Active Conversations',
      value: ops.activeConversations,
      sub: 'last 5 min',
      Icon: MessageSquare,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
    {
      label: 'Messages Processed',
      value: ops.queues.inbound.completed.toLocaleString(),
      sub: 'total inbound',
      Icon: TrendingUp,
      color: '#16a34a',
      bg: 'rgba(22,163,74,0.1)',
    },
    {
      label: 'Replies Sent',
      value: ops.queues.outbound.completed.toLocaleString(),
      sub: 'total outbound',
      Icon: Send,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
    },
    {
      label: 'Failed Jobs',
      value: ops.queues.inbound.failed + ops.queues.outbound.failed,
      sub: 'inbound + outbound',
      Icon: AlertTriangle,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
    },
  ] : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="dashboard" />

      <main style={{ flex: 1, padding: '2rem 2.5rem', overflowX: 'hidden' }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={loading} style={{ marginTop: '0.25rem' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Stat grid */}
        <div className="animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stat-card">
                  <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, marginBottom: '0.875rem' }} />
                  <div className="skeleton" style={{ width: '55%', height: 28, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '70%', height: 14 }} />
                </div>
              ))
            : stats.map((s, i) => (
                <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="stat-card-icon" style={{ background: s.bg }}>
                    <s.Icon size={17} color={s.color} />
                  </div>
                  <div className="stat-card-value mono">{s.value}</div>
                  <div className="stat-card-label">{s.label}</div>
                  <div className="stat-card-sub">{s.sub}</div>
                </div>
              ))}
        </div>

        {/* Bottom row */}
        <div className="animate-fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Queue status */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Activity size={14} color="var(--text-3)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>Queue Status</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
              </div>
            ) : ops ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { name: 'Inbound', q: ops.queues.inbound },
                  { name: 'Outbound', q: ops.queues.outbound },
                ].map(({ name, q }) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>{name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {q.completed} done · {q.failed} failed
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Waiting', val: q.waiting,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                        { label: 'Active',  val: q.active,   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                        { label: 'Failed',  val: q.failed,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                      ].map(({ label, val, color, bg }) => (
                        <span key={label} className="badge" style={{ background: bg, color }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {val} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Could not load queue data.</p>
            )}
          </div>

          {/* Low balance vendors */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Wallet size={14} color="var(--text-3)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>Low Balance Vendors</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 36 }} />)}
              </div>
            ) : ops?.lowBalanceVendors.length ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ops.lowBalanceVendors.map((v, i) => (
                  <div key={v.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0',
                    borderBottom: i < ops.lowBalanceVendors.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0, color: 'var(--text)' }}>{v.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', margin: '0.1rem 0 0' }}>ID #{v.id}</p>
                    </div>
                    <span className="mono" style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: v.balance < 0 ? '#ef4444' : '#f59e0b',
                    }}>
                      ₦{(v.balance * 500).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', gap: '0.5rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#16a34a" />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>All vendors healthy</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
